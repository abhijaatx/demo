/* global chrome, document, window */

const mode = document.querySelector("#mode");
const shareWithWorkspace = document.querySelector("#shareWithWorkspace");
const enableVideo = document.querySelector("#enableVideo");
const autoZoom = document.querySelector("#autoZoom");
const dimensions = document.querySelector("#dimensions");
const status = document.querySelector("#status");
const warnings = document.querySelector("#warnings");
const steps = document.querySelector("#steps");
const startButton = document.querySelector("#start");
const stopButton = document.querySelector("#stop");
const pauseButton = document.querySelector("#pause");
const resumeButton = document.querySelector("#resume");
const screenshotButton = document.querySelector("#screenshot");
const downloadButton = document.querySelector("#download");
const clearButton = document.querySelector("#clear");
const workspaceButton = document.querySelector("#workspace");

function send(type, payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message || "The extension did not respond."));
        return;
      }
      resolve(response || { ok: false, error: "The extension did not respond." });
    });
  });
}

function stateLabel(state) {
  if (!state) return "Ready to capture.";
  if (state.status === "recording") return "Recording is active. Interact with the page, then stop.";
  if (state.status === "paused") return "Recording paused.";
  if (state.status === "stopped") return "Capture ready to download.";
  return "Ready to capture.";
}

function renderWarnings(items) {
  warnings.replaceChildren();
  if (!Array.isArray(items) || items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = "No warnings.";
    warnings.append(empty);
    return;
  }

  items.forEach((warning) => {
    const item = document.createElement("li");
    item.className = "warning";
    const message = document.createElement("span");
    message.textContent = warning.message || "Review this capture.";
    const fix = document.createElement("button");
    fix.type = "button";
    fix.dataset.code = warning.code || "";
    fix.textContent = "Fix";
    item.append(message, fix);
    warnings.append(item);
  });
}

function renderSteps(items) {
  steps.replaceChildren();
  if (!Array.isArray(items) || items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = "No steps yet.";
    steps.append(empty);
    return;
  }

  items.slice(-12).forEach((step, index) => {
    const item = document.createElement("li");
    item.className = "step";
    const label = document.createElement("span");
    label.textContent = String(index + 1) + ". " + (step.eventType || "interaction") + " — " + (step.elementHint || "page");
    const marker = document.createElement("span");
    marker.className = "muted";
    marker.textContent = step.screenshot ? "image" : "metadata";
    item.append(label, marker);
    steps.append(item);
  });
}

function render(state) {
  if (!state) return;
  status.textContent = stateLabel(state);
  mode.value = state.mode || "html";
  shareWithWorkspace.checked = state.settings?.shareWithWorkspace !== false;
  enableVideo.checked = state.settings?.enableVideo === true;
  autoZoom.checked = state.settings?.autoZoom !== false;
  dimensions.value = state.settings?.dimensions || "1280x720";

  const active = state.status === "recording";
  const paused = state.status === "paused";
  startButton.disabled = active || paused;
  stopButton.disabled = !active && !paused;
  pauseButton.disabled = !active;
  resumeButton.disabled = !paused;
  downloadButton.disabled = !state.steps?.length;
  renderWarnings(state.warnings);
  renderSteps(state.steps);
}

async function refresh() {
  try {
    const response = await send("GET_STATE");
    if (response.ok) render(response.state);
  } catch (error) {
    status.textContent = error.message;
  }
}

async function start() {
  startButton.disabled = true;
  status.textContent = "Preparing capture…";
  try {
    const response = await send("START_RECORDING", {
      mode: mode.value,
      settings: {
        mode: mode.value,
        shareWithWorkspace: shareWithWorkspace.checked,
        enableVideo: enableVideo.checked,
        autoZoom: autoZoom.checked,
        dimensions: dimensions.value
      }
    });
    if (!response.ok) {
      status.textContent = response.error || "Capture could not start.";
      return;
    }
    render(response.state);
  } catch (error) {
    status.textContent = error.message;
  }
}

async function stop() {
  try {
    const response = await send("STOP_RECORDING");
    if (!response.ok) {
      status.textContent = response.error || "Capture could not stop.";
      return;
    }
    render(response.state);
  } catch (error) {
    status.textContent = error.message;
  }
}

async function pauseOrResume(type) {
  try {
    const response = await send(type);
    if (!response.ok) {
      status.textContent = response.error || "Capture state could not change.";
      return;
    }
    render(response.state);
  } catch (error) {
    status.textContent = error.message;
  }
}

async function instantScreenshot() {
  screenshotButton.disabled = true;
  status.textContent = "Capturing screenshot…";
  try {
    const response = await send("CAPTURE_SCREENSHOT");
    if (!response.ok) {
      status.textContent = response.error || "Screenshot could not be captured.";
      return;
    }
    render(response.state);
  } catch (error) {
    status.textContent = error.message;
  } finally {
    screenshotButton.disabled = false;
  }
}

async function clearCapture() {
  try {
    const response = await send("CLEAR_RECORDING");
    if (response.ok) render(response.state);
  } catch (error) {
    status.textContent = error.message;
  }
}

async function applyFix(code) {
  try {
    const response = await send("APPLY_FIX", { code });
    if (response.ok) render(response.state);
  } catch (error) {
    status.textContent = error.message;
  }
}

async function download() {
  const response = await send("GET_STATE");
  if (!response.ok || !response.state?.steps?.length) {
    status.textContent = "Record at least one step before downloading.";
    return;
  }
  const payload = JSON.stringify(response.state, null, 2);
  const downloadUrl = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "supademo-capture-" + String(Date.now()) + ".json";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  status.textContent = "Capture JSON downloaded.";
}

function openWorkspace() {
  chrome.tabs.create({ url: "http://localhost:3000/demos?new=1&capture=extension" });
}

startButton.addEventListener("click", () => void start());
stopButton.addEventListener("click", () => void stop());
pauseButton.addEventListener("click", () => void pauseOrResume("PAUSE_RECORDING"));
resumeButton.addEventListener("click", () => void pauseOrResume("RESUME_RECORDING"));
screenshotButton.addEventListener("click", () => void instantScreenshot());
downloadButton.addEventListener("click", () => void download());
clearButton.addEventListener("click", () => void clearCapture());
workspaceButton.addEventListener("click", openWorkspace);
warnings.addEventListener("click", (event) => {
  const target = event.target?.tagName === "BUTTON" ? event.target : null;
  if (target?.dataset.code) void applyFix(target.dataset.code);
});

void refresh();
