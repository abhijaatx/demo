# UI laboratory

The reference UI laboratory is available at `/ui-lab` during local development. It is a direct, no-index route and is not part of the product's primary navigation.

## Reference journey

The route keeps the creator mental model visible at every stage:

1. **Record** — choose Screenshot, Import flow, or Template.
2. **Edit** — use the step rail, central canvas, and selected-object inspector.
3. **Share** — choose Link, Embed, Export, or Present, then publish.

The default view is simple. Advanced controls are behind one explicit toggle and appear only in the relevant stage. The UI laboratory uses native buttons, labeled fields, landmark regions, `aria-current="step"`, and 44px stage targets.

## Audit contract

- Desktop reference viewport: 1280×720.
- Mobile reference viewport: 390px wide.
- Stage navigation remains usable with keyboard focus and does not rely on color alone.
- The editor collapses from three columns to a single-column reading order on narrow screens.
- Reduced-motion preferences are honored by the shared stylesheet.
- `/ui-lab` is marked `noindex`; robots metadata is not access control and the route must remain deployment-protected if hosted outside local development.

## Shell cleanup

The authenticated shell now composes the existing `Sidebar`, `Header`, `Stack`, `Link`, `Button`, `IconButton`, and named icon primitives. Shell-specific selectors are limited to layout composition and responsive behavior; control, navigation, focus, and overlay styling stays in the shared UI layer.
