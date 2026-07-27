"use client";

import { cloneElement, useEffect, useId, useRef, useState } from "react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
  RefObject
} from "react";
import { createPortal } from "react-dom";

type ClassNameProps = { className?: string | undefined };
type OverlayRole = "dialog" | "alertdialog";
type Placement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function cx(...values: Array<string | false | null | undefined>): string | undefined {
  const result = values.filter(Boolean).join(" ");
  return result || undefined;
}

function stableId(prefix: string, value: string): string {
  return `${prefix}-${value.replace(/[^a-zA-Z0-9_-]/gu, "")}`;
}

function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getAttribute("aria-hidden") !== "true"
  );
}

function focusElementOrDescendant(element: HTMLElement | null): void {
  if (!element) return;
  if (element.matches(FOCUSABLE_SELECTOR)) {
    element.focus({ preventScroll: true });
    return;
  }
  focusableElements(element)[0]?.focus({ preventScroll: true });
}

function usePortalHost(open: boolean, kind: string): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const nextHost = document.createElement("div");
    nextHost.dataset["uiPortal"] = kind;
    document.body.append(nextHost);
    setHost(nextHost);
    return () => {
      setHost(null);
      nextHost.remove();
    };
  }, [kind, open]);

  return host;
}

type OverlayLifecycleOptions = {
  open: boolean;
  ready: boolean;
  rootRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  closeOnEscape: boolean;
  closeOnOutsideClick: boolean;
  trapFocus: boolean;
  restoreFocus: boolean;
  initialFocusRef?: RefObject<HTMLElement | null> | undefined;
  returnFocusRef?: RefObject<HTMLElement | null> | undefined;
};

function useOverlayLifecycle({
  open,
  ready,
  rootRef,
  onClose,
  closeOnEscape,
  closeOnOutsideClick,
  trapFocus,
  restoreFocus,
  initialFocusRef,
  returnFocusRef
}: OverlayLifecycleOptions): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || !ready || !rootRef.current || typeof document === "undefined") return undefined;
    const root = rootRef.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (trapFocus) {
      queueMicrotask(() => {
        focusElementOrDescendant(initialFocusRef?.current ?? focusableElements(root)[0] ?? root);
      });
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      const activeElement = document.activeElement;
      if (!(activeElement instanceof HTMLElement) || !root.contains(activeElement)) return;

      if (event.key === "Escape" && closeOnEscape) {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (!trapFocus || event.key !== "Tab") return;
      const focusable = focusableElements(root);
      if (focusable.length === 0) {
        event.preventDefault();
        root.focus({ preventScroll: true });
        return;
      }

      const currentIndex = focusable.indexOf(activeElement);
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? focusable.length - 1
          : currentIndex - 1
        : currentIndex === focusable.length - 1
          ? 0
          : currentIndex + 1;
      event.preventDefault();
      focusable[nextIndex]?.focus({ preventScroll: true });
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (!closeOnOutsideClick || !(event.target instanceof Node)) return;
      const target = event.target;
      if (root.contains(target)) return;
      if (target instanceof Element && target.closest("[data-ui-overlay-surface]")) return;
      onCloseRef.current();
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      if (restoreFocus && previousFocus?.isConnected) {
        focusElementOrDescendant(returnFocusRef?.current ?? previousFocus);
      }
    };
  }, [
    closeOnEscape,
    closeOnOutsideClick,
    initialFocusRef,
    open,
    ready,
    restoreFocus,
    returnFocusRef,
    rootRef,
    trapFocus
  ]);
}

type DialogProps = ClassNameProps & {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  labelledBy?: string;
  describedBy?: string;
  ariaLabel?: string;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  role?: OverlayRole;
};

