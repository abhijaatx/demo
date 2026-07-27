# Component workbench

The local component workbench is the repository's lightweight Storybook equivalent for TASK-019. It is available at `/workbench` during local development and is intentionally not linked from the product navigation or indexed by search engines.

## What it covers

- Controls: normal, disabled, loading, labeled fields, validation errors, checkbox, and switch states.
- Feedback: progress, skeleton, alert, empty, and dismissible banner states.
- Data display: selectable table, badges, tabs, and disabled tabs.
- Media: fixed-size thumbnails, fallback visuals, aspect-ratio surfaces, device frames, and blocked remote media.
- Progressive disclosure: Simple mode exposes the primary “Create demo” path; Advanced mode reveals viewer-path configuration and experiment controls.
- Themes and responsive baselines: light/dark theme toggle plus 1280×720 and 390×844 baseline contracts.

## Deterministic visual testing contract

`tests/visual-baselines/workbench-baselines.json` defines the route, viewports, themes, state matrix, stable section selectors, and browser controls expected from a screenshot runner. A future browser runner should block network access, freeze the clock, seed randomness, and reduce animation before capturing screenshots. The baseline contract avoids timestamps, random IDs in selectors, and live remote assets.

The current repository test checks the contract and source-level accessibility markers. Pixel capture and diff execution belong in the browser-backed visual workflow when that runner is enabled.

## Usage guidance

Use the workbench to verify a shared component before composing it into creator or viewer UI. Keep the product’s default journey simple: Record → Edit → Share. Advanced controls should remain contextual and must not become persistent top-level navigation or toolbar actions.
