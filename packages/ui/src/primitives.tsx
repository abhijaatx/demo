import { cloneElement, forwardRef, useId } from "react";
import type {
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,
  ReactElement,
  ReactNode
} from "react";

type ClassNameProps = { className?: string | undefined };

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ControlSize = "sm" | "md" | "lg";

function cx(...values: Array<string | false | null | undefined>): string | undefined {
  const result = values.filter(Boolean).join(" ");
  return result || undefined;
}

function stableId(prefix: string, value: string): string {
  return `${prefix}-${value.replace(/[^a-zA-Z0-9_-]/gu, "")}`;
}

function joinIds(...values: Array<string | undefined>): string | undefined {
  const result = values.filter(Boolean).join(" ");
  return result || undefined;
}

type FieldProps = ClassNameProps & {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  hideLabel?: boolean | undefined;
};

type FieldIds = {
  controlId: string;
  descriptionId: string;
  errorId: string;
};

function useFieldIds(id: string | undefined): FieldIds {
  const generatedId = stableId("ui-field", useId());
  const controlId = id ?? generatedId;
  return {
    controlId,
    descriptionId: `${controlId}-description`,
    errorId: `${controlId}-error`
  };
}

function Field({
  children,
  className,
  label,
  description,
  error,
  hideLabel,
  ids
}: FieldProps & { children: ReactNode; ids: FieldIds }): ReactElement {
  return (
    <div className={cx("ui-field", className)}>
      {label ? (
        <label className={cx("ui-field-label", hideLabel && "ui-sr-only")} htmlFor={ids.controlId}>
          {label}
        </label>
      ) : null}
      {children}
      {description ? (
        <div className="ui-field-description" id={ids.descriptionId}>
          {description}
        </div>
      ) : null}
      {error ? (
        <div className="ui-field-error" id={ids.errorId} role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function fieldDescriptionIds(
  ids: FieldIds,
  description: ReactNode,
  error: ReactNode,
  describedBy: string | undefined
): string | undefined {
  return joinIds(
    describedBy,
    description ? ids.descriptionId : undefined,
    error ? ids.errorId : undefined
  );
}

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ControlSize;
  loading?: boolean;
  loadingLabel?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    variant = "primary",
    size = "md",
    loading = false,
    loadingLabel = "Loading",
    disabled,
    ...props
  },
  ref
) {
  return (
    <button
      {...props}
      ref={ref}
      className={cx("ui-button", `ui-button-${variant}`, `ui-control-${size}`, className)}
      type={props.type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
    >
      {loading ? <Spinner decorative className="ui-button-spinner" /> : null}
      <span className={cx(loading && "ui-button-loading-label")}>
        {loading ? loadingLabel : children}
      </span>
    </button>
  );
});

export type IconButtonProps = Omit<ButtonProps, "children"> & {
  "aria-label": string;
  children: ReactNode;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, size = "sm", ...props },
  ref
) {
  return <Button {...props} ref={ref} size={size} className={cx("ui-icon-button", className)} />;
});

export type LinkProps = ComponentPropsWithRef<"a"> & {
  variant?: "default" | "muted" | "subtle";
  external?: boolean;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { children, className, variant = "default", external = false, rel, target, ...props },
  ref
) {
  const externalRel = external ? joinIds(rel, "noopener", "noreferrer") : rel;
  return (
    <a
      {...props}
      ref={ref}
      className={cx("ui-link", `ui-link-${variant}`, className)}
      rel={externalRel}
      target={external ? (target ?? "_blank") : target}
    >
      {children}
    </a>
  );
});

export type InputProps = Omit<ComponentPropsWithRef<"input">, "id" | "size"> &
  FieldProps & { id?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    label,
    description,
    error,
    hideLabel,
    id,
    "aria-describedby": describedBy,
    ...props
  },
  ref
) {
  const ids = useFieldIds(id);
  return (
    <Field
      className={className}
      label={label}
      description={description}
      error={error}
      hideLabel={hideLabel}
      ids={ids}
    >
      <input
        {...props}
        ref={ref}
        id={ids.controlId}
        className="ui-control ui-input"
        aria-describedby={fieldDescriptionIds(ids, description, error, describedBy)}
        aria-invalid={error ? true : undefined}
      />
    </Field>
  );
});

