# Overlay and feedback primitives

TASK-013 adds the shared interaction layer for transient UI. These components are opt-in and do not change the existing dashboard until a later task composes them into a route or editor.

## Overlay behavior

- `Modal` renders a labeled `role="dialog"` through a body portal, traps `Tab` focus, closes on `Escape`, optionally closes from the backdrop, and restores focus to the previous element.
- `AlertDialog` provides the same behavior with `role="alertdialog"` for confirmation or destructive decisions.
- `Popover` renders next to an anchor, updates its position on resize/scroll, closes on `Escape` or outside pointer input, and restores focus to the anchor.
- `Dropdown` composes a popover menu with `aria-haspopup`, `aria-expanded`, Arrow/Home/End navigation, and Escape-to-close behavior. Menu items should use `role="menuitem"` and remain native focusable controls where possible.

All overlay surfaces use a fixed portal host and a `data-ui-overlay-surface` marker. Parent overlays ignore pointer events inside nested overlay surfaces so a child popover or dropdown does not dismiss its parent.

```tsx
<Modal
  open={isOpen}
  onClose={() => setOpen(false)}
  title="Share demo"
  description="Choose how viewers can access it."
>
  <Button onClick={() => setOpen(false)}>Done</Button>
</Modal>
```

## Feedback behavior

- `Toast` uses a polite live region by default and assertive alert behavior for danger states. Auto-dismiss is opt-in.
- `Banner` is a persistent region for page-level status and can include an action or dismiss control.
- `InlineAlert` is an immediate `role="alert"` for field or section errors.
- `Skeleton` is hidden from assistive technology and capped at twelve lines to prevent accidental unbounded rendering.
- `EmptyState` names the current empty collection and provides one optional next action.

Keep technical details in disclosures or logs; feedback copy should say what happened and what the creator can do next. Do not use a toast as the only evidence of a critical save or publish operation.
