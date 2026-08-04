/* global chrome */

const MAX_CAPTURED_VALUE_LENGTH = 500;
const MAX_ELEMENT_HINT_LENGTH = 120;
const MAX_STEPS = 50;
const MAX_SCREENSHOT_BYTES = 1_800_000;
const MAX_STORED_BYTES = 7_000_000;
const RECORDING_KEY = "recordingState";
const SAFE_MODES = new Set(["screenshot", "html", "video"]);
const SAFE_DIMENSIONS = new Set(["1280x720", "1440x900", "1920x1080"]);
const SAFE_STATUSES = new Set(["idle", "recording", "paused", "stopped"]);
const CAPTURE_EVENT_TYPES = new Set(["click", "input", "scroll", "keydown", "screenshot"]);
const captureQueues = new Map();

function freshIdleState() {
  return {
    status: "idle",
    mode: "html",
    settings: {
      shareWithWorkspace: true,
      enableVideo: false,
      autoZoom: true,
      dimensions: "1280x720"
    },
    activeTabId: null,
    steps: [],
    warnings: [],
    capturedAt: null,
    finalized: false,
    lastCapture: null
  };
}

function boundedText(value, maxLength = MAX_CAPTURED_VALUE_LENGTH) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\p{Cc}\p{Cf}]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, maxLength);
}

function safeUrl(rawUrl) {
  if (typeof rawUrl !== "string") return null;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return (parsed.origin + parsed.pathname).slice(0, MAX_CAPTURED_VALUE_LENGTH);
  } catch {
    return null;
  }
}

function safeCapture(tab) {
  const url = safeUrl(tab?.url);
  if (!url || typeof tab?.title !== "string") return null;

  return {
    title: boundedText(tab.title),
    url,
    capturedAt: new Date().toISOString()
  };
}

function normalizeSettings(input = {}) {
  const mode = SAFE_MODES.has(input.mode) ? input.mode : "html";
  const dimensions = SAFE_DIMENSIONS.has(input.dimensions) ? input.dimensions : "1280x720";

  return {
    mode,
    shareWithWorkspace: input.shareWithWorkspace !== false,
    enableVideo: input.enableVideo === true || mode === "video",
    autoZoom: input.autoZoom !== false,
    dimensions
  };
}

function normalizeStoredCapture(value) {
  const url = safeUrl(value?.url);
  if (!url || typeof value?.title !== "string") return null;
  return {
    title: boundedText(value.title),
    url,
    capturedAt: boundedText(value.capturedAt, 40)
  };
}

function normalizeStoredStep(step) {
  if (!step || typeof step !== "object") return null;
  const event = normalizeEvent(step);
  if (!event) return null;
  const screenshot =
    typeof step.screenshot === "string" &&
    step.screenshot.startsWith("data:image/png;base64,") &&
    step.screenshot.length <= MAX_SCREENSHOT_BYTES
      ? step.screenshot
      : null;
  return {
    id: boundedText(step.id, 80) || "step",
    ...event,
    screenshot,
    storageLimited: step.storageLimited === true
  };
}

function normalizeState(value) {
  const state = value && typeof value === "object" ? value : {};
  const steps = Array.isArray(state.steps)
    ? state.steps.map(normalizeStoredStep).filter(Boolean).slice(-MAX_STEPS)
    : [];
  const warnings = Array.isArray(state.warnings)
    ? state.warnings
        .filter((warning) => warning && typeof warning === "object")
        .map((warning) => ({
          code: boundedText(warning.code, 40),
          message: boundedText(warning.message, 240)
        }))
        .filter((warning) => warning.code && warning.message)
        .slice(0, 8)
    : [];

  return {
    ...freshIdleState(),
    status: SAFE_STATUSES.has(state.status) ? state.status : "idle",
    mode: SAFE_MODES.has(state.mode) ? state.mode : "html",
    settings: normalizeSettings(state.settings),
    activeTabId: Number.isInteger(state.activeTabId) && state.activeTabId > 0 ? state.activeTabId : null,
    steps,
    warnings,
    capturedAt: boundedText(state.capturedAt, 40) || null,
    finalized: state.finalized === true,
    lastCapture: normalizeStoredCapture(state.lastCapture)
  };
}

