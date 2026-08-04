"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

type HotspotKind = "pause" | "duration";

type VideoHotspotDraft = {
  id: string;
  timeSeconds: number;
  endTimeSeconds: number;
  kind: HotspotKind;
  title: string;
  body: string;
};

const MAX_FILE_BYTES = 40 * 1024 * 1024;
const MAX_HOTSPOTS = 20;
const MAX_DURATION_SECONDS = 7_200;
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function clampTime(value: number, duration: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(0, value), Math.max(0, duration));
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function VideoHotspotsWorkbench() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrlRef = useRef<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hotspotKind, setHotspotKind] = useState<HotspotKind>("pause");
  const [hotspots, setHotspots] = useState<VideoHotspotDraft[]>([]);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [message, setMessage] = useState(
    "Load a video to place timeline hotspots at exact moments."
  );
  const [error, setError] = useState("");

  const selectedHotspot = hotspots.find((hotspot) => hotspot.id === selectedHotspotId) || null;
  const activeHotspots = useMemo(
    () =>
      hotspots.filter(
        (hotspot) =>
          currentTime >= hotspot.timeSeconds &&
          (hotspot.kind === "pause" || currentTime <= hotspot.endTimeSeconds)
      ),
    [currentTime, hotspots]
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
    setHotspots([]);
    setSelectedHotspotId(null);
    setCurrentTime(0);
    setDurationSeconds(0);
    setMessage("Video loaded. Play or scrub to the moment where a hotspot should appear.");
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

  const addHotspot = () => {
    if (!videoUrl || durationSeconds <= 0) {
      setError("Load a video before adding a hotspot.");
      return;
    }
    if (hotspots.length >= MAX_HOTSPOTS) {
      setError(`You can add up to ${String(MAX_HOTSPOTS)} hotspots to one video.`);
      return;
    }
    const timeSeconds = Number(clampTime(currentTime, durationSeconds).toFixed(2));
    const next: VideoHotspotDraft = {
      id: `video-hotspot-${Date.now()}`,
      timeSeconds,
      endTimeSeconds: Number(Math.min(durationSeconds, timeSeconds + 3).toFixed(2)),
      kind: hotspotKind,
      title: `Hotspot ${String(hotspots.length + 1)}`,
      body: ""
    };
    setHotspots((current) => [...current, next].sort((a, b) => a.timeSeconds - b.timeSeconds));
    setSelectedHotspotId(next.id);
    setMessage(
      `Hotspot added at ${formatTime(timeSeconds)}. Edit its copy and timing on the right.`
    );
    setError("");
  };

  const updateHotspot = (id: string, patch: Partial<VideoHotspotDraft>) => {
    setHotspots((current) =>
      current
        .map((hotspot) => {
          if (hotspot.id !== id) return hotspot;
          const nextTime =
            patch.timeSeconds === undefined
              ? hotspot.timeSeconds
              : Number(clampTime(patch.timeSeconds, durationSeconds).toFixed(2));
          const nextEnd =
            patch.endTimeSeconds === undefined
              ? hotspot.endTimeSeconds
              : Number(clampTime(patch.endTimeSeconds, durationSeconds).toFixed(2));
          return {
            ...hotspot,
            ...patch,
            timeSeconds: nextTime,
            endTimeSeconds: Math.max(nextTime, nextEnd),
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
                  onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                  aria-label="Video hotspot preview"
                />
                {activeHotspots.length ? (
                  <div className="video-hotspots-active" role="status">
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
                  </div>
                ) : null}
              </div>
              <div className="video-hotspots-scrubber">
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
                <div className="video-hotspots-markers" aria-label="Hotspot markers">
                  {hotspots.map((hotspot) => (
                    <button
                      key={hotspot.id}
                      type="button"
                      style={{
                        left: `${durationSeconds ? (hotspot.timeSeconds / durationSeconds) * 100 : 0}%`
                      }}
                      className={hotspot.id === selectedHotspotId ? "is-selected" : ""}
                      aria-label={`${hotspot.title} at ${formatTime(hotspot.timeSeconds)}`}
                      onClick={() => seekTo(hotspot.timeSeconds)}
                    />
                  ))}
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
            sharing.
          </p>
        </div>
        <button type="button" onClick={exportHotspots}>
          Download hotspot plan
        </button>
      </section>
    </main>
  );
}
