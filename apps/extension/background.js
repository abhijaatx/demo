/* global chrome */

const MAX_CAPTURED_VALUE_LENGTH = 500;

function safeCapture(tab) {
  if (!tab?.url || !tab?.title) return null;

  try {
    const parsed = new URL(tab.url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

    return {
      title: tab.title.slice(0, MAX_CAPTURED_VALUE_LENGTH),
      url: `${parsed.origin}${parsed.pathname}`.slice(0, MAX_CAPTURED_VALUE_LENGTH),
      capturedAt: new Date().toISOString()
    };
  } catch {
    return null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || message?.type !== "capture-active-tab") return;

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    const capture = safeCapture(tabs[0]);
    if (!capture) {
      sendResponse({ ok: false, error: "Open a regular website before capturing." });
      return;
    }

    chrome.storage.local.set({ lastCapture: capture }, () => sendResponse({ ok: true, capture }));
  });

  return true;
});