function Dialog({
  open,
  onClose,
  children,
  title,
  description,
  labelledBy,
  describedBy,
  ariaLabel,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  initialFocusRef,
  returnFocusRef,
  role = "dialog",
  className
}: DialogProps): ReactElement | null {
  const host = usePortalHost(open, role);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const generatedId = stableId("ui-dialog-title", useId());
  const titleId = labelledBy ?? (title ? generatedId : undefined);
  const descriptionId = description ? `${generatedId}-description` : undefined;

  useOverlayLifecycle({
    open,
    ready: Boolean(host),
    rootRef: surfaceRef,
    onClose,
    closeOnEscape,
    closeOnOutsideClick: false,
    trapFocus: true,
    restoreFocus: true,
    initialFocusRef,
    returnFocusRef
  });

  if (!open || !host) return null;

  return createPortal(
    <div className="ui-overlay-layer ui-modal-layer" data-ui-overlay-layer>
      <div
        className="ui-overlay-backdrop"
        aria-hidden="true"
        onPointerDown={closeOnOutsideClick ? onClose : undefined}
      />
      <div
        ref={surfaceRef}
        className={cx("ui-modal", className)}
        data-ui-overlay-surface
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={joinIds(describedBy, descriptionId)}
        aria-label={ariaLabel}
        tabIndex={-1}
      >
        {title || description ? (
          <header className="ui-dialog-header">
            {title ? <h2 id={titleId}>{title}</h2> : null}
            {description ? (
              <p id={descriptionId} className="ui-dialog-description">
                {description}
              </p>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </div>,
    host
  );
}

function joinIds(...values: Array<string | undefined>): string | undefined {
  const result = values.filter(Boolean).join(" ");
  return result || undefined;
}

export type ModalProps = DialogProps;

export function Modal(props: ModalProps): ReactElement | null {
  return <Dialog {...props} />;
}

export type AlertDialogProps = Omit<DialogProps, "role">;

export function AlertDialog(props: AlertDialogProps): ReactElement | null {
  return <Dialog {...props} role="alertdialog" />;
}

export type PopoverProps = ClassNameProps & {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  placement?: Placement;
  labelledBy?: string;
  describedBy?: string;
  ariaLabel?: string;
  role?: "dialog" | "menu" | "listbox";
};

function popoverPosition(anchor: HTMLElement, placement: Placement): CSSProperties {
  const rect = anchor.getBoundingClientRect();
  const top = placement.startsWith("top") ? rect.top - 8 : rect.bottom + 8;
  const left = placement.endsWith("end") ? rect.right : rect.left;
  return {
    left: `${left}px`,
    top: `${top}px`,
    transform: placement.startsWith("top") ? "translateY(-100%)" : undefined,
    translate: placement.endsWith("end") ? "-100% 0" : undefined
  };
}

export function Popover({
  open,
  onClose,
  anchorRef,
  children,
  placement = "bottom-start",
  labelledBy,
  describedBy,
  ariaLabel,
  role = "dialog",
  className
}: PopoverProps): ReactElement | null {
  const host = usePortalHost(open, "popover");
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties>({});

  useEffect(() => {
    if (!open || !anchorRef.current) return undefined;
    const updatePosition = (): void => {
      if (anchorRef.current) setPosition(popoverPosition(anchorRef.current, placement));
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, open, placement]);

  useOverlayLifecycle({
    open,
    ready: Boolean(host),
    rootRef: surfaceRef,
    onClose,
    closeOnEscape: true,
    closeOnOutsideClick: true,
    trapFocus: false,
    restoreFocus: true,
    returnFocusRef: anchorRef
  });

  if (!open || !host) return null;
  return createPortal(
    <div
      ref={surfaceRef}
      className={cx("ui-popover", className)}
      data-ui-overlay-surface
      role={role}
      aria-modal={role === "dialog" ? undefined : false}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-label={ariaLabel}
      style={position}
    >
      {children}
    </div>,
    host
  );
}

type DropdownTriggerProps = {
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "menu";
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLElement>) => void;
};

export type DropdownProps = ClassNameProps & {
  trigger: ReactElement<DropdownTriggerProps>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  label?: string;
};

export function Dropdown({
  trigger,
  open,
  onOpenChange,
  children,
  label = "Menu",
  className
}: DropdownProps): ReactElement {
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !menuRef.current) return;
    const firstItem = menuRef.current.querySelector<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])'
    );
    firstItem?.focus({ preventScroll: true });
  }, [open]);

  const enhancedTrigger = cloneElement(trigger, {
    "aria-haspopup": "menu",
    "aria-expanded": open,
    onClick: (event) => {
      trigger.props.onClick?.(event);
      if (!event.defaultPrevented) onOpenChange(!open);
    },
    onKeyDown: (event) => {
      trigger.props.onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        onOpenChange(true);
      }
    }
  });

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    const items = menuRef.current
      ? Array.from(
          menuRef.current.querySelectorAll<HTMLElement>(
            '[role="menuitem"]:not([aria-disabled="true"])'
          )
        )
      : [];
    const currentIndex = items.indexOf(event.target as HTMLElement);
    if (event.key === "Escape") {
      event.preventDefault();
      onOpenChange(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex =
        event.key === "ArrowDown"
          ? (currentIndex + 1) % items.length
          : (currentIndex - 1 + items.length) % items.length;
      items[nextIndex]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      (event.key === "Home" ? items[0] : items.at(-1))?.focus();
    }
  };

  return (
    <div ref={anchorRef} className={cx("ui-dropdown", className)}>
      {enhancedTrigger}
      <Popover
        open={open}
        onClose={() => onOpenChange(false)}
        anchorRef={anchorRef}
        role="menu"
        ariaLabel={label}
      >
        <div ref={menuRef} className="ui-menu" onKeyDown={handleMenuKeyDown}>
          {children}
        </div>
      </Popover>
    </div>
  );
}
