/* global chrome, document, window, HTMLElement */

(function installSupaDemoCapture() {
  if (window.__SUPADEMO_CAPTURE_INSTALLED__) return;
  window.__SUPADEMO_CAPTURE_INSTALLED__ = true;

  let active = false;
  let scrollTimer = null;
  let hoveredElement = null;
  const listeners = [];

  function boundedText(value, maxLength) {
    if (typeof value !== "string") return "";
    return value
      .replace(/[\p{Cc}\p{Cf}]/gu, " ")
      .replace(/\s+/gu, " ")
      .trim()
      .slice(0, maxLength);
  }

  function isSensitiveElement(element) {
    if (!(element instanceof HTMLElement)) return false;
    const type = (element.getAttribute("type") || "").toLowerCase();
    const autocomplete = (element.getAttribute("autocomplete") || "").toLowerCase();
    const name = (element.getAttribute("name") || "").toLowerCase();
    const id = (element.getAttribute("id") || "").toLowerCase();
    const token = autocomplete + " " + name + " " + id;
    return (
      type === "password" ||
      /cc-|card|cvv|cvc|iban|routing|secret|token|password/iu.test(token)
    );
  }

  function elementHint(element) {
    if (!(element instanceof HTMLElement)) return "page";
    const tag = element.tagName.toLowerCase().slice(0, 20);
    const type = boundedText(element.getAttribute("type") || "", 20).toLowerCase();
    return type ? tag + "[" + type + "]" : tag;
  }

  function coordinates(event) {
    const width = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
    const height = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    return {
      x: Math.max(0, Math.min(1, event.clientX / width)),
      y: Math.max(0, Math.min(1, event.clientY / height))
    };
  }

  function sendEvent(payload) {
    if (!active) return;
    chrome.runtime.sendMessage(
      {
        type: "CAPTURE_EVENT",
        payload
      },
      () => {
        void chrome.runtime.lastError;
      }
    );
  }

  function onClick(event) {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const point = coordinates(event);
    sendEvent({
      eventType: "click",
      elementHint: elementHint(target),
      x: point.x,
      y: point.y,
      scrollY: window.scrollY
    });
  }

  function onMouseover(event) {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target && !target.closest("[data-supademo-overlay]")) hoveredElement = target;
  }

  function onInput(event) {
    const target = event.target instanceof HTMLElement ? event.target : null;
    sendEvent({
      eventType: "input",
      elementHint: elementHint(target),
      fieldType: boundedText(target?.getAttribute("type") || "text", 20).toLowerCase(),
      sensitive: isSensitiveElement(target),
      x: 0,
      y: 0,
      scrollY: window.scrollY
    });
  }

  function onKeydown(event) {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const safeKey = ["Enter", "Escape", "Tab", "Backspace", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      event.key
    )
      ? event.key
      : "character";
    sendEvent({
      eventType: "keydown",
      elementHint: elementHint(target),
      fieldType: boundedText(target?.getAttribute("type") || "", 20).toLowerCase(),
      sensitive: isSensitiveElement(target),
      key: safeKey,
      metaKey: event.metaKey === true,
      ctrlKey: event.ctrlKey === true,
      shiftKey: event.shiftKey === true,
      altKey: event.altKey === true,
      x: 0,
      y: 0,
      scrollY: window.scrollY
    });
  }

  function onScroll() {
    if (scrollTimer) return;
    scrollTimer = window.setTimeout(() => {
      scrollTimer = null;
      sendEvent({
        eventType: "scroll",
        elementHint: "page",
        x: 0,
        y: 0,
        scrollY: window.scrollY
      });
    }, 250);
  }

  function context() {
    return {
      viewportWidth: Math.max(0, Math.min(10000, window.innerWidth || 0)),
      viewportHeight: Math.max(0, Math.min(10000, window.innerHeight || 0)),
      nodeCount: Math.min(100000, document.querySelectorAll("*").length)
    };
  }

  function start() {
    if (active) return;
    active = true;
    window.addEventListener("click", onClick, true);
    window.addEventListener("input", onInput, true);
    window.addEventListener("keydown", onKeydown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("mouseover", onMouseover, true);
    listeners.push(onClick, onInput, onKeydown, onScroll, onMouseover);
  }

  function stop() {
    active = false;
    window.removeEventListener("click", onClick, true);
    window.removeEventListener("input", onInput, true);
    window.removeEventListener("keydown", onKeydown, true);
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("mouseover", onMouseover, true);
    if (scrollTimer) window.clearTimeout(scrollTimer);
    scrollTimer = null;
    hoveredElement = null;
    listeners.length = 0;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender?.id !== chrome.runtime.id) return false;

    if (message?.type === "SUPADEMO_START_CAPTURE") {
      start();
      sendResponse({ ok: true, context: context() });
      return false;
    }
    if (message?.type === "SUPADEMO_STOP_CAPTURE") {
      stop();
      sendResponse({ ok: true });
      return false;
    }
    if (message?.type === "SUPADEMO_PAUSE_CAPTURE") {
      active = false;
      sendResponse({ ok: true });
      return false;
    }
    if (message?.type === "SUPADEMO_RESUME_CAPTURE") {
      start();
      sendResponse({ ok: true });
      return false;
    }
    if (message?.type === "SUPADEMO_CONTEXT") {
      sendResponse({ ok: true, context: context() });
      return false;
    }
    if (message?.type === "SUPADEMO_MANUAL_CAPTURE") {
      const target = hoveredElement || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      const rect = target?.getBoundingClientRect();
      const width = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
      const height = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
      sendResponse({
        ok: true,
        elementHint: elementHint(target),
        x: rect ? Math.max(0, Math.min(1, (rect.left + rect.width / 2) / width)) : 0.5,
        y: rect ? Math.max(0, Math.min(1, (rect.top + rect.height / 2) / height)) : 0.5,
        scrollY: window.scrollY
      });
      return false;
    }
    return false;
  });
})();