function isTrustedSender(sender) {
  return sender?.id === chrome.runtime.id;
}

function storageGet(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message || "Storage read failed."));
        return;
      }
      resolve(result?.[key]);
    });
  });
}

function storageSet(value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(value, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message || "Storage write failed."));
        return;
      }
      resolve();
    });
  });
}

async function readState() {
  try {
    const stored = await storageGet(RECORDING_KEY);
    return normalizeState(stored);
  } catch {
    return freshIdleState();
  }
}

async function writeState(state) {
  const next = normalizeState(state);
  const serialized = JSON.stringify(next);
  if (serialized.length > MAX_STORED_BYTES) {
    next.steps = next.steps.map((step) => ({ ...step, screenshot: null }));
  }
  await storageSet({ [RECORDING_KEY]: next });
  return next;
}

function queryActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      resolve(tabs?.[0] || null);
    });
  });
}

function queryAllTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => resolve(Array.isArray(tabs) ? tabs : []));
  });
}

function executeContent(tabId) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] }, () => {
      const error = chrome.runtime.lastError;
      resolve(!error);
    });
  });
}

function sendToTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        resolve({ ok: false, error: error.message || "The page did not respond." });
        return;
      }
      resolve(response || { ok: false, error: "The page did not respond." });
    });
  });
}

function captureVisibleTab(tab) {
  return new Promise((resolve) => {
    if (!tab || tab.windowId === undefined) {
      resolve(null);
      return;
    }

    chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (dataUrl) => {
      const error = chrome.runtime.lastError;
      if (error || typeof dataUrl !== "string" || dataUrl.length > MAX_SCREENSHOT_BYTES) {
        resolve(null);
        return;
      }
      resolve(dataUrl);
    });
  });
}

