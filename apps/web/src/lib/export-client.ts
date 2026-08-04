"use client";

import type { DemoDocument, DemoStep } from "@supademo/domain";

export type ExportResolution = "720p" | "1080p" | "4k";
export type VideoExportFormat = "mp4" | "gif";

export interface VideoExportOptions {
  readonly format: VideoExportFormat;
  readonly resolution: ExportResolution;
  readonly frameRate: number;
  readonly slideDurationMs: number;
  readonly transitionDelayMs: number;
}

export interface VideoExportResult {
  readonly blob: Blob;
  readonly extension: "mp4" | "gif" | "webm";
  readonly mimeType: string;
  readonly requestedFormat: VideoExportFormat;
}

const MAX_VIDEO_STEPS = 70;
const RESOLUTION_SIZES: Record<ExportResolution, { width: number; height: number }> = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "4k": { width: 3840, height: 2160 }
};

function safeImageSource(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("blob:")) return value;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function imageForStep(step: DemoStep): string | null {
  return safeImageSource(step.media?.storagePath);
}

async function loadImage(source: string | null): Promise<HTMLImageElement | null> {
  if (!source || typeof Image === "undefined") return null;
  return new Promise((resolve) => {
    const image = new Image();
    if (source.startsWith("https:")) image.crossOrigin = "anonymous";
    const timeout = globalThis.setTimeout(() => resolve(null), 5_000);
    image.onload = () => {
      globalThis.clearTimeout(timeout);
      resolve(image);
    };
    image.onerror = () => {
      globalThis.clearTimeout(timeout);
      resolve(null);
    };
    image.src = source;
  });
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number {
  const words = value.trim().split(/\s+/u).filter(Boolean);
  let line = "";
  let lines = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      context.fillText(line, x, y + lines * lineHeight);
      lines += 1;
      line = word;
      if (lines >= maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines < maxLines && line) {
    context.fillText(line, x, y + lines * lineHeight);
    lines += 1;
  }
  return lines;
}

function drawImageContain(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
}

async function drawStepCard(
  context: CanvasRenderingContext2D,
  step: DemoStep,
  index: number,
  x: number,
  y: number,
  width: number,
  height: number,
  image: HTMLImageElement | null
): Promise<void> {
  context.fillStyle = "#ffffff";
  context.fillRect(x, y, width, height);
  context.strokeStyle = "#d6dce8";
  context.lineWidth = 2;
  context.strokeRect(x, y, width, height);

  const padding = Math.max(18, Math.round(width * 0.04));
  const mediaHeight = Math.round(height * 0.63);
  context.fillStyle = "#eef2ff";
  context.fillRect(x + padding, y + padding, width - padding * 2, mediaHeight);
  if (image) {
    drawImageContain(context, image, x + padding, y + padding, width - padding * 2, mediaHeight);
  } else {
    context.fillStyle = "#6d78a5";
    context.font = `600 ${Math.max(15, Math.round(width * 0.035))}px sans-serif`;
    context.textAlign = "center";
    context.fillText("Media unavailable", x + width / 2, y + padding + mediaHeight / 2);
    context.textAlign = "left";
  }

  context.fillStyle = "#172033";
  context.font = `700 ${Math.max(18, Math.round(width * 0.04))}px sans-serif`;
  drawWrappedText(
    context,
    `Step ${index + 1}: ${step.title}`,
    x + padding,
    y + mediaHeight + padding * 1.7,
    width - padding * 2,
    26,
    2
  );
  if (step.description) {
    context.fillStyle = "#526079";
    context.font = `400 ${Math.max(14, Math.round(width * 0.026))}px sans-serif`;
    drawWrappedText(
      context,
      step.description,
      x + padding,
      y + mediaHeight + padding * 3.1,
      width - padding * 2,
      21,
      2
    );
  }
}

/** Build a bounded contact-sheet PNG for all demo steps. */
export async function createDemoPng(demoDocument: DemoDocument): Promise<Blob> {
  if (typeof document === "undefined")
    throw new Error("PNG export is only available in a browser.");
  const steps = demoDocument.steps.slice(0, MAX_VIDEO_STEPS);
  if (steps.length === 0) throw new Error("Add at least one step before exporting a PNG.");
  const cardWidth = 640;
  const cardHeight = 510;
  const gap = 26;
  const headerHeight = 100;
  const columns = 2;
  const rows = Math.max(1, Math.ceil(steps.length / columns));
  const canvas = document.createElement("canvas");
  canvas.width = cardWidth * columns + gap * (columns + 1);
  canvas.height = Math.min(20_000, headerHeight + rows * (cardHeight + gap) + gap);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PNG export could not create a canvas.");
  context.fillStyle = "#f7f8fc";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#172033";
  context.font = "700 34px sans-serif";
  context.fillText(`${demoDocument.demoId} — Step-by-step guide`, gap, 62);

  for (const [index, step] of steps.entries()) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const image = await loadImage(imageForStep(step));
    await drawStepCard(
      context,
      step,
      index,
      gap + column * (cardWidth + gap),
      headerHeight + row * (cardHeight + gap),
      cardWidth,
      cardHeight,
      image
    );
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed."))),
      "image/png"
    );
  });
}

