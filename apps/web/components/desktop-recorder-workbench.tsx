"use client";

import { useEffect, useRef, useState } from "react";

type DesktopCaptureMode = "screenshot" | "video";
type DesktopSourceMode = "screen" | "window";
type RecorderStatus = "idle" | "requesting" | "capturing" | "paused" | "complete" | "error";

type DesktopCaptureStep = {
  id: string;
  image: string;
  capturedAt: string;
};

const MAX_STEPS = 30;
const MAX_SCREENSHOT_LENGTH = 1_800_000;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
const MAX_RECORDING_SECONDS = 120;

function supportedVideoMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";
}

export function DesktopRecorderWorkbench() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const captureTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  const [sourceMode, setSourceMode] = useState<DesktopSourceMode>("screen");
  const [captureMode, setCaptureMode] = useState<DesktopCaptureMode>("screenshot");
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("Choose a screen or window to begin.");
  const [steps, setSteps] = useState<DesktopCaptureStep[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [timedCapture, setTimedCapture] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const clearCaptureTimer = () => {
    if (captureTimerRef.current !== null) {
      window.clearInterval(captureTimerRef.current);
      captureTimerRef.current = null;
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth < 1 || video.videoHeight < 1) {
      setStatusMessage("The shared source is not ready yet. Try again in a moment.");
      return;
    }

    const scale = Math.min(1, 1920 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      setStatus("error");
      setStatusMessage("Your browser could not prepare a screenshot canvas.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/png");
    if (image.length > MAX_SCREENSHOT_LENGTH) {
      setStatus("error");
      setStatusMessage("This screenshot is too large. Share a smaller window or lower its scale.");
      return;
    }

    setSteps((current) =>
      [
        ...current,
        {
          id: "desktop-step-" + String(Date.now()),
          image,
          capturedAt: new Date().toISOString()
        }
      ].slice(-MAX_STEPS)
    );
    setStatusMessage("Screenshot captured. Keep sharing to add another step.");
  };

  const finishVideo = () => {
    const chunks = chunksRef.current;
    if (!chunks.length) {
      setStatus("error");
      setStatusMessage("No video data was captured. Try sharing again.");
      stopTracks();
      return;
    }

    const blob = new Blob(chunks, { type: chunks[0]?.type || "video/webm" });
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    const nextUrl = URL.createObjectURL(blob);
    videoUrlRef.current = nextUrl;
    setVideoUrl(nextUrl);
    setStatus("complete");
    setStatusMessage("Video ready. Download it or continue in the editor.");
    stopTracks();
  };

  const stopRecording = () => {
    clearCaptureTimer();
    setTimedCapture(false);
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }
    stopTracks();
    if (status === "capturing" || status === "paused") {
      setStatus("complete");
      setStatusMessage("Capture finished.");
    }
  };

  const startCapture = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setStatus("error");
      setStatusMessage("Desktop capture is not supported in this browser.");
      return;
    }

    setStatus("requesting");
    setStatusMessage("Choose the screen or window to share.");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 30, max: 60 },
          displaySurface: sourceMode
        },
        audio: false
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopTracks();
        setStatus("error");
        setStatusMessage("Preview could not be initialized.");
        return;
      }

      video.srcObject = stream;
      await video.play();
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        stopRecording();
      });
      startedAtRef.current = Date.now();
      setElapsedSeconds(0);
      setStatus("capturing");
      setStatusMessage(
        captureMode === "video"
          ? "Recording your selected source. Stop when the walkthrough is complete."
          : "Source is live. Capture a screenshot for each step."
      );

      if (captureMode === "video") {
        const mimeType = supportedVideoMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (!event.data.size) return;
          const total = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
          if (total + event.data.size > MAX_VIDEO_BYTES) {
            setStatusMessage("The 40 MB local recording limit was reached.");
            stopRecording();
            return;
          }
          chunksRef.current.push(event.data);
        };
        recorder.onstop = finishVideo;
        recorder.start(1000);
      }
    } catch {
      stopTracks();
      setStatus("error");
      setStatusMessage("Screen sharing was cancelled or permission was denied.");
    }
  };

  const togglePause = () => {
    const recorder = recorderRef.current;
    if (!recorder) {
      setTimedCapture((current) => !current);
      setStatus((current) => (current === "capturing" ? "paused" : "capturing"));
      setStatusMessage(
        status === "capturing" ? "Timed screenshots paused." : "Timed screenshots resumed."
      );
      return;
    }
    if (recorder.state === "recording") {
      recorder.pause();
      setStatus("paused");
      setStatusMessage("Recording paused.");
    } else if (recorder.state === "paused") {
      recorder.resume();
      setStatus("capturing");
      setStatusMessage("Recording resumed.");
    }
  };

  const clearAll = () => {
    stopRecording();
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    videoUrlRef.current = null;
    setVideoUrl("");
    setSteps([]);
    setStatus("idle");
    setStatusMessage("Choose a screen or window to begin.");
  };

  const downloadScreenshot = (step: DesktopCaptureStep) => {
    const link = document.createElement("a");
    link.href = step.image;
    link.download = "supademo-desktop-step-" + step.id + ".png";
    link.click();
  };

  useEffect(() => {
    if (timedCapture && captureMode === "screenshot" && status === "capturing") {
      captureTimerRef.current = window.setInterval(captureFrame, 3000);
    } else {
      clearCaptureTimer();
    }
    return clearCaptureTimer;
  }, [timedCapture, captureMode, status]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (startedAtRef.current && (status === "capturing" || status === "paused")) {
        const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsedSeconds(seconds);
        if (seconds >= MAX_RECORDING_SECONDS) stopRecording();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    return () => {
      clearCaptureTimer();
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      stopTracks();
    };
  }, []);

  return (
    <main className="desktop-recorder-page">
      <header className="desktop-recorder-header">
        <a className="desktop-recorder-back" href="/download">
          ← Back to recorders
        </a>
        <div>
          <p className="eyebrow">Record</p>
          <h1>Desktop recorder</h1>
          <p className="desktop-recorder-subtitle">
            Capture a native app, terminal, emulator, or full desktop without sending your screen to
            a server.
          </p>
        </div>
        <span className={"desktop-recorder-indicator is-" + status}>
          <span aria-hidden="true" />
          {status === "capturing" ? "Capture active" : status === "paused" ? "Paused" : "Ready"}
        </span>
      </header>

      <section className="desktop-recorder-stage" aria-labelledby="desktop-recorder-stage-title">
        <div className="desktop-recorder-stage-copy">
          <p className="eyebrow">1 · Record</p>
          <h2 id="desktop-recorder-stage-title">Choose what to share</h2>
          <p>
            Your browser will show the native screen picker. Supademo never uploads this source
            automatically.
          </p>
          <div className="desktop-recorder-choice-group" aria-label="Source type">
            <button
              type="button"
              className={sourceMode === "screen" ? "is-selected" : ""}
              aria-pressed={sourceMode === "screen"}
              onClick={() => setSourceMode("screen")}
            >
              Entire screen
            </button>
            <button
              type="button"
              className={sourceMode === "window" ? "is-selected" : ""}
              aria-pressed={sourceMode === "window"}
              onClick={() => setSourceMode("window")}
            >
              App window
            </button>
          </div>
          <div className="desktop-recorder-choice-group" aria-label="Capture mode">
            <button
              type="button"
              className={captureMode === "screenshot" ? "is-selected" : ""}
              aria-pressed={captureMode === "screenshot"}
              onClick={() => setCaptureMode("screenshot")}
              disabled={status === "capturing" || status === "paused"}
            >
              Screenshot steps
            </button>
            <button
              type="button"
              className={captureMode === "video" ? "is-selected" : ""}
              aria-pressed={captureMode === "video"}
              onClick={() => setCaptureMode("video")}
              disabled={status === "capturing" || status === "paused"}
            >
              Video
            </button>
          </div>
          <div className="desktop-recorder-actions">
            <button
              className="desktop-recorder-primary"
              type="button"
              onClick={() => void startCapture()}
              disabled={status === "requesting" || status === "capturing" || status === "paused"}
            >
              {status === "requesting" ? "Waiting for permission…" : "Start sharing"}
            </button>
            {captureMode === "screenshot" && (
              <button type="button" onClick={captureFrame} disabled={status !== "capturing"}>
                Capture screenshot
              </button>
            )}
            <button
              type="button"
              onClick={stopRecording}
              disabled={status !== "capturing" && status !== "paused"}
            >
              Finish
            </button>
          </div>
          <div className="desktop-recorder-secondary-actions">
            <button
              type="button"
              onClick={togglePause}
              disabled={status !== "capturing" && status !== "paused"}
            >
              {status === "paused" ? "Resume" : "Pause"}
            </button>
            {captureMode === "screenshot" && (
              <label className="desktop-recorder-timed">
                <input
                  type="checkbox"
                  checked={timedCapture}
                  onChange={(event) => setTimedCapture(event.target.checked)}
                  disabled={status !== "capturing"}
                />
                Timed screenshots every 3s
              </label>
            )}
            <span className="desktop-recorder-elapsed">
              {elapsedSeconds}s / {MAX_RECORDING_SECONDS}s
            </span>
          </div>
          <p className="desktop-recorder-status" role="status" aria-live="polite">
            {statusMessage}
          </p>
          {status === "error" && (
            <p className="desktop-recorder-error" role="alert">
              No screen data was uploaded.
            </p>
          )}
        </div>
        <div className="desktop-recorder-preview">
          <video ref={videoRef} muted playsInline aria-label="Selected desktop source preview" />
          {status === "idle" && (
            <div className="desktop-recorder-preview-empty">
              <span aria-hidden="true">▣</span>
              <strong>Source preview</strong>
              <small>Your selected screen or window appears here.</small>
            </div>
          )}
        </div>
      </section>

      <section
        className="desktop-recorder-results"
        aria-labelledby="desktop-recorder-results-title"
      >
        <div className="desktop-recorder-results-heading">
          <div>
            <p className="eyebrow">2 · Edit</p>
            <h2 id="desktop-recorder-results-title">Captured moments</h2>
          </div>
          <button type="button" onClick={clearAll} disabled={!steps.length && !videoUrl}>
            Clear
          </button>
        </div>
        {steps.length ? (
          <div className="desktop-recorder-step-grid">
            {steps.map((step, index) => (
              <article className="desktop-recorder-step" key={step.id}>
                <img src={step.image} alt={"Desktop capture step " + String(index + 1)} />
                <div>
                  <strong>Step {index + 1}</strong>
                  <button type="button" onClick={() => downloadScreenshot(step)}>
                    Download
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {videoUrl ? (
          <div className="desktop-recorder-video-result">
            <video src={videoUrl} controls playsInline aria-label="Recorded desktop video" />
            <a href={videoUrl} download="supademo-desktop-recording.webm">
              Download video
            </a>
          </div>
        ) : null}
        {!steps.length && !videoUrl ? (
          <p className="desktop-recorder-empty">
            Finish a screenshot or video capture to see your local result here.
          </p>
        ) : null}
        <div className="desktop-recorder-next">
          <strong>Ready to keep editing?</strong>
          <span>Move your captured screens into the familiar demo editor.</span>
          <a href="/demos?new=1&capture=desktop">Open editor</a>
        </div>
      </section>
    </main>
  );
}
