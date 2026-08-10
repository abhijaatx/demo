"use client";

import {
  calculateEffectiveAudioVolume,
  isShareLinkExpired,
  isValidShareToken,
  findCrossedPauseHotspots,
  isDemoHotspotVisibleAtTime,
  extractPersonalizedVariablesFromUrl,
  parseDemoDocument,
  parseShareLinkExpiry,
  pauseHotspotIdsBeforeTime,
  resolveLocalizedText,
  resolveTemplateTokens,
  sanitizeEmbedUrl,
  translationContentKey,
  translationLabelForLocale,
  validateFormSubmission,
  verifyChapterPassword,
  type DemoDocument,
  type DemoChapter,
  type DemoFormSchema,
  type DemoHotspot,
  type DemoTranslationDictionary,
  validateSafeUrl
} from "@supademo/domain";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { croppedMediaStyle } from "../src/lib/crop-media-style";
import {
  createDocumentFromLocalCapture,
  rehydrateLocalCaptureDocument
} from "../src/lib/local-capture-document";
import { readLocalCaptureBundle } from "../src/lib/local-capture-storage";

type EmbeddedEventType =
  | "Supademo:load"
  | "Supademo:started"
  | "Supademo:slideChange"
  | "Supademo:progress"
  | "Supademo:completed"
  | "Supademo:close";

function embeddedParentOrigin(): string | null {
  if (typeof window === "undefined" || window.parent === window) return null;
  try {
    const referrer = document.referrer;
    if (!referrer) return null;
    const origin = new URL(referrer).origin;
    return origin === "null" ? null : origin;
  } catch {
    return null;
  }
}

function postEmbeddedEvent(
  embedded: boolean,
  type: EmbeddedEventType,
  payload: Readonly<Record<string, unknown>>
): void {
  if (!embedded || typeof window === "undefined") return;
  const targetOrigin = embeddedParentOrigin();
  if (!targetOrigin) return;
  window.parent.postMessage(
    Object.freeze({
      source: "Supademo",
      type,
      payload: Object.freeze({ ...payload })
    }),
    targetOrigin
  );
}

function safeMediaUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "blob:" && parsed.origin !== "null") return parsed.toString();
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function chapterAtPosition(document: DemoDocument, position: number): DemoChapter | null {
  return document.chapters.find((chapter) => chapter.orderIndex === position) ?? null;
}

function readStoredDocument(demoId: string, offlineOnly = false): DemoDocument | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = offlineOnly
      ? localStorage.getItem(`supademo_offline_${demoId}`)
      : (localStorage.getItem(`supademo_published_${demoId}`) ??
        localStorage.getItem(`supademo_draft_${demoId}`));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && "document" in parsed) {
      return parseDemoDocument((parsed as { document: unknown }).document);
    }
    return parseDemoDocument(parsed);
  } catch {
    return null;
  }
}

function requestedTranslationLocale(
  value: string | null,
  dictionaries: readonly DemoTranslationDictionary[]
): string {
  if (!value) return "en-US";
  const normalized = value.trim().toLowerCase();
  return (
    dictionaries.find(
      (dictionary) =>
        dictionary.locale.toLowerCase() === normalized ||
        translationLabelForLocale(dictionary.locale).toLowerCase() === normalized
    )?.locale ?? "en-US"
  );
}

function requestedStepIndex(search: string, stepCount: number): number {
  if (stepCount <= 0) return 0;
  const raw = new URLSearchParams(search).get("step");
  const requested = Number(raw);
  return Number.isSafeInteger(requested) && requested >= 1 && requested <= stepCount
    ? requested - 1
    : 0;
}

function readExpiringShareLinkError(demoId: string): string | null {
  const params = new URLSearchParams(globalThis.location?.search ?? "");
  const token = params.get("share");
  const expiresAtMs = parseShareLinkExpiry(params.get("expires"));
  if (!token && !params.get("expires")) return null;
  if (!isValidShareToken(token) || expiresAtMs === null) {
    return "This share link is invalid.";
  }
  if (isShareLinkExpired(expiresAtMs)) return "This share link has expired.";
  try {
    const current = JSON.parse(localStorage.getItem(`supademo_share_links_${demoId}`) ?? "[]");
    const records = Array.isArray(current) ? current : [];
    const matchingRecord = records.find(
      (record) =>
        typeof record === "object" &&
        record !== null &&
        (record as Record<string, unknown>)["token"] === token &&
        Number((record as Record<string, unknown>)["expiresAtMs"]) === expiresAtMs
    );
    if (!matchingRecord) return "This expiring share link is unavailable in this browser.";
  } catch {
    return "This expiring share link is unavailable.";
  }
  return null;
}

function recordViewerEvent(demoId: string, stepId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    const query = new URLSearchParams(globalThis.location?.search ?? "");
    const ref =
      query
        .get("ref")
        ?.replace(/[^a-zA-Z0-9._-]/g, "-")
        .slice(0, 64) ?? null;
    const key = `supademo_view_events_${demoId}`;
    const current = JSON.parse(localStorage.getItem(key) ?? "[]");
    const events = Array.isArray(current) ? current.slice(-99) : [];
    events.push({ stepId, ref, viewedAtIso: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(events));
  } catch {
    // Viewer analytics are best effort and never block playback.
  }
}

function recordFormSubmission(
  demoId: string,
  form: DemoFormSchema,
  answers: Readonly<Record<string, string>>
): void {
  if (typeof localStorage === "undefined") return;
  try {
    const key = `supademo_form_submissions_${demoId}`;
    const current = JSON.parse(localStorage.getItem(key) ?? "[]");
    const submissions = Array.isArray(current) ? current.slice(-49) : [];
    const boundedAnswers = Object.fromEntries(
      form.fields.map((field) => [field.id, (answers[field.id] ?? "").slice(0, 2_000)])
    );
    submissions.push({
      formId: form.formId,
      answers: boundedAnswers,
      submittedAtIso: new Date().toISOString()
    });
    localStorage.setItem(key, JSON.stringify(submissions));
  } catch {
    // Form playback must remain usable when local storage is unavailable or full.
  }
}

