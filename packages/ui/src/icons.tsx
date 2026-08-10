"use client";

import type { ReactNode, SVGProps } from "react";

export type IconProps = Omit<
  SVGProps<SVGSVGElement>,
  "children" | "width" | "height" | "viewBox" | "aria-hidden" | "role"
> & {
  size?: number;
  label?: string;
};

function SvgIcon({
  children,
  size = 18,
  label,
  className,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      {...props}
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      {label ? <title>{label}</title> : null}
      {children}
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 5v14M5 12h14" />
    </SvgIcon>
  );
}
export function ArrowRightIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </SvgIcon>
  );
}
export function CheckIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m5 12 4 4L19 6" />
    </SvgIcon>
  );
}
export function CloseIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </SvgIcon>
  );
}
export function SearchIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </SvgIcon>
  );
}
export function MoreIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </SvgIcon>
  );
}
export function MenuIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </SvgIcon>
  );
}
export function ChevronDownIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m6 9 6 6 6-6" />
    </SvgIcon>
  );
}
export function SettingsIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
      <circle cx="12" cy="12" r="3.5" />
    </SvgIcon>
  );
}
export function HomeIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m4 11 8-7 8 7v8H4z" />
      <path d="M9 19v-5h6v5" />
    </SvgIcon>
  );
}
export function DemosIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 4v16M9 9h11" />
    </SvgIcon>
  );
}
export function HubsIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="7" r="2.5" />
      <circle cx="12" cy="17" r="2.5" />
      <path d="m9 8.5 1.5 5M15 8.5l-1.5 5M9.5 7h5" />
    </SvgIcon>
  );
}
export function AnalyticsIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 19V9M12 19V5M19 19v-7" />
    </SvgIcon>
  );
}
export function LeadsIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 20c.8-3.3 3.1-5 7-5s6.2 1.7 7 5" />
    </SvgIcon>
  );
}
export function PlayIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m9 6 9 6-9 6z" fill="currentColor" stroke="none" />
    </SvgIcon>
  );
}
export function ExternalLinkIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M14 5h5v5M19 5l-8 8" />
      <path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </SvgIcon>
  );
}
export function AlertIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 4 21 19H3z" />
      <path d="M12 9v4M12 16h.01" />
    </SvgIcon>
  );
}
export function InfoIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8h.01" />
    </SvgIcon>
  );
}
export function CopyIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </SvgIcon>
  );
}
export function ImageIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="9" cy="9" r="1.5" />
      <path d="m5 17 4-4 3 3 2-2 5 4" />
    </SvgIcon>
  );
}
export function FilterIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </SvgIcon>
  );
}
export function SortIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M8 5v14M5 8l3-3 3 3M16 19V5M13 16l3 3 3-3" />
    </SvgIcon>
  );
}
export function FolderPlusIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3.5 7.5h6l2-2h9v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      <path d="M15 10v6M12 13h6" />
    </SvgIcon>
  );
}
export function LayoutIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16M10 10v10" />
    </SvgIcon>
  );
}
export function HelpCircleIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.7 9.4a2.4 2.4 0 1 1 4.1 1.7c-.8.7-1.8 1.1-1.8 2.5M12 16.7h.01" />
    </SvgIcon>
  );
}
export function GiftIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7H8.8A2.3 2.3 0 1 1 11 4.2zM12 7h3.2A2.3 2.3 0 1 0 13 4.2z" />
    </SvgIcon>
  );
}
export function VideoIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="3.5" y="6" width="12.5" height="12" rx="2" />
      <path d="m16 10 4.5-2v8L16 14z" />
    </SvgIcon>
  );
}