function normalizeCoordinate(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function normalizeEvent(payload = {}) {
  const eventType = CAPTURE_EVENT_TYPES.has(payload.eventType) ? payload.eventType : null;
  if (!eventType) return null;

  const key =
    payload.key === "Enter" ||
    payload.key === "Escape" ||
    payload.key === "Tab" ||
    payload.key === "Backspace" ||
    payload.key === "ArrowUp" ||
    payload.key === "ArrowDown" ||
    payload.key === "ArrowLeft" ||
    payload.key === "ArrowRight" ||
    payload.key === "character"
      ? payload.key
      : undefined;

  const event = {
    eventType,
    elementHint: boundedText(payload.elementHint, MAX_ELEMENT_HINT_LENGTH),
    x: normalizeCoordinate(payload.x),
    y: normalizeCoordinate(payload.y),
    scrollY: Number.isFinite(payload.scrollY)
      ? Math.max(0, Math.min(100000, Math.round(payload.scrollY)))
      : 0,
    capturedAt: new Date().toISOString()
  };

  if (key) event.key = key;
  if (payload.metaKey === true) event.metaKey = true;
  if (payload.ctrlKey === true) event.ctrlKey = true;
  if (payload.shiftKey === true) event.shiftKey = true;
  if (payload.altKey === true) event.altKey = true;
  if (typeof payload.fieldType === "string") {
    const fieldType = payload.fieldType.toLowerCase();
    if (["text", "email", "search", "password", "number", "url"].includes(fieldType)) {
      event.fieldType = fieldType;
    }
  }
  return event;
}

function isSensitiveEvent(payload = {}) {
  if (payload.sensitive === true) return true;
  const fieldType = typeof payload.fieldType === "string" ? payload.fieldType.toLowerCase() : "";
  return fieldType === "password" || fieldType === "number" && payload.isPaymentField === true;
}

async function analyzeWarnings(tab, context = {}) {
  const warnings = [];
  const width = Number(context.viewportWidth);
  const height = Number(context.viewportHeight);

  if (width > 0 && height > 0) {
    const ratio = width / height;
    if (Math.abs(ratio - 16 / 9) > 0.18) {
      warnings.push({
        code: "aspect-ratio",
        message: "This page is not close to the recommended 16:9 recording ratio."
      });
    }
  }

  const tabs = await queryAllTabs();
  if (tabs.length > 8) {
    warnings.push({
      code: "too-many-tabs",
      message: "You have many tabs open. Close unrelated tabs for a cleaner capture."
    });
  }

  if (Number(context.nodeCount) > 5000) {
    warnings.push({
      code: "complex-site",
      message: "This page has a large DOM. Screenshot capture is recommended for reliability."
    });
  }

  if (!safeUrl(tab?.url)) {
    warnings.push({
      code: "unsupported-page",
      message: "This browser page cannot be captured. Open a regular http or https page."
    });
  }

  return warnings;
}

async function startRecording(payload = {}, commandTab = null) {
  const tab = commandTab?.id ? commandTab : await queryActiveTab();
  const capture = safeCapture(tab);
  if (!capture || !tab?.id) {
    return { ok: false, error: "Open a regular http or https page before recording." };
  }

  const settings = normalizeSettings(payload.settings || payload);
  const injected = await executeContent(tab.id);
  if (!injected) {
    return { ok: false, error: "This page does not allow capture. Try a regular website tab." };
  }

  const response = await sendToTab(tab.id, {
    type: "SUPADEMO_START_CAPTURE",
    settings
  });
  if (!response.ok) {
    return { ok: false, error: response.error || "The page did not start capture." };
  }

  const warnings = await analyzeWarnings(tab, response.context);
  const state = await writeState({
    ...freshIdleState(),
    status: "recording",
    mode: settings.mode || (payload.mode || "html"),
    settings,
    activeTabId: tab.id,
    warnings,
    lastCapture: capture,
    capturedAt: new Date().toISOString(),
    finalized: false
  });
  return { ok: true, state };
}

async function stopRecording(commandTab = null) {
  const state = await readState();
  if (state.status !== "recording" && state.status !== "paused") {
    return { ok: true, state };
  }

  const tabId = state.activeTabId || commandTab?.id;
  if (tabId) await sendToTab(tabId, { type: "SUPADEMO_STOP_CAPTURE" });

  const next = await writeState({
    ...state,
    status: "stopped",
    activeTabId: null,
    finalized: true,
    capturedAt: state.capturedAt || new Date().toISOString()
  });
  return { ok: true, state: next };
}

async function setRecordingPause(paused) {
  const state = await readState();
  if (paused && state.status !== "recording") return { ok: true, state };
  if (!paused && state.status !== "paused") return { ok: true, state };

  if (state.activeTabId) {
    await sendToTab(state.activeTabId, {
      type: paused ? "SUPADEMO_PAUSE_CAPTURE" : "SUPADEMO_RESUME_CAPTURE"
    });
  }

  const next = await writeState({ ...state, status: paused ? "paused" : "recording" });
  return { ok: true, state: next };
}

async function appendCaptureEvent(payload, sender) {
  const state = await readState();
  if (
    (state.status !== "recording" && state.status !== "paused") ||
    !sender?.tab?.id ||
    sender.tab.id !== state.activeTabId
  ) {
    return { ok: false, error: "No active recording for this page." };
  }
  if (isSensitiveEvent(payload)) {
    return { ok: true, skipped: true, state };
  }

  const event = normalizeEvent(payload);
  if (!event) return { ok: false, error: "Unsupported capture event." };

  const screenshot = await captureVisibleTab(sender.tab);
  const step = {
    id: "step-" + String(state.steps.length + 1),
    ...event,
    screenshot
  };
  const nextSteps = [...state.steps, step].slice(-MAX_STEPS);
  const candidate = { ...state, steps: nextSteps };
  if (JSON.stringify(candidate).length > MAX_STORED_BYTES) {
    step.screenshot = null;
    step.storageLimited = true;
  }

  const next = await writeState({ ...state, steps: [...state.steps, step].slice(-MAX_STEPS) });
  return { ok: true, state: next };
}

function queueCaptureEvent(payload, sender) {
  const tabId = sender?.tab?.id;
  if (!tabId) return Promise.resolve({ ok: false, error: "Capture sender is missing a tab." });

  const previous = captureQueues.get(tabId) || Promise.resolve();
  const next = previous.catch(() => undefined).then(() => appendCaptureEvent(payload, sender));
  captureQueues.set(tabId, next);
  return next.finally(() => {
    if (captureQueues.get(tabId) === next) captureQueues.delete(tabId);
  });
}

async function captureScreenshot(commandTab = null) {
  const tab = commandTab?.id ? commandTab : await queryActiveTab();
  const capture = safeCapture(tab);
  const screenshot = await captureVisibleTab(tab);
  if (!capture || !screenshot) {
    return { ok: false, error: "The visible page could not be captured." };
  }

  const state = await readState();
  const step = {
    id: "step-" + String(state.steps.length + 1),
    eventType: "screenshot",
    elementHint: "visible page",
    x: 0,
    y: 0,
    scrollY: 0,
    screenshot,
    capturedAt: new Date().toISOString()
  };
  const next = await writeState({
    ...(state.status === "recording" || state.status === "paused" ? state : freshIdleState()),
    status: state.status === "recording" || state.status === "paused" ? state.status : "stopped",
    mode: "screenshot",
    steps: [...state.steps, step].slice(-MAX_STEPS),
    lastCapture: capture,
    capturedAt: new Date().toISOString(),
    finalized: state.status !== "recording" && state.status !== "paused"
  });
  return { ok: true, state: next };
}

async function applyFix(code) {
  const state = await readState();
  const settings = { ...state.settings };
  if (code === "aspect-ratio") settings.dimensions = "1280x720";
  if (code === "complex-site") {
    settings.enableVideo = false;
    settings.autoZoom = false;
  }

  const next = await writeState({
    ...state,
    settings,
    warnings: state.warnings.filter((warning) => warning.code !== code)
  });
  return { ok: true, state: next };
}

async function handleMessage(message, sender) {
  switch (message?.type) {
    case "capture-active-tab": {
      const capture = safeCapture(await queryActiveTab());
      if (!capture) return { ok: false, error: "Open a regular website before capturing." };
      await storageSet({ lastCapture: capture });
      return { ok: true, capture };
    }
    case "GET_STATE":
      return { ok: true, state: await readState() };
    case "START_RECORDING":
      return startRecording(message.payload, null);
    case "STOP_RECORDING":
      return stopRecording();
    case "PAUSE_RECORDING":
      return setRecordingPause(true);
    case "RESUME_RECORDING":
      return setRecordingPause(false);
    case "CAPTURE_EVENT":
      return queueCaptureEvent(message.payload, sender);
    case "CAPTURE_SCREENSHOT":
      return captureScreenshot(null);
    case "APPLY_FIX":
      return applyFix(boundedText(message.code, 40));
    case "CLEAR_RECORDING":
      return { ok: true, state: await writeState(freshIdleState()) };
    default:
      return { ok: false, error: "Unknown extension command." };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isTrustedSender(sender)) return false;

  handleMessage(message, sender)
    .then(sendResponse)
    .catch(() => sendResponse({ ok: false, error: "The capture action could not be completed." }));
  return true;
});

if (chrome.commands?.onCommand) {
  chrome.commands.onCommand.addListener(async (command, tab) => {
    if (command === "instant-screenshot") {
      await captureScreenshot(tab);
      return;
    }

    if (command === "start-recording") {
      const state = await readState();
      if (state.status === "recording" || state.status === "paused") {
        await stopRecording(tab);
      } else {
        await startRecording({}, tab);
      }
    }
  });
}
