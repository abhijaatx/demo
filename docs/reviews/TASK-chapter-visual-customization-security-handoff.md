SECURITY REVIEW REQUEST

Change summary:

- Integrated Supademo chapter visual customization (layout, theme, custom background color, opacity, blur) into the canonical DemoChapter schema/parser, the real ChapterEditor, and the DemoViewer for non-form chapters, with bounded validation and safe rendering. Form chapters keep their existing appearance fields and gain blurred-background rendering. Defaults are backwards-compatible so existing chapters render identically.

Files changed:

- packages/domain/src/form-schemas.ts (exported shared `safeColor` and `boundedRange` helpers)
- packages/domain/src/chapter-model.ts (DemoChapter visual fields + parser normalization)
- packages/domain/src/index.ts (exported ChapterLayout/ChapterTheme types)
- apps/web/components/editor/chapter-editor.tsx (ChapterAppearanceSettings for all chapter types)
- apps/web/components/editor-shell.tsx (default visual fields on new chapters)
- apps/web/components/demo-viewer.tsx (chapter visual rendering wiring)
- apps/web/app/globals.css (chapter backdrop/theme/layout/blur CSS)
- tests/chapter-model.test.mjs (parser bounds/defaults/unsafe color tests)
- tests/chapter-editor.test.mjs (editor appearance control contract tests)
- tests/demo-viewer-chapter-visuals.test.mjs (viewer wiring and CSS regression tests)
- docs/reviews/TASK-chapter-visual-customization-security-handoff.md (this file)

Trust boundaries and sensitive data affected:

- Untrusted serialized demo documents (local drafts, published manifests, share links) flow through `parseDemoChapter`; the new visual fields are attacker-controllable authoring values that were previously ignored.
- The chapter custom color, layout/theme enums, opacity, and blur are rendered into the viewer DOM and CSS.

Authorization model:

- No new endpoints, permissions, or persistence paths were added. Chapters remain bound to their demo document; authoring happens through the existing editor state with readOnly gating. The viewer renders only parsed, normalized chapter data.

Evidence limitation (documented honestly):

- The Supademo docs page https://docs.supademo.com/customize/chapters was fetched and confirmed: Layout (left/center/right), Theme (dark/light/custom), opacity and blur adjust the chapter background, and title/description/buttons remain visible, with a Save action. The live app behavior (save + viewer preview) could NOT be verified end-to-end because the live app is login-gated; behavior was implemented to match the documented controls and the existing local /chapters workbench rather than a live capture.

Threats considered:

- CSS injection / style-string injection via the custom background color (e.g. `#fff;background-image:url(...)`, `url(javascript:...)`, `expression(...)`).
- Type confusion in opacity/blur (strings, NaN, Infinity) producing invalid or extreme visual values.
- Enum smuggling in layout/theme producing unhandled CSS classes.
- Backdrop blur applied to text (readability regression) and content hidden behind the background layer.
- Regressions to existing form-chapter rendering (background image, theme, opacity) and to default chapter appearance.

Security controls implemented:

- `safeColor` allowlists exactly `#RRGGBB`; anything else (including CSS fragments, URLs, `url()` payloads) is rejected to null. No untrusted string is ever interpolated into a CSS value: the color flows only as an allowlisted value into a CSS custom property (`--chapter-color`), and the backdrop layer is always painted from a server-side-safe default or the allowlisted color.
- `boundedRange` clamps opacity to [0.2, 1] and blur to [0, 24] and falls back to defaults for non-finite or non-number input; blur is integer-rounded.
- Layout/theme enums are validated against fixed allowlists with backwards-compatible defaults (`center`/`light`).
- No `dangerouslySetInnerHTML`, `eval`, `new Function`, or untrusted CSS string construction anywhere in the changed rendering path.
- The background is rendered on a `::before` layer so blur/opacity never soften chapter text or buttons; form chapters keep their existing inline background handling and only gain blur when blurPx > 0 (default 0 = no change).
- Defaults (layout "center", theme "light", backgroundColor null, opacity 1, blurPx 0) preserve prior rendering exactly.

Security tests added:

- Parser: backwards-compatible defaults; valid values accepted; malformed enums, CSS-injection colors, non-string opacity/blur rejected or clamped (tests/chapter-model.test.mjs).
- Editor: appearance controls present for every chapter type with accessible labels and read-only disabling; legacy form appearance controls still bound (tests/chapter-editor.test.mjs).
- Viewer: layout/theme data attributes, bounded opacity/blur/color CSS variables, backdrop and form-blur classes, no arbitrary CSS string construction, no unsafe sinks (tests/demo-viewer-chapter-visuals.test.mjs).

Checks run and results:

- node --test tests/*.test.mjs — 558 tests, 557 passed, 1 skipped (pre-existing), 0 failed.
- npm run format:check — passed.
- npm run lint — passed.
- npm run check:boundaries — passed.
- npm run typecheck — passed (tsc --build + next typegen + tsc --noEmit for @supademo/web).

Checks not run:

- Browser-level visual verification of the viewer (dark theme, custom color, blur, left/right layout) was not automated; the local dev server was not exercised in this session. The implementation follows the existing /chapters workbench preview and the documented behavior.
- Live Supademo app behavior could not be captured (login-gated); see the evidence limitation above.

Dependencies or infrastructure permissions added:

- None. No new packages, services, IAM actions, or cloud configuration.

Known limitations and residual risks:

- Custom theme text color is not auto-adjusted for contrast; an author choosing a very dark custom background with default dark text may produce low-contrast text (authoring choice, not a security issue).
- For form chapters, blur is applied to the background layer only (a `::before` with `background: inherit` and `filter: blur(var(--form-blur))`), so form content stays crisp; blur defaults to 0 and only engages when an author opts in.
- For form chapters the new "Chapter appearance" section renders alongside the legacy form "Appearance" details, both bound to the same form fields. This is intentional UI duplication to satisfy the requirement that existing form controls keep working; values stay in sync because both edit the same data.
- Server-side persistence for chapters (database/API) was not touched; if visual fields later persist through a new API path, they must be re-normalized through `parseDemoChapter` at the boundary.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: pending in this environment; human/Claude review remains required before production use.
