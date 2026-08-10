# SECURITY REVIEW REQUEST

Change summary:

- Added Supademo Password Protect chapter support to the canonical chapter model, the ChapterEditor, and the DemoViewer. The dormant `gate` chapter type is now a first-class "Password protected" chapter: the editor exposes bounded password settings (password, button text, background color, text color), and the viewer blocks all chapter content behind an access form until the correct password is entered. Only a self-describing one-way PBKDF2-HMAC-SHA256 digest of the trimmed password is ever stored — the plaintext password is never persisted, logged, rendered, or placed in a URL. This is the smallest safe local-preview slice: it uses the platform Web Crypto PBKDF2 primitive (standard password derivation, not custom cryptography) and does not weaken existing authentication. Per review, password protection applies only to `gate` chapters (a `passwordProtection` on any other type is ignored), and the editor never creates a gate object until a password is saved.

Files changed:

- packages/domain/src/chapter-model.ts (ChapterPasswordProtection model, hashChapterPassword/verifyChapterPassword via Web Crypto, parseChapterPasswordProtection, DemoChapter.passwordProtection + parser wiring)
- packages/domain/src/index.ts (export hashChapterPassword, parseChapterPasswordProtection, verifyChapterPassword, type ChapterPasswordProtection)
- packages/domain/src/publication-pipeline.ts (re-normalize passwordProtection on publish)
- apps/web/components/editor/chapter-editor.tsx ("Password protected" gate type + ChapterGateSettings)
- apps/web/components/editor-shell.tsx (passwordProtection default on new chapters + re-normalization in handleUpdateChapter)
- apps/web/components/demo-viewer.tsx (gate state, locked rendering replacing chapter content, generic failure, voiceover autoplay gating)
- apps/web/app/globals.css (password gate form styles)
- tests/chapter-model.test.mjs, tests/chapter-editor.test.mjs, tests/demo-viewer-password-gate.test.mjs (new regression tests)
- docs/reviews/TASK-password-protect-security-handoff.md (this file)

Trust boundaries and sensitive data affected:

- Untrusted serialized demo documents can now carry a `passwordProtection` object whose hash and appearance fields were previously ignored. The hash is compared client-side in the viewer; the appearance fields are rendered as inline CSS values (backgroundColor/textColor) from allowlisted `#RRGGBB` colors only.
- The plaintext password crosses exactly one boundary: from the author's keyboard into the Web Crypto digest, staying in local component state in the editor. It never enters the chapter object, the serialized document, local storage, analytics, logs, or URLs.
- A viewer's submitted password is hashed in-memory and compared with a constant-time comparison; it is never persisted.

Authorization model:

- No new endpoints, permissions, or server enforcement. This is a local-preview slice: the viewer verifies the digest client-side, which constrains honest viewers but cannot stop a determined attacker from reading the demo's source. Production access control must be enforced server-side (see residual risks). Editor mutations flow through the existing readOnly-gated handlers; the editor clears passwordProtection when a chapter type is switched away from `gate`.

Evidence limitation (documented honestly):

- Behavior follows the official docs page https://docs.supademo.com/customize/chapters/password-protect (select "Password protected" as the chapter type, set a password in the Password settings section, customize button text/background color/text color; gating limits distribution to intended audiences). The live app is login-gated, so no live end-to-end capture of the hosted product was possible; the local app behavior (editor controls, viewer gate, sanitized input) was verified in a browser session.

Threats considered:

- Plaintext password leakage into the stored chapter, serialized document, URL, analytics, logs, or DOM.
- Reversible or weak custom cryptography (avoided: uses the platform Web Crypto PBKDF2-HMAC-SHA256 standard primitive; no custom crypto or new algorithms).
- Timing side channels in hash comparison (constant-time comparison used).
- Bypassing the gate by reading the hash and replaying it (inherent to client-side verification; documented as the production boundary).
- Malicious/oversized hashes, button text, or color values reaching the DOM (bounded and allowlisted at the parser).
- XSS via rendered gate content (all content rendered as text; colors are allowlisted hex).
- Regressions to existing chapters, forms, branching, voiceovers, and navigation.
- A gate chapter leaking its body/buttons/voiceover while locked (content is not rendered at all while locked; voiceover autoplay is gated off).

Security controls implemented:

- `hashChapterPassword` uses the platform Web Crypto PBKDF2-HMAC-SHA256 primitive (`crypto.subtle.importKey` + `deriveBits`) with a random 16-byte salt and 100,000 iterations on the trimmed, 128-char-bounded password — standard password derivation, no custom cryptography, no `node:crypto` import in client bundles. The stored value is self-describing: `pbkdf2-sha256$<iterations>$<saltHex>$<keyHex>`.
- `verifyChapterPassword` parses the stored format, bounds iterations to [1,000, 600,000] (a floor so hand-crafted documents cannot publish trivially weak gates, and a ceiling as a CPU-cost DoS guard so an untrusted document cannot force unbounded work), and compares the derived key with a constant-time hex comparison; a null, malformed, under- or over-iterated stored hash never matches, so bad gates fail closed.
- `parseChapterPasswordProtection` accepts only the exact PBKDF2 format with iterations in [1,000, 600,000] (anything else → null hash, gate stays locked), bounds buttonText to 96 chars (default "Unlock"), and allowlists backgroundColor/textColor via the existing `safeColor` (#RRGGBB only). Absent `passwordProtection` → null (legacy chapters unchanged). `parseDemoChapter` and the viewer only honor `passwordProtection` on `type === "gate"` chapters; a (possibly malformed) protection on any other chapter type is ignored and never gates it.
- The editor's password input is `type="password"` with `autoComplete="new-password"` and `maxLength` 128; the plaintext exists only in local component state and is replaced by the digest on Save. The draft is cleared after a successful save, on chapter switch, and on "Remove protection"; the button-text/color fields only render once a password has been saved, so appearance edits can never create a gate with a null hash. Switching the chapter type away from `gate` clears the whole object.
- The viewer renders the gate form instead of the chapter content when locked (body, buttons, form, media, and voiceover are not in the DOM), shows a generic "Incorrect password" failure with `role="alert"`, bounds input to 128 chars, disables the button while deriving, and fails closed ("temporarily unavailable") if the Web Crypto API is unavailable. The chapter voiceover autoplay effect is suppressed while locked.
- Publication re-normalizes `passwordProtection` through the parser so a published manifest can only carry valid hashes.

Security tests added:

- Parser: gate chapter parses bounded protection; malformed and over-iterated hashes fail closed to null hash; password protection on a non-`gate` chapter is ignored (never gates it); absent protection keeps legacy chapters open (tests/chapter-model.test.mjs).
- Hashing: PBKDF2 self-describing format, random salt (two hashes of the same password differ), trim normalization, plaintext never appears in the digest, verify matches/mismatches, null/malformed/over-iterated hash rejection (tests/chapter-model.test.mjs).
- Editor contract: gate type label, ChapterGateSettings fields (password/button text/background/text color), hash + parse wiring, remove, type-switch clearing, read-only (tests/chapter-editor.test.mjs).
- Viewer: locked rendering blocks content, no stored-hash/plaintext rendering, generic failures, voiceover autoplay gating, legacy/unlocked unaffected (tests/demo-viewer-password-gate.test.mjs).

Checks run and results:

- Focused: node --test tests/chapter-model.test.mjs tests/chapter-editor.test.mjs tests/demo-viewer-password-gate.test.mjs tests/demo-viewer-chapter-voiceover.test.mjs tests/branching-graph.test.mjs tests/branching-authoring.test.mjs tests/publication-pipeline.test.mjs tests/demo-document.test.mjs — 50 passed, 0 failed, 0 skipped.
- npm test (production build + full suite) — build passed; 591 tests, 590 passed, 1 skipped, 0 failed.
- npm run format:check — passed.
- npm run lint — passed.
- npm run check:boundaries — passed.
- npm run typecheck — passed (tsc --build + next typegen + tsc --noEmit for @supademo/web).
- npm audit --omit=dev --audit-level=high — 0 vulnerabilities.
- Browser verification in the local app (Chrome): the ChapterEditor "Password protected" type and password settings were reached; the viewer showed the gate form for a locked chapter, rejected a wrong password with the generic error, unlocked with the correct password, and legacy chapters rendered unchanged.

Checks not run:

- Live Supademo app behavior could not be captured (login-gated); see the evidence limitation above.
- No automated browser-level test harness for the gate interaction was added in this slice (verified manually in the local app).

Dependencies or infrastructure permissions added:

- None. No new packages, services, IAM actions, or cloud configuration.

Known limitations and residual risks:

- Client-side verification is not real access control: anyone who can view the published demo document can extract the PBKDF2 digest and (because the password space is small/guessable in practice) brute-force or replay it. This slice deliberately implements the smallest safe local-preview behavior. Production must enforce password gating server-side (e.g., a server-rendered challenge or a server-side session) and store passwords with a server-side KDF (scrypt/bcrypt/argon2) rather than deriving in the viewer.
- The local preview derives the chapter gate with salted PBKDF2-HMAC-SHA256 in the viewer: 100,000 iterations and a random per-chapter salt on the trimmed, 128-char-bounded password. In-browser derivation means the digest ships in the published manifest (anyone with document access sees it), and client-side iteration is deliberately capped (1,000–600,000) as a CPU-cost guard. Production should derive server-side with a stronger KDF or higher iterations on server hardware rather than in the viewer.
- The hash is stored in the demo document and published manifest; it is not a secret-protected credential. Anyone with document access sees the digest.
- The unlocked state (`unlockedChapterIds`) is per-viewer-session client state and resets on reload; a reload requires the password again, which matches the gating intent.
- `hashChapterPassword` requires the Web Crypto API (secure contexts, modern browsers, Node >= 20). If unavailable, the viewer fails closed with a generic message rather than bypassing the gate.
- A `passwordProtection` serialized on a non-`gate` chapter type (e.g., a hand-edited document) is ignored by the canonical parser and the viewer, so it never gates such a chapter; the editor also clears the field when switching a chapter type away from `gate`.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: unavailable in this environment; human/Claude review remains required before production use.