export type TextareaProps = Omit<ComponentPropsWithRef<"textarea">, "id"> &
  FieldProps & { id?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    className,
    label,
    description,
    error,
    hideLabel,
    id,
    "aria-describedby": describedBy,
    ...props
  },
  ref
) {
  const ids = useFieldIds(id);
  return (
    <Field
      className={className}
      label={label}
      description={description}
      error={error}
      hideLabel={hideLabel}
      ids={ids}
    >
      <textarea
        {...props}
        ref={ref}
        id={ids.controlId}
        className="ui-control ui-textarea"
        aria-describedby={fieldDescriptionIds(ids, description, error, describedBy)}
        aria-invalid={error ? true : undefined}
      />
    </Field>
  );
});

export type SelectProps = Omit<ComponentPropsWithRef<"select">, "id"> &
  FieldProps & { id?: string };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    className,
    label,
    description,
    error,
    hideLabel,
    id,
    "aria-describedby": describedBy,
    ...props
  },
  ref
) {
  const ids = useFieldIds(id);
  return (
    <Field
      className={className}
      label={label}
      description={description}
      error={error}
      hideLabel={hideLabel}
      ids={ids}
    >
      <select
        {...props}
        ref={ref}
        id={ids.controlId}
        className="ui-control ui-select"
        aria-describedby={fieldDescriptionIds(ids, description, error, describedBy)}
        aria-invalid={error ? true : undefined}
      />
    </Field>
  );
});

type ChoiceProps = ClassNameProps & {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  hideLabel?: boolean | undefined;
  id?: string;
};

function ChoiceField({
  children,
  className,
  label,
  description,
  error,
  hideLabel,
  ids
}: ChoiceProps & { children: ReactNode; ids: FieldIds }): ReactElement {
  return (
    <div className={cx("ui-choice-field", className)}>
      <div className="ui-choice-row">
        {children}
        {label ? (
          <label
            className={cx("ui-choice-label", hideLabel && "ui-sr-only")}
            htmlFor={ids.controlId}
          >
            {label}
          </label>
        ) : null}
      </div>
      {description ? (
        <div className="ui-field-description ui-choice-description" id={ids.descriptionId}>
          {description}
        </div>
      ) : null}
      {error ? (
        <div className="ui-field-error ui-choice-error" id={ids.errorId} role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function choiceDescriptionIds(
  ids: FieldIds,
  description: ReactNode,
  error: ReactNode,
  describedBy: string | undefined
): string | undefined {
  return fieldDescriptionIds(ids, description, error, describedBy);
}

export type CheckboxProps = Omit<ComponentPropsWithRef<"input">, "id" | "type"> & ChoiceProps;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    className,
    label,
    description,
    error,
    hideLabel,
    id,
    "aria-describedby": describedBy,
    ...props
  },
  ref
) {
  const ids = useFieldIds(id);
  return (
    <ChoiceField
      className={className}
      label={label}
      description={description}
      error={error}
      hideLabel={hideLabel}
      ids={ids}
    >
      <input
        {...props}
        ref={ref}
        id={ids.controlId}
        type="checkbox"
        className="ui-choice-control"
        aria-describedby={choiceDescriptionIds(ids, description, error, describedBy)}
        aria-invalid={error ? true : undefined}
      />
    </ChoiceField>
  );
});

export type RadioProps = Omit<ComponentPropsWithRef<"input">, "id" | "type"> & ChoiceProps;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    className,
    label,
    description,
    error,
    hideLabel,
    id,
    "aria-describedby": describedBy,
    ...props
  },
  ref
) {
  const ids = useFieldIds(id);
  return (
    <ChoiceField
      className={className}
      label={label}
      description={description}
      error={error}
      hideLabel={hideLabel}
      ids={ids}
    >
      <input
        {...props}
        ref={ref}
        id={ids.controlId}
        type="radio"
        className="ui-choice-control"
        aria-describedby={choiceDescriptionIds(ids, description, error, describedBy)}
        aria-invalid={error ? true : undefined}
      />
    </ChoiceField>
  );
});

