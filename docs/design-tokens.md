# Product design tokens

TASK-011 establishes the shared visual contract for creator, viewer, dashboard, and editor surfaces. Application CSS consumes semantic custom properties; the canonical TypeScript values live in `packages/ui/src/tokens.ts`.

## Token groups

- Color: canvas, surface, text, border, brand, focus, success, warning, and state surfaces.
- Typography: the system font stack, the compact product type scale, weights, and line heights.
- Spacing: an 8px-oriented scale with 4px as the smallest unit.
- Radius and shadow: small control radii through rounded cards, plus restrained elevation and focus treatment.
- Motion: short interaction durations, a standard easing curve, and a skeleton duration.
- Z-index and breakpoints: named layering levels and the supported mobile/tablet/desktop/wide layout thresholds.

## CSS usage

Use semantic variables at the point of use. Do not copy the underlying hex values into a component.

```css
.button-primary {
  color: var(--color-on-brand);
  background: var(--color-brand);
  padding: 0 var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-button);
  transition: background var(--motion-duration-fast) var(--motion-ease-standard);
}
```

Use `var(--color-text-primary)` for headings and essential labels, `var(--color-text-secondary)` for supporting copy, and `var(--color-text-tertiary)` for metadata only. Use `var(--space-*)`, `var(--radius-*)`, and `var(--shadow-*)` for geometry and elevation.

## Theme contract

The document root selects a controlled theme and brand:

```html
<html data-theme="light" data-brand="blue"></html>
```

`data-theme="dark"` activates the dark semantic color set. `data-brand="violet"` activates the approved violet brand override. New brand overrides must be added to the allowlisted token contract and pass contrast tests before they are exposed.

## Accessibility and prohibited combinations

- All normal text and status text must meet WCAG 2.2 AA contrast against its actual background. The token test covers primary, secondary, brand, success, and warning pairings in both modes.
- Do not use raw hex/rgb colors, arbitrary spacing, arbitrary z-index values, or one-off shadows in application components.
- Do not use a subtle brand surface as text, or place secondary/tertiary text on a brand control, unless a contrast test explicitly proves the pairing.
- Do not communicate success, warning, error, or neutral state using color alone; pair color with text, iconography, or structure.
- Do not combine success and warning tokens in one status treatment; choose the state that describes the current condition.
- Do not add motion to a new interaction without a `prefers-reduced-motion: reduce` path. Loading animation must be replaceable with a static state.
- Do not accept user-provided CSS values, style strings, font URLs, or arbitrary theme names. Resolve customization through an allowlisted server-side theme model.
