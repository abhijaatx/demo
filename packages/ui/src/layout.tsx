"use client";

import { createElement, useId, useState } from "react";
import type { ComponentPropsWithoutRef, KeyboardEvent, ReactNode } from "react";

type ClassNameProps = { className?: string | undefined };
type LayoutTag = "div" | "section" | "main" | "nav" | "aside" | "header" | "footer" | "ul" | "ol";

export type SpacingToken = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11";
export type AlignValue = "start" | "center" | "end" | "stretch" | "baseline";
export type JustifyValue = "start" | "center" | "end" | "between" | "around";

type LayoutProps = Omit<ComponentPropsWithoutRef<"div">, "children" | "className"> &
  ClassNameProps & {
    as?: LayoutTag;
    children?: ReactNode;
  };

function cx(...values: Array<string | false | null | undefined>): string | undefined {
  const result = values.filter(Boolean).join(" ");
  return result || undefined;
}

function renderLayout(tag: LayoutTag, props: Record<string, unknown>, children: ReactNode) {
  return createElement(tag, props, children);
}

export type StackProps = LayoutProps & {
  direction?: "row" | "column";
  gap?: SpacingToken;
  align?: AlignValue;
  justify?: JustifyValue;
  wrap?: boolean;
};

export function Stack({
  as = "div",
  children,
  className,
  direction = "column",
  gap = "4",
  align = "stretch",
  justify = "start",
  wrap = false,
  ...props
}: StackProps) {
  return renderLayout(
    as,
    {
      ...props,
      className: cx("ui-stack", className),
      "data-direction": direction,
      "data-gap": gap,
      "data-align": align,
      "data-justify": justify,
      "data-wrap": wrap ? "true" : undefined
    },
    children
  );
}

export type GridProps = LayoutProps & {
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: SpacingToken;
  minItemWidth?: "sm" | "md" | "lg";
};

export function Grid({
  as = "div",
  children,
  className,
  columns = 3,
  gap = "4",
  minItemWidth,
  ...props
}: GridProps) {
  return renderLayout(
    as,
    {
      ...props,
      className: cx("ui-grid", className),
      "data-columns": columns,
      "data-gap": gap,
      "data-min-item-width": minItemWidth
    },
    children
  );
}

export type ContainerProps = LayoutProps & {
  width?: "narrow" | "content" | "wide";
};

export function Container({
  as = "div",
  children,
  className,
  width = "content",
  ...props
}: ContainerProps) {
  return renderLayout(
    as,
    { ...props, className: cx("ui-container", `ui-container-${width}`, className) },
    children
  );
}

export type SplitPaneProps = ClassNameProps & {
  sidebar: ReactNode;
  children: ReactNode;
  side?: "left" | "right";
  sidebarSize?: "sm" | "md" | "lg";
};

export function SplitPane({
  sidebar,
  children,
  side = "left",
  sidebarSize = "md",
  className
}: SplitPaneProps) {
  return (
    <div
      className={cx("ui-split-pane", className)}
      data-side={side}
      data-sidebar-size={sidebarSize}
    >
      <aside className="ui-split-pane-sidebar">{sidebar}</aside>
      <main className="ui-split-pane-main">{children}</main>
    </div>
  );
}

export type SidebarProps = ClassNameProps & {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  label?: string;
};

export function Sidebar({
  children,
  header,
  footer,
  label = "Workspace navigation",
  className
}: SidebarProps) {
  return (
    <aside className={cx("ui-sidebar", className)} aria-label={label}>
      {header ? <div className="ui-sidebar-header">{header}</div> : null}
      <nav aria-label={label}>{children}</nav>
      {footer ? <div className="ui-sidebar-footer">{footer}</div> : null}
    </aside>
  );
}

export type HeaderProps = ClassNameProps & {
  children: ReactNode;
  actions?: ReactNode;
  label?: string;
};

export function Header({ children, actions, label = "Page header", className }: HeaderProps) {
  return (
    <header className={cx("ui-header", className)} aria-label={label}>
      <div className="ui-header-content">{children}</div>
      {actions ? <div className="ui-header-actions">{actions}</div> : null}
    </header>
  );
}

export type BreadcrumbItem = {
  label: ReactNode;
  href?: string | undefined;
  current?: boolean | undefined;
};

export type BreadcrumbProps = ClassNameProps & {
  items: BreadcrumbItem[];
  label?: string;
};

