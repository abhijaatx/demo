# SECURITY REVIEW REQUEST

Change summary:

- Extended the canonical branching graph (`buildBranchingGraphFromDocument` in packages/domain/src/branching-graph.ts) so chapter nodes and their CTA buttons are represented alongside step/hotspot edges. Chapters are inserted into the deterministic sequence before the step at their `orderIndex` (chapters render before that step). `next` chapter buttons edge to the next sequence node, `step` buttons edge to their explicit `targetStepId`, and `url` buttons never become internal graph edges. Chapters without buttons retain a deterministic sequential edge. The existing no-chapter sequential graph contract is unchanged.

Files changed:

- packages/domain/src/branching-graph.ts (chapter nodes + CTA edges, sequence ordering, hotspot action filtering)
- tests/branching-graph.test.mjs (chapter CTA edges, sequential fallback, missing targets, unreachable/dead-end, hotspot behavior unchanged)
- tests/branching-authoring.test.mjs (chapter branches affect the diagnostic summary)
- tests/publication-pipeline.test.mjs (chapter fixture positioned at the end so the sanitized doc stays publishable under the chapter-aware graph)
- docs/reviews/TASK-conditional-branching-security-handoff.md (this file)

Trust boundaries and sensitive data affected:

- The branching graph is pure, deterministic computation over an already-parsed `DemoDocument`; it introduces no new endpoints, no persistence, and no network access.
- It consumes chapter CTA button data (label, actionType, targetStepId, url) and hotspot data. Edge labels derived from button/hotspot labels are later surfaced in the editor's branch-summary UI and diagnostics; they are never rendered as HTML.
- The critical trust decision: a chapter `url` button (external or relative URL) is deliberately never converted into an internal graph edge, so an attacker-controlled URL cannot be used to fabricate graph connectivity or hide dead ends.

Authorization model:

- No new operations. `buildBranchingGraphFromDocument` and `validateBranchingGraph` are exported pure functions used by the existing diagnostics summary in the editor. Tenant scoping of the underlying demo document is unchanged and happens before this code runs.

Evidence limitation (documented honestly):

- Behavior is based on the official docs page https://docs.supademo.com/customize/chapters/conditional-branching (viewers choose their own path; chapter CTA buttons can each link to a different demo step or URL; individual hotspots can have unique navigation targets; branching applies at both chapter CTA and hotspot levels) plus the existing local product behavior (ChapterButton actionType next/step/url, DemoViewer chapter button and hotspot navigation). The live app is login-gated, so no live end-to-end capture was possible; the implementation follows the documented and local behavior rather than a live capture.

Threats considered:

- Unsafe or malformed chapter button URLs being trusted as graph edges (would allow forged connectivity and mask dead ends).
- Regressing the existing no-chapter sequential graph contract or hotspot graph semantics.
- Missing/invalid `targetStepId` on step buttons producing silent dead ends without diagnostics.
- Non-deterministic node ordering when multiple chapters share the same `orderIndex`.
- Out-of-range `orderIndex` values producing malformed node positions.
- XSS via labels or titles flowing into diagnostics or editor UI.

Security controls implemented:

- `url` and `open_url`/`none` actions never produce internal edges; only `next` and explicit `step` targets do. A missing `step` target produces a diagnosable state rather than a fabricated edge.
- Sequence construction is deterministic: chapters at each position are emitted in document order (stable after `parseDemoDocument`'s orderIndex sort), and `orderIndex` is clamped into [0, steps.length] via `Math.floor`, so chapters cannot be positioned before the first node or after the last.
- Stable node IDs: chapter nodes use the chapter id, step nodes use the step id; labels are plain strings ("Step N: title", "Chapter: title") without HTML.
- `validateBranchingGraph` continues to report UNREACHABLE_NODE, DEAD_END_NODE, and MISSING_TARGET_NODE for both step and chapter nodes, and `generateBranchingDiagnosticSummary` feeds these into the editor's existing branch-summary publishability gate.
- No `dangerouslySetInnerHTML`, `eval`, or HTML injection in the graph layer; diagnostics carry message strings rendered as text by the editor.

Security tests added:

- Chapter CTA edges: a chapter with `next` + `step` + `url` buttons yields exactly two internal edges (to the next step and the explicit target); the URL button is excluded (tests/branching-graph.test.mjs).
- Sequential fallback: a button-less chapter between steps retains a deterministic sequential edge (s-1 → chapter → s-2).
- Missing chapter target: a `step` button targeting a non-existent step id is flagged MISSING_TARGET_NODE.
- Unreachable/dead-end: a start chapter whose only button is an external URL is a DEAD_END_NODE and the following step becomes UNREACHABLE_NODE.
- Hotspot unchanged: `open_url`/`none` hotspots remain excluded from internal edges, explicit `targetStepId` still wins, and default next-step fallback still applies (existing tests preserved).
- Diagnostic summary: chapter branches affect totalNodes/totalEdges/isPublishable in `generateBranchingDiagnosticSummary` (tests/branching-authoring.test.mjs).
- Publication fixture: the chapter sanitization test was updated so the chapter sits at the end (terminal node), keeping the doc publishable under the chapter-aware graph.

Checks run and results:

- node --test tests/branching-graph.test.mjs tests/branching-authoring.test.mjs tests/publication-pipeline.test.mjs tests/demo-document.test.mjs — 21 passed, 0 failed.
- node --test tests/*.test.mjs — 571 tests, 570 passed, 1 skipped (pre-existing), 0 failed.
- npm run format:check — passed.
- npm run lint — passed.
- npm run check:boundaries — passed.
- npm run typecheck — passed.

Checks not run:

- Browser-level verification of the editor branch-summary UI was not automated in a browser session.
- Live Supademo app behavior could not be captured (login-gated); see the evidence limitation above.

Dependencies or infrastructure permissions added:

- None. No new packages, services, IAM actions, or cloud configuration.

Known limitations and residual risks:

- The graph trusts node IDs: a `step` button targeting an id that collides with a different node's id in a malformed document will connect to that node. `parseDemoDocument` normalizes step/chapter ordering, and step ids are unique in practice, but the graph itself does not deduplicate duplicate node ids.
- A chapter positioned mid-sequence whose buttons are all `url` actions is reported as a dead end, which may be a false positive for demos intentionally ending in an external link. This is conservative and surfaced to the editor rather than silently hidden.
- Multiple chapters at the same `orderIndex` are ordered by their document array order (stable post-parse); the sequence is deterministic but the explicit tie-break rule is document order, matching how `normalizeChapterOrder` sorts chapters.
- Diagnostics messages embed node titles/labels as plain text; if a title contains control characters they would appear in the editor message verbatim (text-only rendering, no HTML).

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Claude review status: unavailable in this environment; human/Claude review remains required before production use.
