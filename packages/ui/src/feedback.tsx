"use client";

import { useEffect, useId } from "react";
import type { ReactElement, ReactNode } from "react";

type ClassNameProps = { className?: string | undefined };
type FeedbackVariant = "neutral" | "success" | "warning" | "danger";

function cx(...values: Array<string | false | null | undefined>): string | undefined {
  const result = values.filter(Boolean).join(" ");
  return result || undefined;
}

function stableId(prefix: string, value: string): string {
  return `${prefix}-${value.replace(/[^a-zA-Z0-9_-]/gu, "")}`;
}

type DismissButtonProps = {
  onDismiss?: (() => void) | undefined;
  label: string;
};

function DismissButton({ onDismiss, label }: DismissButtonProps): ReactElement | null {
  return onDismiss ? (
    <button className="ui-feedback-dismiss" type="button" onClick={onDismiss} aria-label={label}>
      ×
    </button>
  ) : null;
}

export type ToastProps = ClassNameProps & {
  title: ReactNode;
  children?: ReactNode;
  variant?: FeedbackVariant;
  onDismiss?: () => void;
  dismissLabel?: string;
  autoDismissMs?: number;
};

export function Toast({
  title,
  children,
  variant = "neutral",
  onDismiss,
  dismissLabel = "Dismiss notification",
  autoDismissMs,
  className
}: ToastProps): ReactElement {
  const titleId = stableId("ui-toast-title", useId());

  useEffect(() => {
    if (!autoDismissMs || !onDismiss) return undefined;
    const timer = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  return (
    <div
      className={cx("ui-toast", `ui-feedback-${variant}`, className)}
      role={variant === "danger" ? "alert" : "status"}
      aria-live={variant === "danger" ? "assertive" : "polite"}
      aria-labelledby={titleId}
    >
      <div className="ui-feedback-copy">
        <strong id={titleId}>{title}</strong>
        {children ? <div>{children}</div> : null}
      </div>
      <DismissButton onDismiss={onDismiss} label={dismissLabel} />
    </div>
  );
}

export type BannerProps = ClassNameProps & {
  title: ReactNode;
  children?: ReactNode;
  variant?: FeedbackVariant;
  action?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
};

export function Banner({
  title,
  children,
  variant = "neutral",
  action,
  onDismiss,
  dismissLabel = "Dismiss message",
  className
}: BannerProps): ReactElement {
  const titleId = stableId("ui-banner-title", useId());
  return (
    <section
      className={cx("ui-banner", `ui-feedback-${variant}`, className)}
      role="region"
      aria-labelledby={titleId}
    >
      <div className="ui-feedback-copy">
        <strong id={titleId}>{title}</strong>
        {children ? <div>{children}</div> : null}
      </div>
      {action ? <div className="ui-feedback-action">{action}</div> : null}
      <DismissButton onDismiss={onDismiss} label={dismissLabel} />
    </section>
  );
}

export type InlineAlertProps = ClassNameProps & {
  title?: ReactNode;
  children: ReactNode;
  variant?: FeedbackVariant;
};

export function InlineAlert({
  title,
  children,
  variant = "danger",
  className
}: InlineAlertProps): ReactElement {
  const titleId = stableId("ui-alert-title", useId());
  return (
    <div
      className={cx("ui-inline-alert", `ui-feedback-${variant}`, className)}
      role="alert"
      aria-labelledby={title ? titleId : undefined}
    >
      {title ? <strong id={titleId}>{title}</strong> : null}
      <div>{children}</div>
    </div>
  );
}

export type SkeletonProps = ClassNameProps & {
  variant?: "text" | "rect" | "circle";
  lines?: number;
};

export function Skeleton({ variant = "text", lines = 1, className }: SkeletonProps): ReactElement {
  const count = Math.max(1, Math.min(lines, 12));
  return (
    <div className={cx("ui-skeleton-group", className)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span
          className={cx(
            "ui-skeleton",
            `ui-skeleton-${variant}`,
            index === count - 1 && count > 1 && "ui-skeleton-last"
          )}
          key={index}
        />
      ))}
    </div>
  );
}

export type EmptyStateProps = ClassNameProps & {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
  className
}: EmptyStateProps): ReactElement {
  return (
    <section className={cx("ui-empty-state", className)}>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div className="ui-empty-state-action">{action}</div> : null}
    </section>
  );
}
