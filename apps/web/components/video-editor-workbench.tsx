"use client";

import { createVideoEditTimeline } from "@supademo/domain";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

type Segment = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speed: number;
  muted: boolean;
};

const MAX_FILE_BYTES = 40 * 1024 * 1024;
const MAX_DURATION_SECONDS = 7_200;
const MAX_SEGMENTS = 40;
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function rounded(value: number): number {
  return Number(value.toFixed(2));
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function createSegment(startSeconds: number, endSeconds: number, suffix: string): Segment {
  return {
    id: `segment-${Date.now()}-${suffix}`,
    startSeconds: rounded(startSeconds),
    endSeconds: rounded(endSeconds),
    speed: 1,
    muted: false
  };
}

export function VideoEditorWorkbench() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrlRef = useRef<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [message, setMessage] = useState("Load a video to start editing its timeline.");
  const [error, setError] = useState("");

  const selectedSegment = segments.find((segment) => segment.id === selectedSegmentId) ?? null;
  const activeSegment = useMemo(
    () =>
      segments.find(
        (segment) => currentTime >= segment.startSeconds && currentTime <= segment.endSeconds
      ) ?? selectedSegment,
    [currentTime, segments, selectedSegment]
  );

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
    videoUrlRef.current = nextUrl;
    setVideoUrl(nextUrl);
    setFileName(file.name.slice(0, 120));
    setDurationSeconds(0);
    setCurrentTime(0);
    setSegments([]);
    setSelectedSegmentId(null);
    setMessage("Video loaded. Scrub the timeline, then split or select a segment to edit it.");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) loadVideo(file);
  };

  const handleLoadedMetadata = () => {
    const duration = videoRef.current?.duration ?? 0;
    if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_DURATION_SECONDS) {
      setError("Choose a video between 1 second and 2 hours.");
      setDurationSeconds(0);
      setSegments([]);
      return;
    }
    setDurationSeconds(duration);
    const first = createSegment(0, duration, "initial");
    setSegments([first]);
    setSelectedSegmentId(first.id);
    setError("");
    setMessage("Timeline ready. Use Split at the playhead or select a segment for precise edits.");
  };

  const handleVideoError = () => {
    setError("Video preview could not be loaded. Choose a valid MP4, WebM, or QuickTime file.");
    setDurationSeconds(0);
    setSegments([]);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = activeSegment?.speed ?? 1;
    video.muted = activeSegment?.muted ?? false;
  }, [activeSegment?.muted, activeSegment?.speed, videoUrl]);

  const seekTo = (seconds: number) => {
    const next = clamp(seconds, 0, durationSeconds);
    if (videoRef.current) videoRef.current.currentTime = next;
    setCurrentTime(next);
    const segment = segments.find((item) => next >= item.startSeconds && next <= item.endSeconds);
    if (segment) setSelectedSegmentId(segment.id);
  };

  const updateSelectedSegment = (patch: Partial<Segment>) => {
    if (!selectedSegment) return;
    setSegments((current) =>
      current.map((segment) => {
        if (segment.id !== selectedSegment.id) return segment;
        const nextStart = rounded(
          clamp(patch.startSeconds ?? segment.startSeconds, 0, segment.endSeconds - 0.05)
        );
        const nextEnd = rounded(
          clamp(patch.endSeconds ?? segment.endSeconds, nextStart + 0.05, durationSeconds)
        );
        return {
          ...segment,
          ...patch,
          startSeconds: nextStart,
          endSeconds: nextEnd,
          speed: SPEED_OPTIONS.includes(patch.speed as (typeof SPEED_OPTIONS)[number])
            ? patch.speed!
            : segment.speed
        };
      })
    );
  };

  const splitAtPlayhead = () => {
    if (!selectedSegment || segments.length >= MAX_SEGMENTS) {
      setError(`A video can contain at most ${String(MAX_SEGMENTS)} segments.`);
      return;
    }
    const splitAt = rounded(currentTime);
    if (
      splitAt <= selectedSegment.startSeconds + 0.05 ||
      splitAt >= selectedSegment.endSeconds - 0.05
    ) {
      setError("Move the playhead inside the selected segment before splitting.");
      return;
    }
    const first = createSegment(selectedSegment.startSeconds, splitAt, "left");
    const second = createSegment(splitAt, selectedSegment.endSeconds, "right");
    first.speed = selectedSegment.speed;
    first.muted = selectedSegment.muted;
    second.speed = selectedSegment.speed;
    second.muted = selectedSegment.muted;
    setSegments((current) => {
      const index = current.findIndex((segment) => segment.id === selectedSegment.id);
      return [...current.slice(0, index), first, second, ...current.slice(index + 1)];
    });
    setSelectedSegmentId(second.id);
    setError("");
    setMessage(
      `Split at ${formatTime(splitAt)}. Each segment can now be trimmed, sped up, muted, duplicated, or deleted.`
    );
  };

  const duplicateSelected = () => {
    if (!selectedSegment || segments.length >= MAX_SEGMENTS) {
      setError(`A video can contain at most ${String(MAX_SEGMENTS)} segments.`);
      return;
    }
    const duplicate = {
      ...selectedSegment,
      id: `segment-${Date.now()}-duplicate`
    };
    const index = segments.findIndex((segment) => segment.id === selectedSegment.id);
    setSegments((current) => [
      ...current.slice(0, index + 1),
      duplicate,
      ...current.slice(index + 1)
    ]);
    setSelectedSegmentId(duplicate.id);
    setMessage("Segment duplicated. The duplicate keeps the same source range and edit settings.");
  };

  const deleteSelected = () => {
    if (!selectedSegment) return;
    if (segments.length <= 1) {
      setError("Keep at least one segment in the video edit.");
      return;
    }
    const next = segments.filter((segment) => segment.id !== selectedSegment.id);
    setSegments(next);
    setSelectedSegmentId(next[0]?.id ?? null);
    setMessage("Segment deleted from the edit plan. The original video remains unchanged.");
  };

  const downloadPlan = () => {
    if (!videoUrl || !durationSeconds || !segments.length) {
      setError("Load a video and wait for its metadata before exporting an edit plan.");
      return;
    }
    try {
      const timeline = createVideoEditTimeline(durationSeconds, {
        trimStartSeconds: Math.min(...segments.map((segment) => segment.startSeconds)),
        trimEndSeconds: Math.max(...segments.map((segment) => segment.endSeconds)),
        posterTimestampSeconds: currentTime
      });
      const payload = {
        fileName,
        timeline,
        segments: segments.map((segment) => ({ ...segment }))
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "supademo-video-edit-plan.json";
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Edit plan downloaded. Apply it to the video step when you save the demo.");
      setError("");
    } catch (exportError: unknown) {
      setError(exportError instanceof Error ? exportError.message : "Edit plan export failed.");
    }
  };

  useEffect(() => {
    return () => {
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  return (
    <main className="video-editor-page">
      <header className="video-editor-header">
        <a className="video-editor-back" href="/upload">
          ← Back to uploads
        </a>
        <p className="eyebrow">Customize · Video editor</p>
        <h1>Shape every moment of your video demo</h1>
        <p>
          Split, trim, adjust speed, and mute individual segments on a visual timeline. The source
          file stays local while you prepare a non-destructive edit plan.
        </p>
      </header>

      <section className="video-editor-upload" aria-labelledby="video-editor-upload-heading">
        <div>
          <p className="eyebrow">1 · Open a video step</p>
          <h2 id="video-editor-upload-heading">Choose a video recording</h2>
          <p>MP4, WebM, and QuickTime files up to 40 MB and 2 hours are supported locally.</p>
        </div>
        <label className="video-editor-file-button">
          {fileName ? "Replace video" : "Choose video"}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
          />
        </label>
      </section>

      <section className="video-editor-workspace" aria-labelledby="video-editor-heading">
        <div className="video-editor-preview-column">
          <div className="video-editor-section-heading">
            <div>
              <p className="eyebrow">2 · Timeline</p>
              <h2 id="video-editor-heading">Edit your recording</h2>
            </div>
            <span>{fileName || "No video selected"}</span>
          </div>
          {videoUrl ? (
            <video
              ref={videoRef}
              className="video-editor-preview"
              src={videoUrl}
              controls
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              aria-label="Video editor preview"
            />
          ) : (
            <div className="video-editor-empty-preview">
              Choose a local video to see its timeline.
            </div>
          )}
          <div className="video-editor-timeline-wrap">
            <input
              className="video-editor-scrubber"
              type="range"
              min="0"
              max={durationSeconds || 1}
              step="0.01"
              value={Math.min(currentTime, durationSeconds || 1)}
              onChange={(event) => seekTo(Number(event.currentTarget.value))}
              aria-label="Video editor playhead"
            />
            <div className="video-editor-time-labels">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(durationSeconds)}</span>
            </div>
            <div className="video-editor-segments" aria-label="Video segments">
              {segments.map((segment) => (
                <button
                  type="button"
                  key={segment.id}
                  className={segment.id === selectedSegmentId ? "is-selected" : ""}
                  style={{
                    left: `${durationSeconds ? (segment.startSeconds / durationSeconds) * 100 : 0}%`,
                    width: `${durationSeconds ? ((segment.endSeconds - segment.startSeconds) / durationSeconds) * 100 : 0}%`
                  }}
                  onClick={() => {
                    setSelectedSegmentId(segment.id);
                    seekTo(segment.startSeconds);
                  }}
                  aria-label={`Segment ${formatTime(segment.startSeconds)} to ${formatTime(segment.endSeconds)}`}
                >
                  <span>{segment.muted ? "Muted" : "Segment"}</span>
                  {segment.speed !== 1 ? <small>{String(segment.speed)}×</small> : null}
                </button>
              ))}
            </div>
          </div>
          <div className="video-editor-actions">
            <button
              type="button"
              className="video-editor-primary"
              onClick={splitAtPlayhead}
              disabled={!selectedSegment}
            >
              Split at playhead
            </button>
            <button type="button" onClick={duplicateSelected} disabled={!selectedSegment}>
              Duplicate segment
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              disabled={!selectedSegment || segments.length <= 1}
            >
              Delete segment
            </button>
          </div>
        </div>

        <aside className="video-editor-inspector" aria-label="Segment editor">
          <div className="video-editor-section-heading">
            <div>
              <p className="eyebrow">3 · Segment controls</p>
              <h2>Selected segment</h2>
            </div>
            <span>
              {segments.length} / {MAX_SEGMENTS}
            </span>
          </div>
          {selectedSegment ? (
            <div className="video-editor-form">
              <label>
                Start time (seconds)
                <input
                  type="number"
                  min="0"
                  max={selectedSegment.endSeconds - 0.05}
                  step="0.01"
                  value={selectedSegment.startSeconds}
                  onChange={(event) =>
                    updateSelectedSegment({ startSeconds: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label>
                End time (seconds)
                <input
                  type="number"
                  min={selectedSegment.startSeconds + 0.05}
                  max={durationSeconds}
                  step="0.01"
                  value={selectedSegment.endSeconds}
                  onChange={(event) =>
                    updateSelectedSegment({ endSeconds: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label>
                Playback speed
                <select
                  value={String(selectedSegment.speed)}
                  onChange={(event) =>
                    updateSelectedSegment({ speed: Number(event.currentTarget.value) })
                  }
                >
                  {SPEED_OPTIONS.map((speed) => (
                    <option key={speed} value={speed}>
                      {String(speed)}×
                    </option>
                  ))}
                </select>
              </label>
              <label className="video-editor-check">
                <input
                  type="checkbox"
                  checked={selectedSegment.muted}
                  onChange={(event) =>
                    updateSelectedSegment({ muted: event.currentTarget.checked })
                  }
                />
                Mute this segment
              </label>
              <p className="video-editor-duration">
                Segment duration:{" "}
                {formatTime(selectedSegment.endSeconds - selectedSegment.startSeconds)}
              </p>
            </div>
          ) : (
            <p className="video-editor-inspector-empty">
              Load a video and select a segment to edit it.
            </p>
          )}
        </aside>
      </section>

      {error ? (
        <p className="video-editor-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="video-editor-status" role="status" aria-live="polite">
        {message}
      </p>
      <section className="video-editor-export" aria-labelledby="video-editor-export-heading">
        <div>
          <p className="eyebrow">4 · Save</p>
          <h2 id="video-editor-export-heading">Keep the edit non-destructive</h2>
          <p>Download the bounded timeline plan. The original video is never overwritten.</p>
        </div>
        <button type="button" onClick={downloadPlan}>
          Download edit plan
        </button>
      </section>
    </main>
  );
}
