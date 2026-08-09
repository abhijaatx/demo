"use client";

import {
  clampVideoHotspotTime,
  findCrossedPauseHotspots,
  isDemoHotspotVisibleAtTime,
  pauseHotspotIdsBeforeTime,
  resolveTimelineEdgeDrag,
  type DemoHotspotTiming,
  type HotspotTimelineEdge
} from "@supademo/domain";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { saveLocalCaptureBundle } from "../src/lib/local-capture-storage";

type HotspotKind = "pause" | "duration";

type VideoHotspotDraft = {
  id: string;
  timeSeconds: number;
  endTimeSeconds: number;
  kind: HotspotKind;
  title: string;
  body: string;
};

type CueDragState = {
  hotspotId: string;
  edge: HotspotTimelineEdge | null;
  startClientX: number;
  moved: boolean;
};

const MAX_FILE_BYTES = 40 * 1024 * 1024;
const MAX_HOTSPOTS = 20;
const MAX_DURATION_SECONDS = 7_200;
const CUE_KEYBOARD_STEP_SECONDS = 0.1;
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function clampTime(value: number, duration: number) {
  return clampVideoHotspotTime(value, duration);
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function hotspotTiming(hotspot: VideoHotspotDraft): DemoHotspotTiming {
  return {
    kind: hotspot.kind,
    startSeconds: hotspot.timeSeconds,
    endSeconds: hotspot.kind === "duration" ? hotspot.endTimeSeconds : null
  };
}

export function VideoHotspotsWorkbench() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrlRef = useRef<string | null>(null);
  const videoFileRef = useRef<File | null>(null);
  const previousTimeRef = useRef(0);
  const seekingRef = useRef(false);
  const pauseJumpRef = useRef(false);
  const triggeredPauseIdsRef = useRef<Set<string>>(new Set());
  const trackRef = useRef<HTMLDivElement>(null);
  const cueDragRef = useRef<CueDragState | null>(null);
  const suppressClickRef = useRef(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hotspotKind, setHotspotKind] = useState<HotspotKind>("pause");
  const [hotspots, setHotspots] = useState<VideoHotspotDraft[]>([]);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [localCaptureId, setLocalCaptureId] = useState("");
  const [activePauseIds, setActivePauseIds] = useState<readonly string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(
    "Load a video to place timeline hotspots at exact moments."
  );
  const [error, setError] = useState("");

  const selectedHotspot = hotspots.find((hotspot) => hotspot.id === selectedHotspotId) || null;
  const activeHotspots = useMemo(() => {
    const activePauses = new Set(activePauseIds);
    return hotspots.filter((hotspot) =>
      isDemoHotspotVisibleAtTime(
        { id: hotspot.id, timing: hotspotTiming(hotspot) },
        currentTime,
        activePauses
      )
    );
  }, [activePauseIds, currentTime, hotspots]);

  const loadVideo = (file: File) => {
    setError("");
    if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
      setError("Choose an MP4, WebM, or QuickTime video.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Videos must be 40 MB or smaller.");
      return;
    }
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    const nextUrl = URL.createObjectURL(file);
    videoFileRef.current = file;
    videoUrlRef.current = nextUrl;
    setVideoUrl(nextUrl);
    setFileName(file.name.slice(0, 120));
    setHotspots([]);
    setSelectedHotspotId(null);
    setCurrentTime(0);
    previousTimeRef.current = 0;
    seekingRef.current = false;
    pauseJumpRef.current = false;
    triggeredPauseIdsRef.current.clear();
    setActivePauseIds([]);
    setDurationSeconds(0);
    setMessage(
      "Video loaded. Click a moment on the timeline to add a hotspot, or drag a pause cue's edges to turn it into a duration hotspot."
    );
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) loadVideo(file);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    const nextDuration = video?.duration || 0;
    if (
      !Number.isFinite(nextDuration) ||
      nextDuration <= 0 ||
      nextDuration > MAX_DURATION_SECONDS
    ) {
      setError("Choose a video between 1 second and 2 hours.");
      return;
    }
    setDurationSeconds(nextDuration);
    setError("");
  };

  const handleVideoError = () => {
    setError("Video preview could not be loaded. Choose a valid MP4, WebM, or QuickTime file.");
    setDurationSeconds(0);
  };

  const timedCues = () =>
    hotspots.map((hotspot) => ({ id: hotspot.id, timing: hotspotTiming(hotspot) }));

  const handleTimeUpdate = (video: HTMLVideoElement): void => {
    const nextTime = clampTime(video.currentTime, durationSeconds || video.duration || 0);
    if (seekingRef.current) {
      previousTimeRef.current = nextTime;
      setCurrentTime(nextTime);
      return;
    }
    const crossed = findCrossedPauseHotspots(
      timedCues(),
      previousTimeRef.current,
      nextTime,
      triggeredPauseIdsRef.current
    );
    if (crossed.length > 0) {
      const pauseAt = crossed[0]?.timing?.startSeconds ?? nextTime;
      for (const cue of crossed) triggeredPauseIdsRef.current.add(cue.id);
      // The programmatic jump must not re-arm the cue via onSeeked. The crossed
      // cue is already in the triggered set, so re-entrant time updates are safe
      // without marking the video as seeking (which could get stuck on a no-op
      // seek and suppress every later cue).
      pauseJumpRef.current = true;
      video.currentTime = pauseAt;
      video.pause();
      previousTimeRef.current = pauseAt;
      setCurrentTime(pauseAt);
      setActivePauseIds(crossed.map((cue) => cue.id));
      setMessage(`Video paused at ${formatTime(pauseAt)} for an interactive hotspot.`);
      return;
    }
    previousTimeRef.current = nextTime;
    setCurrentTime(nextTime);
  };

  const handleSeeking = (): void => {
    seekingRef.current = true;
    setActivePauseIds([]);
  };

  const handleSeeked = (video: HTMLVideoElement): void => {
    const nextTime = clampTime(video.currentTime, durationSeconds || video.duration || 0);
    seekingRef.current = false;
    previousTimeRef.current = nextTime;
    if (pauseJumpRef.current) {
      pauseJumpRef.current = false;
    } else {
      triggeredPauseIdsRef.current = new Set(pauseHotspotIdsBeforeTime(timedCues(), nextTime));
    }
    setCurrentTime(nextTime);
  };

  const handlePlay = (video: HTMLVideoElement): void => {
    if (durationSeconds > 0 && video.currentTime >= durationSeconds - 0.05) {
      video.currentTime = 0;
      previousTimeRef.current = 0;
      triggeredPauseIdsRef.current.clear();
    } else {
      previousTimeRef.current = video.currentTime;
    }
    setActivePauseIds([]);
  };

  const resumePreview = (): void => {
    setActivePauseIds([]);
    const playResult = videoRef.current?.play();
    if (playResult) void playResult.catch(() => setMessage("Press play to continue the preview."));
  };

  const addHotspotAt = (timeSeconds: number, kindOverride?: HotspotKind): void => {
    if (!videoUrl || durationSeconds <= 0) {
      setError("Load a video before adding a hotspot.");
      return;
    }
    if (hotspots.length >= MAX_HOTSPOTS) {
      setError(`You can add up to ${String(MAX_HOTSPOTS)} hotspots to one video.`);
      return;
    }
    const time = Number(clampTime(timeSeconds, durationSeconds).toFixed(2));
    const kind = kindOverride ?? hotspotKind;
    const next: VideoHotspotDraft = {
      id: `video-hotspot-${Date.now()}`,
      timeSeconds: time,
      endTimeSeconds: Number(Math.min(durationSeconds, time + 3).toFixed(2)),
      kind,
      title: `Hotspot ${String(hotspots.length + 1)}`,
      body: ""
    };
    setHotspots((current) => [...current, next].sort((a, b) => a.timeSeconds - b.timeSeconds));
    setSelectedHotspotId(next.id);
    setMessage(`Hotspot added at ${formatTime(time)}. Edit its copy and timing on the right.`);
    setError("");
  };

  const addHotspot = (): void => {
    addHotspotAt(currentTime);
  };

  const timeFromPointer = (clientX: number): number => {
    const track = trackRef.current;
    if (!track || durationSeconds <= 0) return 0;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const ratio = (clientX - rect.left) / rect.width;
    return clampTime(ratio * durationSeconds, durationSeconds);
  };

  const handleTrackClick = (event: ReactMouseEvent<HTMLDivElement>): void => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    addHotspotAt(timeFromPointer(event.clientX));
  };

  const applyCueDrag = (hotspotId: string, edge: HotspotTimelineEdge, clientX: number): void => {
    const hotspot = hotspots.find((candidate) => candidate.id === hotspotId);
    if (!hotspot) return;
    const next = resolveTimelineEdgeDrag(
      hotspotTiming(hotspot),
      edge,
      timeFromPointer(clientX),
      durationSeconds
    );
    updateHotspot(hotspotId, {
      kind: next.kind,
      timeSeconds: next.startSeconds,
      endTimeSeconds: next.endSeconds ?? next.startSeconds
    });
  };

  const beginCueDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    hotspotId: string,
    edge: HotspotTimelineEdge | null
  ): void => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    cueDragRef.current = { hotspotId, edge, startClientX: event.clientX, moved: false };
  };

  const moveCueDrag = (event: ReactPointerEvent<HTMLButtonElement>, hotspotId: string): void => {
    const drag = cueDragRef.current;
    if (!drag || drag.hotspotId !== hotspotId) return;
    if (!drag.edge) {
      if (Math.abs(event.clientX - drag.startClientX) < 4) return;
      drag.edge = event.clientX > drag.startClientX ? "end" : "start";
      drag.moved = true;
      suppressClickRef.current = true;
    }
    drag.moved = true;
    applyCueDrag(hotspotId, drag.edge, event.clientX);
  };

  const endCueDrag = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    cueDragRef.current = null;
  };

  const handleCueKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    hotspot: VideoHotspotDraft,
    edge?: HotspotTimelineEdge
  ): void => {
    const direction =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? -1
          : 0;
    if (direction === 0 && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    event.stopPropagation();
    const timing = hotspotTiming(hotspot);
    // Home extends the start edge to 0; End extends the end edge to the video
    // length; arrow keys extend the matching edge by a step.
    const resolvedEdge = edge ?? (event.key === "Home" ? "start" : "end");
    const step =
      event.key === "Home" || event.key === "End"
        ? durationSeconds
        : event.shiftKey
          ? 1
          : CUE_KEYBOARD_STEP_SECONDS;
    const base =
      resolvedEdge === "end" ? (timing.endSeconds ?? timing.startSeconds) : timing.startSeconds;
    const extreme = event.key === "Home" ? 0 : durationSeconds;
    const target = event.key === "Home" || event.key === "End" ? extreme : base + direction * step;
    const next = resolveTimelineEdgeDrag(timing, resolvedEdge, target, durationSeconds);
    updateHotspot(hotspot.id, {
      kind: next.kind,
      timeSeconds: next.startSeconds,
      endTimeSeconds: next.endSeconds ?? next.startSeconds
    });
    setSelectedHotspotId(hotspot.id);
  };

  const updateHotspot = (id: string, patch: Partial<VideoHotspotDraft>) => {
    setHotspots((current) =>
      current
        .map((hotspot) => {
          if (hotspot.id !== id) return hotspot;
          const nextKind = patch.kind ?? hotspot.kind;
          const maximumStart =
            nextKind === "duration" ? Math.max(0, durationSeconds - 0.01) : durationSeconds;
          const nextTime =
            patch.timeSeconds === undefined
              ? hotspot.timeSeconds
              : Number(
                  Math.min(clampTime(patch.timeSeconds, durationSeconds), maximumStart).toFixed(2)
                );
          const nextEnd =
            patch.endTimeSeconds === undefined
              ? hotspot.endTimeSeconds
              : Number(clampTime(patch.endTimeSeconds, durationSeconds).toFixed(2));
          const minimumEnd = Math.min(durationSeconds, Number((nextTime + 0.01).toFixed(2)));
          return {
            ...hotspot,
            ...patch,
            kind: nextKind,
            timeSeconds: nextTime,
            endTimeSeconds: nextKind === "duration" ? Math.max(nextEnd, minimumEnd) : nextEnd,
            title: patch.title === undefined ? hotspot.title : patch.title.slice(0, 120),
            body: patch.body === undefined ? hotspot.body : patch.body.slice(0, 400)
          };
        })
        .sort((a, b) => a.timeSeconds - b.timeSeconds)
    );
  };

  const removeHotspot = (id: string) => {
    const next = hotspots.filter((hotspot) => hotspot.id !== id);
    setHotspots(next);
    setSelectedHotspotId((current) => (current === id ? next[0]?.id || null : current));
  };

  const seekTo = (timeSeconds: number) => {
    const nextTime = clampTime(timeSeconds, durationSeconds);
    pauseJumpRef.current = false;
    if (videoRef.current) videoRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const exportHotspots = () => {
    if (!videoUrl || !hotspots.length) {
      setError("Load a video and add at least one hotspot before exporting.");
      return;
    }
    const payload = {
      fileName,
      durationSeconds: Number(durationSeconds.toFixed(2)),
      hotspots: hotspots.map(({ id, timeSeconds, endTimeSeconds, kind, title, body }) => ({
        id,
        timeSeconds,
        endTimeSeconds,
        kind,
        title,
        body
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "supademo-video-hotspots.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Hotspot settings downloaded. Apply them to the video step before publishing.");
  };

  const openEditor = async () => {
    if (isSaving) return;
    const videoFile = videoFileRef.current;
    if (!videoFile || !hotspots.length) {
      setError("Load a video and add at least one hotspot before opening the editor.");
      return;
    }
    setIsSaving(true);
    const captureId = `video-hotspots-${Date.now()}`;
    const saved = await saveLocalCaptureBundle({
      version: 1,
      id: captureId,
      kind: "video",
      createdAtIso: new Date().toISOString(),
      title: fileName || "Video hotspot demo",
      mimeType: videoFile.type,
      blob: videoFile,
      videoDurationSeconds: Number(durationSeconds.toFixed(2)),
      videoHotspots: hotspots.map(({ id, timeSeconds, endTimeSeconds, kind, title, body }) => ({
        id,
        timeSeconds,
        endTimeSeconds,
        kind,
        title,
        body
      }))
    });
    if (!saved) {
      setError("The local video bundle could not be saved. Try a smaller video.");
      setIsSaving(false);
      return;
    }
    setLocalCaptureId(captureId);
    setError("");
    setMessage("Your video and hotspot timeline are ready in the local editor.");
    globalThis.location.assign(
      `/demos/${encodeURIComponent(`draft-${captureId}`)}/edit?capture=video&localCapture=${encodeURIComponent(captureId)}`
    );
  };

  useEffect(() => {
    return () => {
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  return (
    <main className="video-hotspots-page">
      <header className="video-hotspots-header">
        <a href="/upload" className="video-hotspots-back">
          ← Back to uploads
        </a>
        <p className="eyebrow">Customize · Video hotspots</p>
        <h1>Make video demos interactive</h1>
        <p>
          Add timeline-based hotspots at the exact moment they matter. Keep the video local while
          you plan the story, then export the hotspot settings for your demo.
        </p>
      </header>

      <section className="video-hotspots-card" aria-labelledby="video-hotspots-upload-heading">
        <div>
          <p className="eyebrow">1 · Choose a video</p>
          <h2 id="video-hotspots-upload-heading">Load a video step</h2>
          <p>MP4, WebM, or QuickTime videos up to 40 MB and 2 hours are supported locally.</p>
        </div>
        <label className="video-hotspots-file-button">
          {fileName ? "Replace video" : "Choose video"}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
          />
        </label>
      </section>

      <section className="video-hotspots-editor" aria-labelledby="video-hotspots-editor-heading">
        <div className="video-hotspots-preview">
          <div className="video-hotspots-preview-heading">
            <div>
              <p className="eyebrow">2 · Place hotspots</p>
              <h2 id="video-hotspots-editor-heading">Video timeline</h2>
            </div>
            <span>{fileName || "No video selected"}</span>
          </div>
          {videoUrl ? (
            <>
              <div className="video-hotspots-video-wrap">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  playsInline
                  onLoadedMetadata={handleLoadedMetadata}
                  onError={handleVideoError}
                  onTimeUpdate={(event) => handleTimeUpdate(event.currentTarget)}
                  onSeeking={handleSeeking}
                  onSeeked={(event) => handleSeeked(event.currentTarget)}
                  onPlay={(event) => handlePlay(event.currentTarget)}
                  onEnded={() => {
                    setActivePauseIds([]);
                    pauseJumpRef.current = false;
                    triggeredPauseIdsRef.current.clear();
                  }}
                  aria-label="Video hotspot preview"
                />
                {activeHotspots.length ? (
                  <div className="video-hotspots-active" role="status" aria-live="assertive">
                    {activeHotspots.map((hotspot) => (
                      <button
                        key={hotspot.id}
                        type="button"
                        onClick={() => setSelectedHotspotId(hotspot.id)}
                      >
                        <strong>{hotspot.title}</strong>
                        {hotspot.body ? <span>{hotspot.body}</span> : null}
                      </button>
                    ))}
                    {activePauseIds.length ? (
                      <button type="button" onClick={resumePreview}>
                        Resume video preview
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="video-hotspots-scrubber">
                <div
                  ref={trackRef}
                  className="video-hotspots-markers"
                  role="group"
                  aria-label="Hotspot timeline. Click an empty moment to add a hotspot."
                  onClick={handleTrackClick}
                >
                  {hotspots.map((hotspot) => {
                    const startPercent = durationSeconds
                      ? (clampTime(hotspot.timeSeconds, durationSeconds) / durationSeconds) * 100
                      : 0;
                    const endPercent = durationSeconds
                      ? (clampTime(hotspot.endTimeSeconds, durationSeconds) / durationSeconds) * 100
                      : startPercent;
                    const isSelected = hotspot.id === selectedHotspotId;
                    if (hotspot.kind === "duration") {
                      return (
                        <div
                          key={hotspot.id}
                          className={`video-hotspots-cue is-duration${isSelected ? " is-selected" : ""}`}
                          style={{
                            left: `${startPercent}%`,
                            width: `${Math.max(0, endPercent - startPercent)}%`
                          }}
                        >
                          <button
                            type="button"
                            className="video-hotspots-cue-bar"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedHotspotId(hotspot.id);
                              seekTo(hotspot.timeSeconds);
                            }}
                            aria-label={`${hotspot.title}: visible from ${formatTime(hotspot.timeSeconds)} to ${formatTime(hotspot.endTimeSeconds)}. Click to seek.`}
                          />
                          <button
                            type="button"
                            role="slider"
                            className="video-hotspots-cue-handle is-start"
                            aria-label={`${hotspot.title} start time. Arrow keys adjust it.`}
                            aria-valuemin={0}
                            aria-valuemax={durationSeconds}
                            aria-valuenow={hotspot.timeSeconds}
                            aria-valuetext={`Starts at ${formatTime(hotspot.timeSeconds)}.`}
                            onClick={(event) => event.stopPropagation()}
                            onPointerDown={(event) => beginCueDrag(event, hotspot.id, "start")}
                            onPointerMove={(event) => moveCueDrag(event, hotspot.id)}
                            onPointerUp={endCueDrag}
                            onPointerCancel={endCueDrag}
                            onKeyDown={(event) => handleCueKeyDown(event, hotspot, "start")}
                          />
                          <button
                            type="button"
                            role="slider"
                            className="video-hotspots-cue-handle is-end"
                            aria-label={`${hotspot.title} end time. Arrow keys adjust it.`}
                            aria-valuemin={0}
                            aria-valuemax={durationSeconds}
                            aria-valuenow={hotspot.endTimeSeconds}
                            aria-valuetext={`Ends at ${formatTime(hotspot.endTimeSeconds)}.`}
                            onClick={(event) => event.stopPropagation()}
                            onPointerDown={(event) => beginCueDrag(event, hotspot.id, "end")}
                            onPointerMove={(event) => moveCueDrag(event, hotspot.id)}
                            onPointerUp={endCueDrag}
                            onPointerCancel={endCueDrag}
                            onKeyDown={(event) => handleCueKeyDown(event, hotspot, "end")}
                          />
                        </div>
                      );
                    }
                    return (
                      <button
                        key={hotspot.id}
                        type="button"
                        role="slider"
                        className={`video-hotspots-marker${isSelected ? " is-selected" : ""}`}
                        style={{ left: `${startPercent}%` }}
                        aria-label={`${hotspot.title} at ${formatTime(hotspot.timeSeconds)}. Drag or use arrow keys to extend it into a duration hotspot.`}
                        aria-valuemin={0}
                        aria-valuemax={durationSeconds}
                        aria-valuenow={hotspot.timeSeconds}
                        aria-valuetext={`Pause hotspot at ${formatTime(hotspot.timeSeconds)}.`}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (suppressClickRef.current) {
                            suppressClickRef.current = false;
                            return;
                          }
                          setSelectedHotspotId(hotspot.id);
                          seekTo(hotspot.timeSeconds);
                        }}
                        onPointerDown={(event) => beginCueDrag(event, hotspot.id, null)}
                        onPointerMove={(event) => moveCueDrag(event, hotspot.id)}
                        onPointerUp={endCueDrag}
                        onPointerCancel={endCueDrag}
                        onKeyDown={(event) => handleCueKeyDown(event, hotspot)}
                      />
                    );
                  })}
                </div>
                <input
                  type="range"
                  min="0"
                  max={durationSeconds || 1}
                  step="0.01"
                  value={Math.min(currentTime, durationSeconds || 1)}
                  onChange={(event) => seekTo(Number(event.target.value))}
                  aria-label="Video timeline"
                />
                <div className="video-hotspots-time-labels">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(durationSeconds)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="video-hotspots-empty-preview">
              Choose a local video to see its timeline.
            </div>
          )}
        </div>

        <aside className="video-hotspots-inspector" aria-label="Hotspot inspector">
          <div className="video-hotspots-inspector-heading">
            <div>
              <p className="eyebrow">3 · Customize</p>
              <h2>Hotspots</h2>
            </div>
            <span>
              {hotspots.length} / {MAX_HOTSPOTS}
            </span>
          </div>
          <div className="video-hotspots-add-row">
            <select
              value={hotspotKind}
              onChange={(event) => setHotspotKind(event.target.value as HotspotKind)}
              aria-label="Hotspot type"
            >
              <option value="pause">Pause hotspot</option>
              <option value="duration">Duration hotspot</option>
            </select>
            <button type="button" onClick={addHotspot}>
              + Add at {formatTime(currentTime)}
            </button>
          </div>
          {selectedHotspot ? (
            <div className="video-hotspots-form">
              <label>
                Title
                <input
                  value={selectedHotspot.title}
                  maxLength={120}
                  onChange={(event) =>
                    updateHotspot(selectedHotspot.id, { title: event.target.value })
                  }
                />
              </label>
              <label>
                Viewer message
                <textarea
                  rows={4}
                  maxLength={400}
                  value={selectedHotspot.body}
                  onChange={(event) =>
                    updateHotspot(selectedHotspot.id, { body: event.target.value })
                  }
                />
              </label>
              <label>
                Start time (seconds)
                <input
                  type="number"
                  min="0"
                  max={durationSeconds}
                  step="0.01"
                  value={selectedHotspot.timeSeconds}
                  onChange={(event) =>
                    updateHotspot(selectedHotspot.id, { timeSeconds: Number(event.target.value) })
                  }
                />
              </label>
              {selectedHotspot.kind === "duration" ? (
                <label>
                  End time (seconds)
                  <input
                    type="number"
                    min={selectedHotspot.timeSeconds}
                    max={durationSeconds}
                    step="0.01"
                    value={selectedHotspot.endTimeSeconds}
                    onChange={(event) =>
                      updateHotspot(selectedHotspot.id, {
                        endTimeSeconds: Number(event.target.value)
                      })
                    }
                  />
                </label>
              ) : null}
              <button
                type="button"
                className="video-hotspots-remove"
                onClick={() => removeHotspot(selectedHotspot.id)}
              >
                Remove hotspot
              </button>
            </div>
          ) : (
            <p className="video-hotspots-inspector-empty">
              Add a hotspot at the current timeline position to edit it.
            </p>
          )}
        </aside>
      </section>

      {error ? (
        <p className="video-hotspots-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="video-hotspots-status" role="status" aria-live="polite">
        {message}
      </p>
      <section className="video-hotspots-export" aria-labelledby="video-hotspots-export-heading">
        <div>
          <p className="eyebrow">4 · Apply</p>
          <h2 id="video-hotspots-export-heading">Export your hotspot plan</h2>
          <p>
            Download a bounded JSON plan, then apply it to the video step before publishing or
            sharing. Pause cues pause the video for viewers; duration cues stay visible across their
            range.
          </p>
        </div>
        <button type="button" onClick={exportHotspots}>
          Download hotspot plan
        </button>
        <button type="button" onClick={() => void openEditor()} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save and open editor"}
        </button>
        {localCaptureId ? (
          <a
            className="video-hotspots-editor-link"
            href={`/demos/${encodeURIComponent(`draft-${localCaptureId}`)}/edit?capture=video&localCapture=${encodeURIComponent(localCaptureId)}`}
          >
            Open video in editor →
          </a>
        ) : null}
      </section>
    </main>
  );
}
