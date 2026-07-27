# Iconography and media presentation

TASK-018 establishes the approved icon and media primitives for the creator and viewer experiences.

## Icons

- Import named icons from `@supademo/ui`; named exports keep unused icons tree-shakeable.
- Icons are decorative by default. Add `label` when the icon itself communicates meaning outside an adjacent text label.
- Icon-only controls must still use an accessible control label, for example `IconButton` with `aria-label="Search"`.
- Icons use `currentColor`, a consistent 24-unit view box, and `focusable="false"` so their color follows the control and they do not become independent keyboard stops.
- Do not introduce product-logo copies, arbitrary icon fonts, inline third-party SVG markup, or raw SVG strings.

## Images and thumbnails

Use `Image` when intrinsic dimensions are known. `alt`, `width`, and `height` are required so the browser can reserve space and reduce layout shift. Failed, missing, or disallowed images render `MediaFallback` instead of a broken image.

Use `Thumbnail` for demo cards and lists. It provides stable dimensions for `sm`, `md`, and `lg` sizes and uses `object-fit: cover` for consistent card presentation. Use `AspectRatio` when a composed media surface needs a custom ratio.

Remote images are disabled by default. If a product surface needs remote media, the caller must pass an HTTPS origin from a server-controlled allowlist using `allowRemote` and `remoteOrigins`. Do not pass arbitrary user-provided origins, and do not allow `data:`, `blob:`, protocol-relative, or non-HTTPS sources through the component.

## Device frames

Use `DeviceFrame` only for product screenshots and demo previews. It supports `desktop`, `tablet`, and `phone` proportions, keeps the screen content bounded, and includes a visually hidden caption for assistive technology. The frame is presentation chrome; the captured product UI remains ordinary DOM or an approved image asset.

## Asset rules

- Prefer same-origin assets served through the application or its approved asset pipeline.
- Store product screenshots with explicit dimensions and meaningful alternative text.
- Treat screenshot contents as untrusted display data; never inject screenshot text into HTML.
- Keep fallbacks neutral and informative. Do not use a fallback that looks like a successful load.
- Visual regression coverage should include cards, responsive thumbnails, each device frame, and failed-image states before release.