export function DemoViewer({
  demoId,
  initialDocument,
  embedded = false,
  offlineOnly = false,
  localCaptureId
}: {
  demoId: string;
  initialDocument: DemoDocument;
  embedded?: boolean;
  offlineOnly?: boolean;
  localCaptureId?: string;
}) {
  const [demoDocument, setDemoDocument] = useState<DemoDocument>(initialDocument);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    chapterAtPosition(initialDocument, 0)?.id ?? null
  );
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [unlockedChapterIds, setUnlockedChapterIds] = useState<ReadonlySet<string>>(new Set());
  const [gatePasswordDraft, setGatePasswordDraft] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState("en-US");
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [shareAccessError, setShareAccessError] = useState<string | null>(null);
  const [localCaptureError, setLocalCaptureError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const chapterVoiceoverRef = useRef<HTMLAudioElement | null>(null);
  const viewerVideoRef = useRef<HTMLVideoElement | null>(null);
  const previousVideoTimeRef = useRef(0);
  const videoSeekingRef = useRef(false);
  const pauseJumpVideoRef = useRef(false);
  const triggeredVideoPauseIdsRef = useRef<Set<string>>(new Set());
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [activeVideoPauseIds, setActiveVideoPauseIds] = useState<readonly string[]>([]);

  // Demo-level background music. The audio element mounts inert: playback never
  // starts on page load and only begins after the viewer's first interaction
  // (gesture). While narration plays, the music volume is ducked so voiceovers
  // stay intelligible. The creator may also mark the track as starting muted.
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const [voiceoverPlaying, setVoiceoverPlaying] = useState(false);
  // Paused by default; after the first viewer gesture the track auto-starts
  // unless the creator configured it to start muted or the viewer paused it.
  const [bgMusicPaused, setBgMusicPaused] = useState(false);
  const [bgMusicMuted, setBgMusicMuted] = useState(false);
  // Tracks explicit viewer intent on the music controls. The creator's
  // start-muted flag only governs the initial auto-start: once the viewer
  // chooses Play or Mute themselves, Play can always start the track again.
  const [bgUserEngaged, setBgUserEngaged] = useState(false);

  const emitStarted = (): void => {
    if (startedRef.current) return;
    startedRef.current = true;
    setHasStarted(true);
    postEmbeddedEvent(embedded, "Supademo:started", { demoId });
  };

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadDocument = async (): Promise<void> => {
      const stored = readStoredDocument(demoId, offlineOnly);
      let nextDocument = stored ?? initialDocument;
      setLocalCaptureError(null);

      if (localCaptureId && !offlineOnly) {
        const bundle = await readLocalCaptureBundle(localCaptureId);
        if (!active) return;
        if (!bundle) {
          nextDocument = initialDocument;
          setLocalCaptureError(
            "This browser-local preview is no longer available. Return to the editor and import the media again."
          );
        } else {
          objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
          objectUrlsRef.current.clear();
          const captured = createDocumentFromLocalCapture(initialDocument, bundle, (blob) => {
            const objectUrl = URL.createObjectURL(blob);
            objectUrlsRef.current.add(objectUrl);
            return objectUrl;
          });
          nextDocument = stored
            ? rehydrateLocalCaptureDocument(captured, stored, bundle.id)
            : captured;
        }
      }

      const nextIndex = requestedStepIndex(
        globalThis.location?.search ?? "",
        nextDocument.steps.length
      );
      setDemoDocument(nextDocument);
      setCurrentIndex(nextIndex);
      setActiveChapterId(chapterAtPosition(nextDocument, nextIndex)?.id ?? null);
      setShareAccessError(readExpiringShareLinkError(demoId));
      setSelectedLocale(
        requestedTranslationLocale(
          new URLSearchParams(globalThis.location?.search ?? "").get("lang"),
          nextDocument.translations
        )
      );
      setLoadedFromStorage(true);
      postEmbeddedEvent(embedded, "Supademo:load", {
        demoId,
        title: demoId,
        totalSlides: nextDocument.steps.length
      });
    };
    void loadDocument();
    return () => {
      active = false;
    };
  }, [demoId, embedded, initialDocument, localCaptureId, offlineOnly]);

  useEffect(() => {
    if (!embedded) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") postEmbeddedEvent(true, "Supademo:close", {});
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [demoId, embedded]);

  const step = demoDocument.steps[currentIndex] ?? null;
  const currentChapter =
    demoDocument.chapters.find((chapter) => chapter.id === activeChapterId) ?? null;
  const currentForm = currentChapter?.type === "form" ? currentChapter.form : null;
  // Password protection only gates `gate` chapters (the parser also strips it
  // from other types; this is defense-in-depth for hand-edited documents).
  const gate = currentChapter?.type === "gate" ? (currentChapter.passwordProtection ?? null) : null;
  const gateLocked = Boolean(gate && !unlockedChapterIds.has(currentChapter?.id ?? ""));
  const viewerVariables = useMemo(() => {
    const personalization = demoDocument.settings.personalization;
    if (!personalization.enabled) return Object.freeze({});
    return extractPersonalizedVariablesFromUrl(
      typeof globalThis.location?.search === "string" ? globalThis.location.search : "",
      personalization.allowlist
    );
  }, [demoDocument.settings.personalization]);
  const localizedText = (value: string | null | undefined, contentId?: string): string => {
    const fallback = value ?? "";
    if (!contentId || selectedLocale === "en-US") return fallback;
    return resolveLocalizedText(
      contentId,
      selectedLocale,
      demoDocument.translations,
      "en-US",
      fallback
    );
  };
  const renderText = (value: string | null | undefined, contentId?: string): string =>
    resolveTemplateTokens(
      localizedText(value, contentId),
      viewerVariables,
      demoDocument.settings.personalization.fallbacks
    );
  const selectLocale = (locale: string): void => {
    setSelectedLocale(locale);
    setLanguageMenuOpen(false);
    try {
      const nextUrl = new URL(globalThis.location.href);
      if (locale === "en-US") nextUrl.searchParams.delete("lang");
      else nextUrl.searchParams.set("lang", translationLabelForLocale(locale));
      globalThis.history.replaceState({}, "", nextUrl.toString());
    } catch {
      // URL state is best effort; the selected locale still applies in this viewer.
    }
  };
  const viewerTheme = demoDocument.settings.theme;
  const presetBackgrounds: Record<DemoDocument["settings"]["theme"]["backgroundPreset"], string> = {
    solid: "none",
    aurora: "linear-gradient(145deg, rgb(24 36 72 / 96%), rgb(76 53 130 / 90%))",
    sunset: "linear-gradient(145deg, rgb(77 36 70 / 96%), rgb(170 82 69 / 90%))",
    mint: "linear-gradient(145deg, rgb(20 53 55 / 96%), rgb(40 112 104 / 90%))"
  };
  const customBackgroundImage = viewerTheme.backgroundImageUrl
    ? safeMediaUrl(viewerTheme.backgroundImageUrl)
    : null;
  const viewerBackgroundImage = customBackgroundImage
    ? `url(${customBackgroundImage})`
    : presetBackgrounds[viewerTheme.backgroundPreset];
  const chapterMediaUrl = currentChapter?.mediaUrl ? safeMediaUrl(currentChapter.mediaUrl) : null;
  const chapterNarrationUrl = currentChapter?.voiceover?.audioUrl
    ? safeMediaUrl(currentChapter.voiceover.audioUrl)
    : null;
  // Embedded forms, surveys, and calendars (embed chapters): render only a
  // parser-validated public HTTPS URL. Re-sanitizing here is defense-in-depth
  // for hand-edited documents; an invalid URL renders a safe placeholder and
  // never attempts navigation or a fetch.
  const chapterEmbedUrl =
    currentChapter?.type === "embed" ? sanitizeEmbedUrl(currentChapter.embedUrl) : null;

  // Chapter voiceovers never autoplay on page load. When autoplay is enabled
  // the audio element mounts inert and playback is only started here once the
  // viewer's first interaction has fired (hasStarted) — flipping the autoPlay
  // attribute on a mounted element is unreliable, so we call play() directly.
  useEffect(() => {
    const audio = chapterVoiceoverRef.current;
    if (!audio) return;
    if (hasStarted && !gateLocked && Boolean(currentChapter?.voiceover?.autoPlay)) {
      void audio.play().catch(() => {
        // Native media policy may require the viewer to press Play again.
      });
    } else {
      audio.pause();
    }
  }, [
    hasStarted,
    gateLocked,
    currentChapter?.id,
    currentChapter?.voiceover?.autoPlay,
    chapterNarrationUrl
  ]);

  const backgroundAudio = demoDocument.settings.backgroundAudio;
  const backgroundMusicUrl = backgroundAudio?.audioUrl
    ? safeMediaUrl(backgroundAudio.audioUrl)
    : null;

  // Ducking: whenever narration audio is actually playing (step or chapter
  // voiceover, whether auto-played or started manually with the native
  // controls), lower the music volume by the configured ducking ratio.
  useEffect(() => {
    const audio = backgroundMusicRef.current;
    if (!audio || !backgroundAudio) return;
    const effective = calculateEffectiveAudioVolume(voiceoverPlaying, backgroundAudio);
    audio.volume = Math.max(0, Math.min(1, effective.backgroundAudioVolume));
  }, [voiceoverPlaying, backgroundAudio]); // Gesture-gated start: the audio element mounts inert and playback begins
  // automatically after the first viewer interaction (hasStarted) unless a
  // password gate is locked, the creator configured the track to start muted
  // (initial state only), or the viewer paused or muted it. Once the viewer
  // explicitly engages the controls (bgUserEngaged), Play overrides the
  // creator's start-muted initial state.
  useEffect(() => {
    const audio = backgroundMusicRef.current;
    if (!audio) return;
    const shouldPlay =
      hasStarted &&
      backgroundMusicUrl &&
      !bgMusicPaused &&
      !bgMusicMuted &&
      !gateLocked &&
      (bgUserEngaged || !backgroundAudio?.muted);
    if (shouldPlay) {
      void audio.play().catch(() => {
        // Native media policy may require the viewer to press Play again.
        setBgMusicPaused(true);
      });
    } else {
      audio.pause();
    }
  }, [
    hasStarted,
    backgroundMusicUrl,
    bgMusicPaused,
    bgMusicMuted,
    gateLocked,
    bgUserEngaged,
    backgroundAudio?.muted
  ]);

  // A narration element unmounts when the viewer navigates; reset the ducking
  // signal so stale playing state never keeps the music quiet on the next step.
  useEffect(() => {
    setVoiceoverPlaying(false);
  }, [currentIndex, activeChapterId]);

  const backgroundMusicPlaying = Boolean(
    hasStarted &&
    backgroundMusicUrl &&
    !bgMusicPaused &&
    !bgMusicMuted &&
    !gateLocked &&
    (bgUserEngaged || !backgroundAudio?.muted)
  );

  const toggleBackgroundMusic = (): void => {
    // Clicking the control is itself a user gesture that may unlock playback,
    // and explicit Play overrides the creator's start-muted initial state.
    emitStarted();
    setBgUserEngaged(true);
    setBgMusicMuted(false);
    // `bgMusicPaused` is also used as the opt-in auto-start flag, so a fresh
    // viewer has it set to false even though audio cannot play until a gesture.
    // Derive the toggle from actual playback state instead of blindly flipping
    // the flag; otherwise the first click on a fresh or start-muted track would
    // incorrectly leave it paused.
    setBgMusicPaused(backgroundMusicPlaying);
  };

  const toggleBackgroundMusicMute = (): void => {
    emitStarted();
    setBgUserEngaged(true);
    setBgMusicMuted((muted) => !muted);
  };
  // Chapter visual customization. Form chapters keep using their own form
  // appearance fields (the existing viewer form rendering); all other chapter
  // types use the chapter-level layout/theme/color/opacity/blur fields.
  const chapterVisual = {
    layout: currentForm ? currentForm.layout : (currentChapter?.layout ?? "center"),
    theme: currentForm ? currentForm.theme : (currentChapter?.theme ?? "light"),
    backgroundColor: currentForm
      ? currentForm.backgroundColor
      : (currentChapter?.backgroundColor ?? null),
    opacity: currentForm ? currentForm.opacity : (currentChapter?.opacity ?? 1),
    blurPx: currentForm ? currentForm.blurPx : (currentChapter?.blurPx ?? 0)
  };
  const chapterBackgroundImageUrl = currentForm?.backgroundImageUrl
    ? safeMediaUrl(currentForm.backgroundImageUrl)
    : null;
  // The backdrop layer is only needed when the default light/full-opacity look
  // is customized, so default chapters keep rendering exactly as before.
  const chapterBackdropActive =
    !currentForm &&
    (chapterVisual.theme !== "light" ||
      chapterVisual.backgroundColor !== null ||
      chapterVisual.opacity < 1 ||
      chapterVisual.blurPx > 0);
  const mediaUrl = step?.media ? safeMediaUrl(step.media.storagePath) : null;
  const mediaCrop = step?.media?.crop;
  const mediaFit = step?.media?.fit;
  const narrationUrl = step?.audioNarration?.audioUrl
    ? safeMediaUrl(step.audioNarration.audioUrl)
    : null;

  useEffect(() => {
    setFormAnswers({});
    setFormErrors({});
    setFormSubmitted(false);
  }, [activeChapterId]);

  useEffect(() => {
    previousVideoTimeRef.current = 0;
    videoSeekingRef.current = false;
    pauseJumpVideoRef.current = false;
    triggeredVideoPauseIdsRef.current.clear();
    setVideoCurrentTime(0);
    setVideoDuration(step?.media?.durationSeconds ?? 0);
    setVideoPlaying(false);
    setActiveVideoPauseIds([]);
  }, [step?.id, step?.media?.durationSeconds]);

  const stepHotspots = step?.hotspots ?? [];
  const visibleHotspots = stepHotspots.filter((hotspot) =>
    isDemoHotspotVisibleAtTime(hotspot, videoCurrentTime, new Set(activeVideoPauseIds))
  );

  const handleViewerVideoTimeUpdate = (video: HTMLVideoElement): void => {
    const nextTime = video.currentTime;
    if (videoSeekingRef.current) {
      previousVideoTimeRef.current = nextTime;
      setVideoCurrentTime(nextTime);
      return;
    }
    const crossed = findCrossedPauseHotspots(
      stepHotspots,
      previousVideoTimeRef.current,
      nextTime,
      triggeredVideoPauseIdsRef.current
    );
    if (crossed.length > 0) {
      const pauseAt = crossed[0]?.timing?.startSeconds ?? nextTime;
      for (const hotspot of crossed) triggeredVideoPauseIdsRef.current.add(hotspot.id);
      // The programmatic jump must not re-arm the cue via onSeeked. The crossed
      // cue is already in the triggered set, so re-entrant time updates are safe
      // without marking the video as seeking (which could get stuck on a no-op
      // seek and suppress every later cue).
      pauseJumpVideoRef.current = true;
      video.currentTime = pauseAt;
      video.pause();
      previousVideoTimeRef.current = pauseAt;
      setVideoCurrentTime(pauseAt);
      setActiveVideoPauseIds(crossed.map((hotspot) => hotspot.id));
      return;
    }
    previousVideoTimeRef.current = nextTime;
    setVideoCurrentTime(nextTime);
  };

  const seekViewerVideo = (nextTime: number): void => {
    const video = viewerVideoRef.current;
    if (!video) return;
    const bounded = Math.max(0, Math.min(videoDuration || video.duration || 0, nextTime));
    const changed = Math.abs(video.currentTime - bounded) > 0.001;
    videoSeekingRef.current = changed;
    pauseJumpVideoRef.current = false;
    if (changed) video.currentTime = bounded;
    previousVideoTimeRef.current = bounded;
    triggeredVideoPauseIdsRef.current = new Set(pauseHotspotIdsBeforeTime(stepHotspots, bounded));
    setActiveVideoPauseIds([]);
    setVideoCurrentTime(bounded);
  };

  const resumeViewerVideo = (): void => {
    const video = viewerVideoRef.current;
    if (!video) return;
    setActiveVideoPauseIds([]);
    previousVideoTimeRef.current = video.currentTime;
    void video.play().catch(() => {
      // Native browser media policy may require the viewer to press Play again.
    });
  };

  const toggleViewerVideo = (): void => {
    const video = viewerVideoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    resumeViewerVideo();
  };
  const progress = useMemo(
    () =>
      demoDocument.steps.length === 0
        ? 0
        : Math.min(100, Math.round(((currentIndex + 1) / demoDocument.steps.length) * 100)),
    [currentIndex, demoDocument.steps.length]
  );

  const goToStep = (nextIndex: number): void => {
    if (demoDocument.steps.length === 0) return;
    const bounded = Math.max(0, Math.min(demoDocument.steps.length - 1, nextIndex));
    const nextStep = demoDocument.steps[bounded];
    if (!nextStep) return;
    emitStarted();
    setCurrentIndex(bounded);
    setActiveChapterId(chapterAtPosition(demoDocument, bounded)?.id ?? null);
    try {
      const nextUrl = new URL(globalThis.location.href);
      nextUrl.searchParams.set("step", String(bounded + 1));
      globalThis.history.replaceState({}, "", nextUrl.toString());
    } catch {
      // Deep-link URL state is best effort and never blocks playback.
    }
    const totalSlides = demoDocument.steps.length;
    const currentSlide = bounded + 1;
    postEmbeddedEvent(embedded, "Supademo:slideChange", {
      demoId,
      currentSlide,
      totalSlides
    });
    postEmbeddedEvent(embedded, "Supademo:progress", {
      demoId,
      percentage: Math.round((currentSlide / totalSlides) * 100),
      currentSlide,
      totalSlides
    });
    recordViewerEvent(demoId, nextStep.id);
  };

  const continueFromChapter = (): void => {
    emitStarted();
    if (currentIndex >= demoDocument.steps.length) {
      goToStep(0);
      return;
    }
    setActiveChapterId(null);
    const currentStep = demoDocument.steps[currentIndex];
    if (currentStep) recordViewerEvent(demoId, currentStep.id);
  };

  const goNext = (): void => {
    emitStarted();
    if (currentChapter) {
      continueFromChapter();
      return;
    }
    if (!step) return;
    const last = currentIndex >= demoDocument.steps.length - 1;
    if (last && chapterAtPosition(demoDocument, demoDocument.steps.length)) {
      setCurrentIndex(demoDocument.steps.length);
      setActiveChapterId(chapterAtPosition(demoDocument, demoDocument.steps.length)?.id ?? null);
      return;
    }
    if (last) {
      postEmbeddedEvent(embedded, "Supademo:completed", {
        demoId,
        title: demoId,
        completedAt: new Date().toISOString()
      });
    }
    goToStep(last ? 0 : currentIndex + 1);
  };

  const handleChapterButton = (button: DemoChapter["buttons"][number]): void => {
    emitStarted();
    if (button.actionType === "url") {
      const safeUrl = validateSafeUrl(button.url);
      if (safeUrl) globalThis.location.assign(safeUrl);
      return;
    }
    if (button.actionType === "step" && button.targetStepId) {
      const targetIndex = demoDocument.steps.findIndex(
        (candidate) => candidate.id === button.targetStepId
      );
      if (targetIndex >= 0) {
        goToStep(targetIndex);
        return;
      }
    }
    continueFromChapter();
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    emitStarted();
    if (!currentForm) return;
    const result = validateFormSubmission(currentForm, {
      formId: currentForm.formId,
      answers: formAnswers
    });
    const nextErrors = Object.fromEntries(
      result.errors.map((error) => [error.fieldId, error.message])
    );
    setFormErrors(nextErrors);
    if (!result.isValid) return;
    recordFormSubmission(demoId, currentForm, formAnswers);
    setFormSubmitted(true);
  };

  const handleGateSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!gate || gateBusy) return;
    const candidate = gatePasswordDraft.slice(0, 128);
    if (!candidate.trim()) {
      setGateError("Enter the password to continue.");
      return;
    }
    setGateBusy(true);
    try {
      const matches = await verifyChapterPassword(candidate, gate.passwordHash);
      if (matches && currentChapter) {
        setUnlockedChapterIds((current) => new Set([...current, currentChapter.id]));
        setGatePasswordDraft("");
        setGateError(null);
        emitStarted();
      } else {
        setGateError("Incorrect password. Please try again.");
      }
    } catch {
      // Fails closed: hashing is unavailable, so the chapter stays locked.
      setGateError("This chapter is temporarily unavailable.");
    } finally {
      setGateBusy(false);
    }
  };

  const goHotspot = (hotspot: DemoHotspot): void => {
    emitStarted();
    if (hotspot.actionType === "none") {
      if (hotspot.timing?.kind === "pause") resumeViewerVideo();
      return;
    }
    if (hotspot.actionType === "open_url") {
      const safeUrl = validateSafeUrl(hotspot.url);
      if (safeUrl) {
        globalThis.location.assign(safeUrl);
        return;
      }
    }
    if (!hotspot.targetStepId) {
      goNext();
      return;
    }
    const targetIndex = demoDocument.steps.findIndex(
      (candidate) => candidate.id === hotspot.targetStepId
    );
    goToStep(targetIndex >= 0 ? targetIndex : currentIndex + 1);
  };

  return (
    <main
      className={`demo-viewer-shell${embedded ? " is-embedded" : ""}${step?.disableViewerScroll ? " is-scroll-locked" : ""}`}
      onClick={emitStarted}
      style={{
        backgroundColor: viewerTheme.backgroundColor,
        backgroundImage: viewerBackgroundImage === "none" ? undefined : viewerBackgroundImage,
        backgroundSize: customBackgroundImage ? "cover" : undefined,
        backgroundPosition: customBackgroundImage ? "center" : undefined
      }}
    >
      {!embedded ? (
        <header className="demo-viewer-topbar">
          <a className="demo-viewer-brand" href="/demos">
            <span aria-hidden="true">S</span> Supademo
          </a>
          <span className="demo-viewer-mode">Viewer preview</span>
          {demoDocument.translations.length > 0 ? (
            <div className="demo-viewer-language">
              <button
                type="button"
                className="demo-viewer-language-trigger"
                aria-expanded={languageMenuOpen}
                aria-haspopup="listbox"
                onClick={() => setLanguageMenuOpen((open) => !open)}
              >
                Translate
                {selectedLocale !== "en-US"
                  ? ` · ${translationLabelForLocale(selectedLocale)}`
                  : ""}
              </button>
              {languageMenuOpen ? (
                <div className="demo-viewer-language-menu" role="listbox" aria-label="Languages">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedLocale === "en-US"}
                    onClick={() => selectLocale("en-US")}
                  >
                    Original (English)
                  </button>
                  {demoDocument.translations.map((translation) => (
                    <button
                      key={translation.locale}
                      type="button"
                      role="option"
                      aria-selected={selectedLocale === translation.locale}
                      onClick={() => selectLocale(translation.locale)}
                    >
                      {translationLabelForLocale(translation.locale)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <a
            className="demo-viewer-exit"
            href={`/demos/${encodeURIComponent(demoId)}/edit${
              localCaptureId ? `?localCapture=${encodeURIComponent(localCaptureId)}` : ""
            }`}
          >
            Back to editor
          </a>
        </header>
      ) : null}

      {!loadedFromStorage ? (
        <div className="demo-viewer-empty" role="status">
          Loading demo…
        </div>
      ) : localCaptureError ? (
        <div className="demo-viewer-empty" role="alert">
          {localCaptureError}
        </div>
      ) : shareAccessError ? (
        <div className="demo-viewer-empty" role="alert">
          <strong>{shareAccessError}</strong>
          <p>Ask the sender for a new share link.</p>
        </div>
      ) : !step && !currentChapter ? (
        <div className="demo-viewer-empty">
          <strong>This demo has no published screens yet.</strong>
          <p>Return to the editor, add a capture, and publish it before sharing the viewer link.</p>
          <a
            className="editor-button editor-button-primary"
            href={`/demos/${encodeURIComponent(demoId)}/edit`}
          >
            Return to editor
          </a>
        </div>
      ) : (
        <div className="demo-viewer-layout">
          <aside className="demo-viewer-steps" aria-label="Viewer steps">
            <span className="editor-kicker">Interactive demo</span>
            <strong>{demoDocument.steps.length} screens</strong>
            <div className="demo-viewer-progress" aria-label={`${progress}% complete`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            {demoDocument.settings.showStepList
              ? demoDocument.steps.map((candidate, index) => (
                  <button
                    key={candidate.id}
                    type="button"
                    className={index === currentIndex ? "is-active" : ""}
                    onClick={() => goToStep(index)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>
                      {renderText(
                        candidate.title,
                        translationContentKey("step", candidate.id, "title")
                      )}
                    </strong>
                  </button>
                ))
              : null}
          </aside>
          <section className="demo-viewer-stage" aria-label="Demo viewer">
            {currentChapter ? (
              <div
                className={`demo-viewer-chapter${currentForm ? " demo-viewer-form-chapter" : ""}${chapterBackdropActive ? " demo-viewer-chapter-backdrop" : ""}${currentForm && currentForm.blurPx > 0 ? " demo-viewer-form-chapter-blur" : ""}`}
                aria-label={`${currentChapter.type} chapter`}
                data-form-layout={currentForm?.layout}
                data-form-theme={currentForm?.theme}
                data-chapter-layout={currentForm ? undefined : chapterVisual.layout}
                data-chapter-theme={currentForm ? undefined : chapterVisual.theme}
                style={
                  currentForm
                    ? {
                        backgroundColor: currentForm.backgroundColor ?? undefined,
                        opacity: currentForm.opacity,
                        backgroundImage: chapterBackgroundImageUrl
                          ? `url(${chapterBackgroundImageUrl})`
                          : undefined,
                        ...(currentForm.blurPx > 0
                          ? { ["--form-blur" as string]: `${currentForm.blurPx}px` }
                          : {})
                      }
                    : chapterBackdropActive
                      ? {
                          ["--chapter-blur" as string]: `${chapterVisual.blurPx}px`,
                          ["--chapter-opacity" as string]: String(chapterVisual.opacity),
                          ["--chapter-color" as string]: chapterVisual.backgroundColor ?? "#ffffff"
                        }
                      : undefined
                }
              >
                {gateLocked && gate ? (
                  <form
                    className="demo-viewer-password-gate"
                    aria-label="Password protected chapter"
                    style={{
                      backgroundColor: gate.backgroundColor ?? undefined,
                      color: gate.textColor ?? undefined
                    }}
                    onSubmit={(event) => void handleGateSubmit(event)}
                  >
                    <span className="demo-viewer-chapter-badge">Locked</span>
                    <h2>This chapter is password protected</h2>
                    <label className="demo-viewer-form-field">
                      <span>Password</span>
                      <input
                        type="password"
                        autoComplete="off"
                        maxLength={128}
                        value={gatePasswordDraft}
                        disabled={gateBusy}
                        aria-invalid={Boolean(gateError)}
                        onChange={(event) => {
                          setGatePasswordDraft(event.currentTarget.value.slice(0, 128));
                          if (gateError) setGateError(null);
                        }}
                      />
                    </label>
                    {gateError ? (
                      <p className="demo-viewer-form-error" role="alert">
                        {gateError}
                      </p>
                    ) : null}
                    <div className="demo-viewer-chapter-actions">
                      <button
                        type="submit"
                        className="editor-button editor-button-primary"
                        disabled={gateBusy || !gatePasswordDraft.trim()}
                      >
                        {gate.buttonText}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {chapterMediaUrl ? (
                      <img className="demo-viewer-chapter-media" src={chapterMediaUrl} alt="" />
                    ) : null}
                    <span className="demo-viewer-chapter-badge">{currentChapter.type}</span>
                    <h1>
                      {renderText(
                        currentForm?.title || currentChapter.title,
                        translationContentKey(
                          "chapter",
                          currentChapter.id,
                          currentForm ? "form-title" : "title"
                        )
                      )}
                    </h1>
                    {currentChapter.bodyText ? (
                      <p>
                        {renderText(
                          currentChapter.bodyText,
                          translationContentKey("chapter", currentChapter.id, "body")
                        )}
                      </p>
                    ) : null}
                    {chapterEmbedUrl ? (
                      <div className="demo-viewer-chapter-embed-wrap">
                        <iframe
                          className="demo-viewer-chapter-embed"
                          title={`Embed for ${renderText(
                            currentChapter.title,
                            translationContentKey("chapter", currentChapter.id, "title")
                          )}`}
                          src={chapterEmbedUrl}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          sandbox="allow-scripts allow-forms"
                        />
                      </div>
                    ) : currentChapter.type === "embed" ? (
                      <p className="demo-viewer-embed-unavailable" role="status">
                        This embed is not available right now.
                      </p>
                    ) : null}
                    {currentForm ? (
                      formSubmitted ? (
                        <div className="demo-viewer-form-success" role="status">
                          <strong>Thanks — you're all set.</strong>
                          <p>Your response was saved with this demo.</p>
                          <div className="demo-viewer-chapter-actions">
                            {currentChapter.buttons.length > 0 ? (
                              currentChapter.buttons.map((button) => (
                                <button
                                  key={button.id}
                                  type="button"
                                  className="editor-button editor-button-primary"
                                  onClick={() => handleChapterButton(button)}
                                >
                                  {renderText(
                                    button.label,
                                    translationContentKey(
                                      "chapter",
                                      currentChapter.id,
                                      "button",
                                      button.id
                                    )
                                  )}
                                </button>
                              ))
                            ) : (
                              <button
                                type="button"
                                className="editor-button editor-button-primary"
                                onClick={continueFromChapter}
                              >
                                Continue
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <form className="demo-viewer-form" onSubmit={handleFormSubmit} noValidate>
                          {formErrors._form ? (
                            <p className="demo-viewer-form-error" role="alert">
                              {formErrors._form}
                            </p>
                          ) : null}
                          {currentForm.fields.map((field) => {
                            const inputId = `viewer-form-${currentForm.formId}-${field.id}`;
                            const errorId = `${inputId}-error`;
                            const fieldError = formErrors[field.id];
                            const describedBy = fieldError ? errorId : undefined;
                            if (["select", "radio"].includes(field.fieldType)) {
                              return field.fieldType === "select" ? (
                                <label className="demo-viewer-form-field" key={field.id}>
                                  <span>
                                    {renderText(
                                      field.label,
                                      translationContentKey(
                                        "chapter",
                                        currentChapter.id,
                                        "field",
                                        field.id
                                      )
                                    )}
                                    {field.isRequired ? " *" : ""}
                                  </span>
                                  <select
                                    id={inputId}
                                    name={field.id}
                                    value={formAnswers[field.id] ?? ""}
                                    required={field.isRequired}
                                    aria-invalid={Boolean(fieldError)}
                                    aria-describedby={describedBy}
                                    onChange={(event) => {
                                      const value = event.currentTarget.value;
                                      setFormAnswers((current) => ({
                                        ...current,
                                        [field.id]: value
                                      }));
                                    }}
                                  >
                                    <option value="">Choose an option</option>
                                    {field.options.map((option) => (
                                      <option key={option} value={option}>
                                        {renderText(
                                          option,
                                          translationContentKey(
                                            "chapter",
                                            currentChapter.id,
                                            `option-${field.id}`,
                                            option
                                          )
                                        )}
                                      </option>
                                    ))}
                                  </select>
                                  {fieldError ? (
                                    <small id={errorId} className="demo-viewer-form-error">
                                      {fieldError}
                                    </small>
                                  ) : null}
                                </label>
                              ) : (
                                <fieldset className="demo-viewer-form-field" key={field.id}>
                                  <legend>
                                    {renderText(
                                      field.label,
                                      translationContentKey(
                                        "chapter",
                                        currentChapter.id,
                                        "field",
                                        field.id
                                      )
                                    )}
                                    {field.isRequired ? " *" : ""}
                                  </legend>
                                  {field.options.map((option) => (
                                    <label className="demo-viewer-form-option" key={option}>
                                      <input
                                        type="radio"
                                        name={field.id}
                                        value={option}
                                        checked={formAnswers[field.id] === option}
                                        onChange={(event) => {
                                          const value = event.currentTarget.value;
                                          setFormAnswers((current) => ({
                                            ...current,
                                            [field.id]: value
                                          }));
                                        }}
                                      />
                                      <span>
                                        {renderText(
                                          option,
                                          translationContentKey(
                                            "chapter",
                                            currentChapter.id,
                                            `option-${field.id}`,
                                            option
                                          )
                                        )}
                                      </span>
                                    </label>
                                  ))}
                                  {fieldError ? (
                                    <small id={errorId} className="demo-viewer-form-error">
                                      {fieldError}
                                    </small>
                                  ) : null}
                                </fieldset>
                              );
                            }
                            if (field.fieldType === "checkbox") {
                              return (
                                <label className="demo-viewer-form-option" key={field.id}>
                                  <input
                                    id={inputId}
                                    type="checkbox"
                                    name={field.id}
                                    checked={formAnswers[field.id] === "true"}
                                    onChange={(event) => {
                                      const value = event.currentTarget.checked ? "true" : "false";
                                      setFormAnswers((current) => ({
                                        ...current,
                                        [field.id]: value
                                      }));
                                    }}
                                  />
                                  <span>
                                    {renderText(
                                      field.label,
                                      translationContentKey(
                                        "chapter",
                                        currentChapter.id,
                                        "field",
                                        field.id
                                      )
                                    )}
                                    {field.isRequired ? " *" : ""}
                                  </span>
                                  {fieldError ? (
                                    <small id={errorId} className="demo-viewer-form-error">
                                      {fieldError}
                                    </small>
                                  ) : null}
                                </label>
                              );
                            }
                            return (
                              <label className="demo-viewer-form-field" key={field.id}>
                                <span>
                                  {renderText(
                                    field.label,
                                    translationContentKey(
                                      "chapter",
                                      currentChapter.id,
                                      "field",
                                      field.id
                                    )
                                  )}
                                  {field.isRequired ? " *" : ""}
                                </span>
                                <input
                                  id={inputId}
                                  type={field.fieldType === "email" ? "email" : "text"}
                                  name={field.id}
                                  value={formAnswers[field.id] ?? ""}
                                  maxLength={2_000}
                                  required={field.isRequired}
                                  aria-invalid={Boolean(fieldError)}
                                  aria-describedby={describedBy}
                                  onChange={(event) => {
                                    const value = event.currentTarget.value.slice(0, 2_000);
                                    setFormAnswers((current) => ({
                                      ...current,
                                      [field.id]: value
                                    }));
                                  }}
                                />
                                {fieldError ? (
                                  <small id={errorId} className="demo-viewer-form-error">
                                    {fieldError}
                                  </small>
                                ) : null}
                              </label>
                            );
                          })}
                          <div className="demo-viewer-chapter-actions">
                            <button type="submit" className="editor-button editor-button-primary">
                              Submit
                            </button>
                            {currentForm.allowSkip ? (
                              <button
                                type="button"
                                className="editor-button editor-button-secondary"
                                onClick={continueFromChapter}
                              >
                                Skip for now
                              </button>
                            ) : null}
                          </div>
                        </form>
                      )
                    ) : (
                      <div className="demo-viewer-chapter-actions">
                        {currentChapter.buttons.length > 0 ? (
                          currentChapter.buttons.map((button) => (
                            <button
                              key={button.id}
                              type="button"
                              className="editor-button editor-button-primary"
                              onClick={() => handleChapterButton(button)}
                            >
                              {renderText(
                                button.label,
                                translationContentKey(
                                  "chapter",
                                  currentChapter.id,
                                  "button",
                                  button.id
                                )
                              )}
                            </button>
                          ))
                        ) : (
                          <button
                            type="button"
                            className="editor-button editor-button-primary"
                            onClick={continueFromChapter}
                          >
                            Continue
                          </button>
                        )}
                      </div>
                    )}
                    {currentChapter.voiceover ? (
                      <section
                        className="demo-viewer-chapter-voiceover"
                        aria-label="Chapter voiceover"
                      >
                        <div>
                          <span className="editor-kicker">Voiceover</span>
                          <strong>
                            {currentChapter.voiceover.source === "ai"
                              ? "AI narration"
                              : "Chapter narration"}
                          </strong>
                        </div>
                        {chapterNarrationUrl ? (
                          <audio
                            ref={chapterVoiceoverRef}
                            src={chapterNarrationUrl}
                            controls
                            autoPlay={hasStarted && Boolean(currentChapter.voiceover.autoPlay)}
                            preload="metadata"
                            onPlay={() => setVoiceoverPlaying(true)}
                            onPause={() => setVoiceoverPlaying(false)}
                            aria-label={`Voiceover for ${renderText(
                              currentChapter.title,
                              translationContentKey("chapter", currentChapter.id, "title")
                            )}`}
                          />
                        ) : null}
                        {currentChapter.voiceover.transcriptText ? (
                          <p>
                            {renderText(
                              currentChapter.voiceover.transcriptText,
                              translationContentKey("chapter", currentChapter.id, "voice")
                            )}
                          </p>
                        ) : null}
                      </section>
                    ) : null}
                  </>
                )}
                <small>
                  {currentIndex >= demoDocument.steps.length
                    ? "End of demo"
                    : `Before step ${currentIndex + 1}`}
                </small>
              </div>
            ) : step ? (
              <>
                {step.audioNarration ? (
                  <section className="demo-viewer-voiceover" aria-label="Step voiceover">
                    <div>
                      <span className="editor-kicker">Voiceover</span>
                      <strong>
                        {step.audioNarration.source === "ai" ? "AI narration" : "Manual narration"}
                      </strong>
                    </div>
                    {narrationUrl ? (
                      <audio
                        src={narrationUrl}
                        controls
                        autoPlay={Boolean(step.audioNarration.autoPlay)}
                        preload="metadata"
                        onPlay={() => setVoiceoverPlaying(true)}
                        onPause={() => setVoiceoverPlaying(false)}
                        aria-label={`Voiceover for ${renderText(step.title, translationContentKey("step", step.id, "title"))}`}
                      />
                    ) : null}
                    {step.audioNarration.transcriptText ? (
                      <p>
                        {renderText(
                          step.audioNarration.transcriptText,
                          translationContentKey("step", step.id, "voice")
                        )}
                      </p>
                    ) : null}
                  </section>
                ) : null}
                <div className="demo-viewer-frame">
                  {mediaUrl && step.media?.assetType === "video" ? (
                    <video
                      ref={viewerVideoRef}
                      src={mediaUrl}
                      playsInline
                      onLoadedMetadata={(event) => {
                        const duration = event.currentTarget.duration;
                        if (Number.isFinite(duration)) setVideoDuration(duration);
                      }}
                      onTimeUpdate={(event) => handleViewerVideoTimeUpdate(event.currentTarget)}
                      onSeeking={() => {
                        videoSeekingRef.current = true;
                      }}
                      onSeeked={(event) => {
                        const nextTime = event.currentTarget.currentTime;
                        videoSeekingRef.current = false;
                        previousVideoTimeRef.current = nextTime;
                        if (pauseJumpVideoRef.current) {
                          // Programmatic jump to a pause cue must not re-arm the cue;
                          // only a real viewer seek re-arms cues at/after the seek point.
                          pauseJumpVideoRef.current = false;
                        } else {
                          triggeredVideoPauseIdsRef.current = new Set(
                            pauseHotspotIdsBeforeTime(stepHotspots, nextTime)
                          );
                        }
                        setActiveVideoPauseIds([]);
                        setVideoCurrentTime(nextTime);
                      }}
                      onPlay={() => {
                        setVideoPlaying(true);
                        setActiveVideoPauseIds([]);
                      }}
                      onPause={() => setVideoPlaying(false)}
                      onEnded={() => {
                        setVideoPlaying(false);
                        setActiveVideoPauseIds([]);
                        pauseJumpVideoRef.current = false;
                        triggeredVideoPauseIdsRef.current.clear();
                      }}
                      style={croppedMediaStyle(mediaCrop, mediaFit ?? "cover")}
                      aria-label={renderText(
                        step.title,
                        translationContentKey("step", step.id, "title")
                      )}
                    />
                  ) : mediaUrl ? (
                    <img
                      src={mediaUrl}
                      alt={renderText(step.title, translationContentKey("step", step.id, "title"))}
                      style={croppedMediaStyle(mediaCrop, mediaFit ?? "cover")}
                    />
                  ) : (
                    <div className="demo-viewer-placeholder">
                      <span aria-hidden="true">▦</span>
                      <strong>
                        {renderText(step.title, translationContentKey("step", step.id, "title"))}
                      </strong>
                      {step.description ? (
                        <p>{renderText(step.description)}</p>
                      ) : (
                        <small>Media is available after the capture is uploaded.</small>
                      )}
                    </div>
                  )}
                  {step.media?.assetType === "video" && demoDocument.settings.showControls ? (
                    <div className="demo-viewer-video-controls" aria-label="Video controls">
                      <button type="button" onClick={toggleViewerVideo}>
                        {activeVideoPauseIds.length
                          ? "Resume video"
                          : videoPlaying
                            ? "Pause"
                            : "Play"}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max={videoDuration || 1}
                        step="0.01"
                        value={Math.min(videoCurrentTime, videoDuration || 1)}
                        onChange={(event) => seekViewerVideo(Number(event.currentTarget.value))}
                        aria-label="Video timeline"
                      />
                      <span>
                        {videoCurrentTime.toFixed(1)} / {videoDuration.toFixed(1)}s
                      </span>
                    </div>
                  ) : null}
                  {activeVideoPauseIds.length ? (
                    <p className="demo-viewer-video-status" role="status" aria-live="assertive">
                      Video paused for an interactive hotspot.
                    </p>
                  ) : null}
                  {visibleHotspots.map((hotspot) => {
                    const label = renderText(
                      hotspot.tooltipText ?? "Continue",
                      translationContentKey("step", step.id, "hotspot", hotspot.id)
                    );
                    const style = {
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      width: `${hotspot.width}%`,
                      height: `${hotspot.height}%`,
                      backgroundColor: hotspot.style.color,
                      opacity: Math.max(0.2, Math.min(1, hotspot.style.opacity))
                    };
                    if (hotspot.actionType === "none" && hotspot.timing?.kind !== "pause") {
                      return (
                        <div
                          key={hotspot.id}
                          className="demo-viewer-hotspot"
                          style={style}
                          role="note"
                          aria-label={label}
                        >
                          {label}
                        </div>
                      );
                    }
                    return (
                      <button
                        key={hotspot.id}
                        type="button"
                        className="demo-viewer-hotspot"
                        style={style}
                        onClick={() => goHotspot(hotspot)}
                        aria-label={label}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
            <div className="demo-viewer-controls">
              <button
                type="button"
                className="editor-button editor-button-secondary"
                onClick={() => goToStep(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                Previous
              </button>
              <span aria-live="polite">
                {currentChapter
                  ? currentIndex >= demoDocument.steps.length
                    ? "End chapter"
                    : `Chapter before step ${currentIndex + 1}`
                  : `Step ${currentIndex + 1} of ${demoDocument.steps.length}`}
              </span>
              <button
                type="button"
                className="editor-button editor-button-primary"
                onClick={goNext}
              >
                {currentChapter
                  ? "Continue"
                  : currentIndex === demoDocument.steps.length - 1
                    ? chapterAtPosition(demoDocument, demoDocument.steps.length)
                      ? "Finish"
                      : "Restart"
                    : "Next step"}
              </button>
            </div>
          </section>
          {backgroundAudio && backgroundMusicUrl ? (
            <section
              className={`demo-viewer-background-music${gateLocked ? " is-gate-locked" : ""}`}
              aria-label="Background music"
            >
              <audio
                ref={backgroundMusicRef}
                src={backgroundMusicUrl}
                loop={backgroundAudio.loop}
                preload="none"
                onEnded={() => setBgMusicPaused(true)}
                onError={() => setBgMusicPaused(true)}
              />
              <span className="demo-viewer-music-note" aria-hidden="true">
                ♪
              </span>
              <div>
                <span className="editor-kicker">Background music</span>
                <strong>{backgroundAudio.title ?? "Demo music"}</strong>
              </div>
              <button
                type="button"
                onClick={toggleBackgroundMusic}
                disabled={gateLocked}
                aria-pressed={backgroundMusicPlaying}
              >
                {gateLocked ? "Unavailable" : backgroundMusicPlaying ? "Pause music" : "Play music"}
              </button>
              <button
                type="button"
                onClick={toggleBackgroundMusicMute}
                disabled={gateLocked}
                aria-pressed={bgMusicMuted}
              >
                {bgMusicMuted ? "Unmute music" : "Mute music"}
              </button>
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}