export type SwitchProps = Omit<ComponentPropsWithRef<"input">, "id" | "type" | "role"> &
  ChoiceProps;

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    className,
    label,
    description,
    error,
    hideLabel,
    id,
    "aria-describedby": describedBy,
    ...props
  },
  ref
) {
  const ids = useFieldIds(id);
  return (
    <ChoiceField
      className={className}
      label={label}
      description={description}
      error={error}
      hideLabel={hideLabel}
      ids={ids}
    >
      <input
        {...props}
        ref={ref}
        id={ids.controlId}
        type="checkbox"
        role="switch"
        className="ui-switch-control"
        aria-describedby={choiceDescriptionIds(ids, description, error, describedBy)}
        aria-invalid={error ? true : undefined}
      />
    </ChoiceField>
  );
});

export type TooltipProps = {
  children: ReactElement<{ "aria-describedby"?: string }>;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
};

export function Tooltip({ children, content, side = "top" }: TooltipProps): ReactElement {
  const tooltipId = stableId("ui-tooltip", useId());
  const existingDescribedBy = children.props["aria-describedby"];
  const describedBy = existingDescribedBy ? `${existingDescribedBy} ${tooltipId}` : tooltipId;
  const trigger = cloneElement(children, {
    "aria-describedby": describedBy
  });
  return (
    <span className={cx("ui-tooltip", `ui-tooltip-${side}`)}>
      {trigger}
      <span className="ui-tooltip-content" id={tooltipId} role="tooltip">
        {content}
      </span>
    </span>
  );
}

export type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: "neutral" | "success" | "warning" | "danger" | "brand";
};

export function Badge({
  children,
  className,
  variant = "neutral",
  ...props
}: BadgeProps): ReactElement {
  return (
    <span {...props} className={cx("ui-badge", `ui-badge-${variant}`, className)}>
      {children}
    </span>
  );
}

export type AvatarProps = ClassNameProps & {
  name?: string;
  src?: string;
  alt?: string;
  size?: ControlSize;
};

function initials(name: string | undefined): string {
  const parts = name?.trim().split(/\s+/u).filter(Boolean) ?? [];
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function Avatar({ name, src, alt, size = "md", className }: AvatarProps): ReactElement {
  const accessibleName = alt ?? name ?? "Avatar";
  return (
    <span
      className={cx("ui-avatar", `ui-control-${size}`, className)}
      aria-label={src ? undefined : accessibleName}
    >
      {src ? <img src={src} alt={accessibleName} /> : initials(name)}
    </span>
  );
}

export type SeparatorProps = ClassNameProps & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
};

export function Separator({
  className,
  orientation = "horizontal",
  decorative = false
}: SeparatorProps): ReactElement {
  return decorative ? (
    <div
      className={cx("ui-separator", `ui-separator-${orientation}`, className)}
      aria-hidden="true"
    />
  ) : (
    <div
      className={cx("ui-separator", `ui-separator-${orientation}`, className)}
      role="separator"
      aria-orientation={orientation}
    />
  );
}

export type SpinnerProps = ClassNameProps & {
  label?: string;
  decorative?: boolean;
};

export function Spinner({
  className,
  label = "Loading",
  decorative = false
}: SpinnerProps): ReactElement {
  return decorative ? (
    <span className={cx("ui-spinner", className)} aria-hidden="true" />
  ) : (
    <span className={cx("ui-spinner", className)} role="status" aria-label={label} />
  );
}