function drawVideoFrame(
  context: CanvasRenderingContext2D,
  step: DemoStep,
  index: number,
  width: number,
  height: number,
  image: HTMLImageElement | null
): void {
  context.fillStyle = "#f7f8fc";
  context.fillRect(0, 0, width, height);
  const padding = Math.max(28, Math.round(width * 0.05));
  const mediaHeight = Math.round(height * 0.7);
  context.fillStyle = "#e6ebff";
  context.fillRect(padding, padding, width - padding * 2, mediaHeight);
  if (image) drawImageContain(context, image, padding, padding, width - padding * 2, mediaHeight);
  context.fillStyle = "#172033";
  context.font = `700 ${Math.max(28, Math.round(width * 0.045))}px sans-serif`;
  context.fillText(`Step ${index + 1}: ${step.title}`, padding, mediaHeight + padding * 1.9);
  if (step.description) {
    context.fillStyle = "#526079";
    context.font = `400 ${Math.max(20, Math.round(width * 0.027))}px sans-serif`;
    drawWrappedText(
      context,
      step.description,
      padding,
      mediaHeight + padding * 2.9,
      width - padding * 2,
      32,
      2
    );
  }
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

function mediaRecorderCandidates(format: VideoExportFormat): readonly string[] {
  return format === "mp4"
    ? ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/webm;codecs=vp9", "video/webm"]
    : ["image/gif", "video/webm;codecs=vp9", "video/webm"];
}

/**
 * Records a bounded canvas playback. Browsers without MP4/GIF encoders receive a WebM fallback
 * instead of a mislabeled or corrupt file.
 */
export async function createDemoVideo(
  demoDocument: DemoDocument,
  options: VideoExportOptions
): Promise<VideoExportResult> {
  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    throw new Error("Video export is not supported by this browser.");
  }
  const steps = demoDocument.steps.slice(0, MAX_VIDEO_STEPS);
  if (steps.length === 0) throw new Error("Add at least one step before exporting a video.");
  const size = RESOLUTION_SIZES[options.resolution] ?? RESOLUTION_SIZES["1080p"];
  const rawFrameRate = Number.isFinite(options.frameRate) ? options.frameRate : 30;
  const rawSlideDuration = Number.isFinite(options.slideDurationMs)
    ? options.slideDurationMs
    : 2_000;
  const rawTransitionDelay = Number.isFinite(options.transitionDelayMs)
    ? options.transitionDelayMs
    : 250;
  const frameRate = Math.min(60, Math.max(1, Math.floor(rawFrameRate)));
  const slideDurationMs = Math.min(10_000, Math.max(500, Math.floor(rawSlideDuration)));
  const transitionDelayMs = Math.min(2_000, Math.max(0, Math.floor(rawTransitionDelay)));
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context || typeof canvas.captureStream !== "function") {
    throw new Error("Video export requires canvas capture support.");
  }
  const stream = canvas.captureStream(frameRate);
  const mimeType = mediaRecorderCandidates(options.format).find(
    (candidate) =>
      typeof MediaRecorder.isTypeSupported !== "function" ||
      MediaRecorder.isTypeSupported(candidate)
  );
  if (!mimeType) throw new Error("This browser cannot encode an MP4 or GIF export.");

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];
  const result = new Promise<VideoExportResult>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => reject(new Error("Video export failed while recording."));
    recorder.onstop = () => {
      const actualMimeType = recorder.mimeType || mimeType;
      const extension = actualMimeType.startsWith("video/mp4")
        ? "mp4"
        : actualMimeType.startsWith("image/gif")
          ? "gif"
          : "webm";
      resolve({
        blob: new Blob(chunks, { type: actualMimeType }),
        extension,
        mimeType: actualMimeType,
        requestedFormat: options.format
      });
    };
  });

  recorder.start();
  for (const [index, step] of steps.entries()) {
    const image = await loadImage(imageForStep(step));
    drawVideoFrame(context, step, index, canvas.width, canvas.height, image);
    await sleep(slideDurationMs);
    if (transitionDelayMs > 0) await sleep(transitionDelayMs);
  }
  recorder.stop();
  stream.getTracks().forEach((track) => track.stop());
  return result;
}

export function downloadBlob(filename: string, blob: Blob): void {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export { MAX_VIDEO_STEPS, RESOLUTION_SIZES };