export function Breadcrumb({ items, label = "Breadcrumb", className }: BreadcrumbProps) {
  return (
    <nav className={cx("ui-breadcrumb", className)} aria-label={label}>
      <ol>
        {items.map((item, index) => {
          const current = item.current ?? index === items.length - 1;
          return (
            <li key={index}>
              {item.href && !current ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                <span aria-current={current ? "page" : undefined}>{item.label}</span>
              )}
              {index < items.length - 1 ? (
                <span className="ui-breadcrumb-separator" aria-hidden="true">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export type TabItem = {
  value: string;
  label: ReactNode;
  panel: ReactNode;
  disabled?: boolean | undefined;
};

export type TabsProps = ClassNameProps & {
  items: TabItem[];
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  orientation?: "horizontal" | "vertical";
  activation?: "automatic" | "manual";
  label?: string;
};

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  activation = "automatic",
  label = "Tabs",
  className
}: TabsProps) {
  const tabsId = `ui-tabs-${useId().replace(/[^a-zA-Z0-9_-]/gu, "")}`;
  const firstEnabled = items.find((item) => !item.disabled)?.value;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? firstEnabled);
  const selectedValue = value ?? uncontrolledValue ?? firstEnabled;
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === selectedValue && !item.disabled),
    items.findIndex((item) => !item.disabled)
  );

  const activate = (nextValue: string): void => {
    if (value === undefined) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  };

  const moveFocus = (index: number, shouldActivate: boolean): void => {
    const enabledItems = items
      .map((item, itemIndex) => ({ item, itemIndex }))
      .filter(({ item }) => !item.disabled);
    if (enabledItems.length === 0) return;
    const nextEnabledIndex = (index + enabledItems.length) % enabledItems.length;
    const next = enabledItems[nextEnabledIndex];
    if (!next) return;
    document.getElementById(`${tabsId}-tab-${next.itemIndex}`)?.focus();
    if (shouldActivate) activate(next.item.value);
    else if (activation === "automatic") activate(next.item.value);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, itemIndex: number): void => {
    const enabledIndexes = items.flatMap((item, index) => (item.disabled ? [] : [index]));
    const currentIndex = Math.max(0, enabledIndexes.indexOf(itemIndex));
    const isNext =
      orientation === "horizontal" ? event.key === "ArrowRight" : event.key === "ArrowDown";
    const isPrevious =
      orientation === "horizontal" ? event.key === "ArrowLeft" : event.key === "ArrowUp";
    if (isNext || isPrevious) {
      event.preventDefault();
      moveFocus(isPrevious ? currentIndex - 1 : currentIndex + 1, false);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      moveFocus(event.key === "Home" ? 0 : enabledIndexes.length - 1, false);
    } else if (activation === "manual" && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      const item = items[itemIndex];
      if (item && !item.disabled) activate(item.value);
    }
  };

  return (
    <div className={cx("ui-tabs", `ui-tabs-${orientation}`, className)}>
      <div
        className="ui-tabs-tablist"
        role="tablist"
        aria-label={label}
        aria-orientation={orientation}
      >
        {items.map((item, index) => {
          const tabId = `${tabsId}-tab-${index}`;
          const panelId = `${tabsId}-panel-${index}`;
          const selected = index === selectedIndex;
          return (
            <button
              className="ui-tabs-tab"
              key={item.value}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => !item.disabled && activate(item.value)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item, index) => {
        const panelId = `${tabsId}-panel-${index}`;
        const selected = index === selectedIndex;
        return (
          <div
            className="ui-tabs-panel"
            key={item.value}
            id={panelId}
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-${index}`}
            hidden={!selected}
            tabIndex={selected ? 0 : -1}
          >
            {item.panel}
          </div>
        );
      })}
    </div>
  );
}

type PaginationItem = number | "ellipsis";

function paginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): PaginationItem[] {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];
  const safeSiblingCount = Math.max(0, Math.min(3, Math.floor(siblingCount)));
  const pages = new Set<number>([1, totalPages]);
  for (
    let page = currentPage - safeSiblingCount;
    page <= currentPage + safeSiblingCount;
    page += 1
  ) {
    if (page > 1 && page < totalPages) pages.add(page);
  }
  const sorted = [...pages].sort((left, right) => left - right);
  const result: PaginationItem[] = [];
  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && page - previous > 1) result.push("ellipsis");
    result.push(page);
  });
  return result;
}

export type PaginationProps = ClassNameProps & {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  label = "Pagination",
  previousLabel = "Previous page",
  nextLabel = "Next page",
  className
}: PaginationProps) {
  const safeTotalPages = Math.max(0, Math.floor(totalPages));
  const safeCurrentPage =
    safeTotalPages === 0 ? 0 : Math.min(safeTotalPages, Math.max(1, Math.floor(currentPage)));
  if (safeTotalPages === 0) return null;
  const items = paginationItems(safeCurrentPage, safeTotalPages, siblingCount);
  return (
    <nav className={cx("ui-pagination", className)} aria-label={label}>
      <button
        type="button"
        onClick={() => onPageChange(safeCurrentPage - 1)}
        disabled={safeCurrentPage <= 1}
        aria-label={previousLabel}
      >
        Previous
      </button>
      <ol>
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${index}`} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === safeCurrentPage ? "page" : undefined}
              >
                {item}
              </button>
            </li>
          )
        )}
      </ol>
      <button
        type="button"
        onClick={() => onPageChange(safeCurrentPage + 1)}
        disabled={safeCurrentPage >= safeTotalPages}
        aria-label={nextLabel}
      >
        Next
      </button>
    </nav>
  );
}
