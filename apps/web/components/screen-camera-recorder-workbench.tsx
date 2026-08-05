"use client";

import { useEffect, useRef, useState } from "react";
import { deleteLocalCaptureBundle, saveLocalCaptureBundle } from "../src/lib/local-capture-storage";

type RecorderLayout = "screen" | "camera" | "screen-camera";
type RecorderStatus = "idle" | "requesting" | "recording" | "paused" | "complete" | "error";
type BubblePosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const MAX_RECORDING_SECONDS = 120;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

function getVideoMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function fitVideo(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  width: number,
  height: number,
  contain = false
) {
  if (video.readyState < 2 || video.videoWidth < 1 || video.videoHeight < 1) return;
  const sourceRatio = video.videoWidth / video.videoHeight;
  const targetRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  if (contain ? sourceRatio > targetRatio : sourceRatio < targetRatio) {
    drawHeight = width / sourceRatio;
  } else {
    drawWidth = height * sourceRatio;
  }
  context.drawImage(
    video,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
}

function drawRoundedImage(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.save();
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.clip();
  fitVideo(context, video, x, y, width, height);
  context.restore();
  context.save();
  context.strokeStyle = "rgba(255,255,255,0.96)";
  context.lineWidth = 10;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.stroke();
  context.restore();
}

export function ScreenCameraRecorderWorkbench() {
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const recordedStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const [layout, setLayout] = useState<RecorderLayout>("screen-camera");
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [statusMessage, setStatusMessage] = useState(
    "Choose a layout, then grant access to the sources you want to record."
  );
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [systemAudioEnabled, setSystemAudioEnabled] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [microphoneDevices, setMicrophoneDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraDeviceId, setCameraDeviceId] = useState("");
  const [microphoneDeviceId, setMicrophoneDeviceId] = useState("");
  const [bubblePosition, setBubblePosition] = useState<BubblePosition>("bottom-right");
  const [bubbleSize, setBubbleSize] = useState(26);
  const [videoUrl, setVideoUrl] = useState("");
  const [localCaptureId, setLocalCaptureId] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const stopSources = () => {
    stopStream(displayStreamRef.current);
    stopStream(cameraStreamRef.current);
    stopStream(recordedStreamRef.current);
    displayStreamRef.current = null;
    cameraStreamRef.current = null;
    recordedStreamRef.current = null;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
  };

  const stopAnimation = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const refreshDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    setCameraDevices(devices.filter((device) => device.kind === "videoinput").slice(0, 8));
    setMicrophoneDevices(devices.filter((device) => device.kind === "audioinput").slice(0, 8));
  };

  const finishRecording = async () => {
    const chunks = chunksRef.current;
    if (!chunks.length) {
      stopAnimation();
      stopSources();
      setStatus("error");
      setStatusMessage("No video data was captured. Try recording again.");
      return;
    }
    const blob = new Blob(chunks, { type: chunks[0]?.type || "video/webm" });
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    const nextUrl = URL.createObjectURL(blob);
    videoUrlRef.current = nextUrl;
    setVideoUrl(nextUrl);
    stopAnimation();
    stopSources();
    if (blob.size > MAX_VIDEO_BYTES) {
      setStatus("error");
      setStatusMessage(
        "The local 40 MB recording limit was reached before the video could be prepared."
      );
      return;
    }
    const captureId =
      typeof globalThis.crypto?.randomUUID === "function"
        ? `capture-${globalThis.crypto.randomUUID()}`
        : `capture-${Date.now().toString(36)}`;
    const saved = await saveLocalCaptureBundle({
      version: 1,
      id: captureId,
      kind: "video",
      createdAtIso: new Date().toISOString(),
      title: "Screen and camera recording",
      mimeType: blob.type || "video/webm",
      blob
    });
    setLocalCaptureId(saved ? captureId : "");
    setStatus(saved ? "complete" : "error");
    setStatusMessage(
      saved
        ? "Recording ready. Download it or continue in the demo editor."
        : "Recording is ready to download, but this browser could not keep an editor handoff."
    );
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }
    stopAnimation();
    stopSources();
    if (status === "recording" || status === "paused") {
      setStatus("complete");
      setStatusMessage("Recording finished.");
    }
  };

  const createCompositeStream = (
    displayStream: MediaStream | null,
    cameraStream: MediaStream | null
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The recording canvas could not be initialized.");
    const draw = () => {
      context.fillStyle = "#101828";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const screenVideo = screenVideoRef.current;
      const cameraVideo = cameraVideoRef.current;
      if (displayStream && screenVideo) {
        fitVideo(context, screenVideo, 0, 0, canvas.width, canvas.height);
      } else if (cameraVideo) {
        fitVideo(context, cameraVideo, 0, 0, canvas.width, canvas.height, true);
      }
      if (displayStream && cameraVideo) {
        const width = Math.round(canvas.width * (bubbleSize / 100));
        const height = Math.round(width * 0.75);
        const margin = 32;
        const x = bubblePosition.endsWith("right") ? canvas.width - width - margin : margin;
        const y = bubblePosition.startsWith("bottom") ? canvas.height - height - margin : margin;
        drawRoundedImage(context, cameraVideo, x, y, width, height, 34);
      }
      animationFrameRef.current = window.requestAnimationFrame(draw);
    };
    draw();
    const composite = canvas.captureStream(30);
    for (const track of displayStream?.getAudioTracks() || []) composite.addTrack(track);
    for (const track of cameraStream?.getAudioTracks() || []) composite.addTrack(track);
    return composite;
  };

  const startRecording = async () => {
    if (
      (layout !== "camera" && !navigator.mediaDevices?.getDisplayMedia) ||
      (layout !== "screen" && !navigator.mediaDevices?.getUserMedia)
    ) {
      setStatus("error");
      setStatusMessage("This browser does not support the selected recording layout.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setStatus("error");
      setStatusMessage("This browser does not support video recording.");
      return;
    }

    setStatus("requesting");
    setStatusMessage("Approve the requested screen, camera, and microphone permissions.");
    try {
      const needsScreen = layout !== "camera";
      const needsCamera = layout !== "screen";
      const displayStream = needsScreen
        ? await navigator.mediaDevices.getDisplayMedia({
            video: { frameRate: { ideal: 30, max: 60 }, displaySurface: "monitor" },
            audio: systemAudioEnabled
          })
        : null;
      const cameraStream = needsCamera
        ? await navigator.mediaDevices.getUserMedia({
            video: cameraDeviceId
              ? {
                  deviceId: { exact: cameraDeviceId },
                  width: { ideal: 1920 },
                  height: { ideal: 1080 }
                }
              : { width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: microphoneEnabled
              ? microphoneDeviceId
                ? { deviceId: { exact: microphoneDeviceId } }
                : true
              : false
          })
        : null;

      displayStreamRef.current = displayStream;
      cameraStreamRef.current = cameraStream;
      if (screenVideoRef.current && displayStream) {
        screenVideoRef.current.srcObject = displayStream;
        await screenVideoRef.current.play();
      }
      if (cameraVideoRef.current && cameraStream) {
        cameraVideoRef.current.srcObject = cameraStream;
        await cameraVideoRef.current.play();
      }
      await refreshDevices();

      const recordedStream =
        layout === "screen-camera"
          ? createCompositeStream(displayStream, cameraStream)
          : displayStream || cameraStream;
      if (!recordedStream) throw new Error("No recording source was selected.");
      recordedStreamRef.current = recordedStream;
      chunksRef.current = [];
      const mimeType = getVideoMimeType();
      const recorder = new MediaRecorder(recordedStream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (!event.data.size) return;
        const currentSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        if (currentSize + event.data.size > MAX_VIDEO_BYTES) {
          setStatusMessage("The local 40 MB recording limit was reached.");
          stopRecording();
          return;
        }
        chunksRef.current.push(event.data);
      };
      recorder.onstop = () => void finishRecording();
      recorder.start(1000);
      const endCapture = () => stopRecording();
      displayStream?.getTracks().forEach((track) => track.addEventListener("ended", endCapture));
      cameraStream?.getTracks().forEach((track) => track.addEventListener("ended", endCapture));
      startedAtRef.current = Date.now();
      setElapsedSeconds(0);
      setStatus("recording");
      setStatusMessage("Recording in progress. Stop when your walkthrough is complete.");
    } catch {
      stopSources();
      setStatus("error");
      setStatusMessage("Recording was cancelled or a requested permission was denied.");
    }
  };

  const togglePause = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      setStatus("paused");
      setStatusMessage("Recording paused.");
    } else if (recorder.state === "paused") {
      recorder.resume();
      setStatus("recording");
      setStatusMessage("Recording resumed.");
    }
  };

  const toggleMicrophone = (enabled: boolean) => {
    setMicrophoneEnabled(enabled);
    cameraStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  };

  const clearRecording = () => {
    stopRecording();
    if (localCaptureId) void deleteLocalCaptureBundle(localCaptureId);
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    videoUrlRef.current = null;
    setVideoUrl("");
    setLocalCaptureId("");
    setElapsedSeconds(0);
    setStatus("idle");
    setStatusMessage("Choose a layout, then grant access to the sources you want to record.");
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!startedAtRef.current || (status !== "recording" && status !== "paused")) return;
      const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSeconds(seconds);
      if (seconds >= MAX_RECORDING_SECONDS) stopRecording();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    return () => {
      stopAnimation();
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      stopSources();
    };
  }, []);

  return (
    <main className="screen-camera-recorder-page">
      <header className="screen-camera-recorder-header">
        <a href="/download" className="screen-camera-recorder-back">
          ← Back to recorders
        </a>
        <div>
          <p className="eyebrow">Record · Screen + camera</p>
          <h1>Record your screen and camera</h1>
          <p>
            Capture a desktop walkthrough, a webcam intro, or both in one video. Your recording
            stays in this browser until you choose to download or continue editing.
          </p>
        </div>
        <span className={"screen-camera-recorder-indicator is-" + status}>
          <span aria-hidden="true" />
          {status === "recording" ? "Recording" : status === "paused" ? "Paused" : "Ready"}
        </span>
      </header>

      <section
        className="screen-camera-recorder-stage"
        aria-labelledby="screen-camera-stage-heading"
      >
        <div className="screen-camera-recorder-controls">
          <p className="eyebrow">1 · Set up</p>
          <h2 id="screen-camera-stage-heading">Choose your recording layout</h2>
          <div className="screen-camera-recorder-choice" aria-label="Recording layout">
            {(
              [
                ["screen", "Screen only"],
                ["camera", "Camera only"],
                ["screen-camera", "Screen + camera"]
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={layout === value ? "is-selected" : ""}
                aria-pressed={layout === value}
                onClick={() => setLayout(value)}
                disabled={status === "recording" || status === "paused" || status === "requesting"}
              >
                {label}
              </button>
            ))}
          </div>

          {layout !== "camera" ? (
            <label className="screen-camera-recorder-check">
              <input
                type="checkbox"
                checked={systemAudioEnabled}
                onChange={(event) => setSystemAudioEnabled(event.target.checked)}
                disabled={status === "recording" || status === "paused"}
              />
              Include system audio
            </label>
          ) : null}
          {layout !== "screen" ? (
            <>
              <label className="screen-camera-recorder-check">
                <input
                  type="checkbox"
                  checked={microphoneEnabled}
                  onChange={(event) => toggleMicrophone(event.target.checked)}
                  disabled={status === "recording" || status === "paused"}
                />
                Include microphone
              </label>
              <label className="screen-camera-recorder-select">
                Camera
                <select
                  value={cameraDeviceId}
                  onChange={(event) => setCameraDeviceId(event.target.value)}
                  disabled={status === "recording" || status === "paused" || !cameraDevices.length}
                >
                  <option value="">Default camera</option>
                  {cameraDevices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || "Camera " + String(index + 1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="screen-camera-recorder-select">
                Microphone
                <select
                  value={microphoneDeviceId}
                  onChange={(event) => setMicrophoneDeviceId(event.target.value)}
                  disabled={
                    status === "recording" || status === "paused" || !microphoneDevices.length
                  }
                >
                  <option value="">Default microphone</option>
                  {microphoneDevices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || "Microphone " + String(index + 1)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
          {layout === "screen-camera" ? (
            <div className="screen-camera-recorder-bubble-options">
              <label className="screen-camera-recorder-select">
                Camera bubble position
                <select
                  value={bubblePosition}
                  onChange={(event) => setBubblePosition(event.target.value as BubblePosition)}
                  disabled={status === "recording" || status === "paused"}
                >
                  <option value="top-left">Top left</option>
                  <option value="top-right">Top right</option>
                  <option value="bottom-left">Bottom left</option>
                  <option value="bottom-right">Bottom right</option>
                </select>
              </label>
              <label className="screen-camera-recorder-range">
                Bubble size
                <input
                  type="range"
                  min="18"
                  max="40"
                  value={bubbleSize}
                  onChange={(event) => setBubbleSize(Number(event.target.value))}
                  disabled={status === "recording" || status === "paused"}
                />
                <span>{bubbleSize}%</span>
              </label>
            </div>
          ) : null}

          <div className="screen-camera-recorder-actions">
            <button
              type="button"
              className="screen-camera-recorder-primary"
              onClick={() => void startRecording()}
              disabled={status === "requesting" || status === "recording" || status === "paused"}
            >
              {status === "requesting" ? "Waiting for permission…" : "Start recording"}
            </button>
            <button
              type="button"
              onClick={togglePause}
              disabled={status !== "recording" && status !== "paused"}
            >
              {status === "paused" ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={stopRecording}
              disabled={status !== "recording" && status !== "paused"}
            >
              Stop recording
            </button>
          </div>
          <p className="screen-camera-recorder-status" role="status" aria-live="polite">
            {statusMessage}
          </p>
          <p className="screen-camera-recorder-elapsed">
            {elapsedSeconds}s / {MAX_RECORDING_SECONDS}s maximum
          </p>
          {status === "error" ? (
            <p className="screen-camera-recorder-error" role="alert">
              No recording data was uploaded.
            </p>
          ) : null}
        </div>

        <div className="screen-camera-recorder-preview" aria-label="Recording preview">
          <video ref={screenVideoRef} muted playsInline aria-label="Screen preview" />
          <video
            ref={cameraVideoRef}
            muted
            playsInline
            aria-label="Camera preview"
            className={layout === "screen-camera" ? "is-bubble" : ""}
          />
          {status === "idle" ? (
            <div className="screen-camera-recorder-preview-empty">
              <strong>Preview</strong>
              <span>Approve access to see your selected layout here.</span>
            </div>
          ) : null}
        </div>
      </section>

      <section
        className="screen-camera-recorder-result"
        aria-labelledby="screen-camera-result-heading"
      >
        <div>
          <p className="eyebrow">2 · Finish</p>
          <h2 id="screen-camera-result-heading">Your recording</h2>
          <p>Review the local video before downloading it or adding it to a Supademo workflow.</p>
        </div>
        {videoUrl ? (
          <div className="screen-camera-recorder-video-result">
            <video
              src={videoUrl}
              controls
              playsInline
              aria-label="Recorded screen and camera video"
            />
            <div>
              <a href={videoUrl} download="supademo-screen-camera-recording.webm">
                Download recording
              </a>
              {localCaptureId ? (
                <a
                  href={`/demos/${encodeURIComponent(`draft-${localCaptureId}`)}/edit?capture=video&localCapture=${encodeURIComponent(localCaptureId)}`}
                >
                  Continue in editor →
                </a>
              ) : null}
              <button
                type="button"
                onClick={clearRecording}
                disabled={status === "requesting" || status === "recording" || status === "paused"}
              >
                Record again
              </button>
            </div>
          </div>
        ) : (
          <p className="screen-camera-recorder-empty">Stop a recording to review it here.</p>
        )}
      </section>
    </main>
  );
}
