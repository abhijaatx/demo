"use client";

import { useState } from "react";
import type { ImgHTMLAttributes, ReactNode } from "react";
import { ImageIcon } from "./icons.js";

type ClassNameProps = { className?: string | undefined };

export type ImageSourceOptions = {
  allowRemote?: boolean;
  remoteOrigins?: readonly string[];
};

export function isAllowedImageSource(
  src: string,
  { allowRemote = false, remoteOrigins = [] }: ImageSourceOptions = {}
): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  if (!allowRemote) return false;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && remoteOrigins.includes(url.origin);
  } catch {
    return false;
  }
}

function safeDimension(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.min(10000, Math.max(1, Math.floor(value))) : fallback;
}

export type MediaFallbackProps = ClassNameProps & {
  label: string;
  children?: ReactNode;
};

export function MediaFallback({ label, children, className }: MediaFallbackProps) {
  return (
    <span className={cx("ui-media-fallback", className)} role="img" aria-label={label}>
      {children ?? <ImageIcon size={24} />}
    </span>
  );
}

export type ImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "width" | "height" | "onError" | "className"
> &
  ClassNameProps & {
    src?: string | undefined;
    alt: string;
    width: number;
    height: number;
    fallback?: ReactNode;
    allowRemote?: boolean;
    remoteOrigins?: readonly string[];
  };

export function Image({
  src,
  alt,
  width,
  height,
  fallback,
  allowRemote = false,
  remoteOrigins = [],
  className,
  ...props
}: ImageProps) {
  const [failed, setFailed] = useState(false);
  const safeWidth = safeDimension(width, 320);
  const safeHeight = safeDimension(height, 180);
  const canRender = Boolean(
    src && isAllowedImageSource(src, { allowRemote, remoteOrigins }) && !failed
  );
  if (!canRender)
    return (
      <MediaFallback className={className} label={alt}>
        {fallback}
      </MediaFallback>
    );
  return (
    <img
      {...props}
      className={cx("ui-media-image", className)}
      src={src}
      alt={alt}
      width={safeWidth}
      height={safeHeight}
      onError={() => setFailed(true)}
    />
  );
}

export type AspectRatioProps = ClassNameProps & {
  ratio: number;
  children: ReactNode;
};

export function AspectRatio({ ratio, children, className }: AspectRatioProps) {
  const safeRatio = Number.isFinite(ratio) ? Math.min(10, Math.max(0.1, ratio)) : 16 / 9;
  return (
    <div className={cx("ui-aspect-ratio", className)} style={{ aspectRatio: safeRatio }}>
      {children}
    </div>
  );
}

export type ThumbnailProps = Omit<ImageProps, "width" | "height" | "className"> &
  ClassNameProps & {
    size?: "sm" | "md" | "lg";
    aspectRatio?: number;
  };

export function Thumbnail({
  size = "md",
  aspectRatio = 16 / 9,
  className,
  ...props
}: ThumbnailProps) {
  const dimensions =
    size === "sm"
      ? { width: 160, height: 90 }
      : size === "lg"
        ? { width: 640, height: 360 }
        : { width: 320, height: 180 };
  return (
    <AspectRatio
      ratio={aspectRatio}
      className={cx("ui-thumbnail", `ui-thumbnail-${size}`, className)}
    >
      <Image {...props} {...dimensions} className="ui-thumbnail-image" />
    </AspectRatio>
  );
}

export type DeviceFrameProps = ClassNameProps & {
  device?: "desktop" | "tablet" | "phone";
  label?: string;
  children: ReactNode;
};

export function DeviceFrame({ device = "desktop", label, children, className }: DeviceFrameProps) {
  const frameLabel = label ?? `${device} product screenshot`;
  return (
    <figure
      className={cx("ui-device-frame", `ui-device-frame-${device}`, className)}
      aria-label={frameLabel}
    >
      <div className="ui-device-frame-chrome" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="ui-device-frame-screen">{children}</div>
      <figcaption className="ui-sr-only">{frameLabel}</figcaption>
    </figure>
  );
}

function cx(...values: Array<string | false | null | undefined>): string | undefined {
  const result = values.filter(Boolean).join(" ");
  return result || undefined;
}
