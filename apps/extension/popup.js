/* global chrome, document */

const captureButton = document.querySelector("#capture");
const status = document.querySelector("#status");

captureButton.addEventListener("click", () => {
  captureButton.disabled = true;
  status.textContent = "Capturing…";

  chrome.runtime.sendMessage({ type: "capture-active-tab" }, (response) => {
    captureButton.disabled = false;
    if (chrome.runtime.lastError || !response?.ok) {
      status.textContent = response?.error || "Capture could not be completed.";
      return;
    }

    status.textContent = `Captured ${response.capture.title}.`;
  });
});
