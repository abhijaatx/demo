"use client";

import {
  deleteSteps,
  duplicateStep,
  executeAiTranslationJob,
  extractTemplateVariableNames,
  buildShareLinkUrl,
  calculateShareLinkExpiry,
  generateAiVoiceover,
  generateBranchingDiagnosticSummary,
  generateIframeSnippet,
  generatePopupEmbedSnippet,
  generateSopHtmlExport,
  generateSopMarkdownExport,
  generateSopTextExport,
  generatePersonalizedEmbedUrl,
  getAvailableTtsVoices,
  nudgeHotspot,
  parseDemoAudioNarration,
  parseDemoFormSchema,
  parseDemoPersonalization,
  publishDemoDocument,
  parseDemoDocument,
  proposeTextRewrite,
  reorderSteps,
  resizeHotspot,
  SHARE_LINK_EXPIRY_OPTIONS,
  sanitizeShareLabel,
  SUPPORTED_TRANSLATION_LOCALES,
  translationContentKey,
  translationLabelForLocale,
  validateSafeUrl,
  type DemoDocument,
  type DemoAudioNarration,
  type DemoPersonalization,
  type DemoTheme,
  type DemoTranslationDictionary,
  type RewriteTone,
  type TextRewriteProposal,
  type DemoStep,
  type DemoHotspot,
  type PublishedDemoManifest,
  type ShareLinkExpiryPreset
} from "@supademo/domain";
import { Modal } from "@supademo/ui";
import type { ChangeEvent, KeyboardEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
  createDemoPng,
  createDemoVideo,
  downloadBlob,
  type ExportResolution,
  type VideoExportFormat
} from "../src/lib/export-client";
import {
  createOfflineZip,
  readOfflineDownloads,
  saveOfflineDownload
} from "../src/lib/offline-export";
import { ChapterEditor } from "./editor/chapter-editor";

export type CaptureMode =
  "guided" | "html" | "sandbox" | "screenshot" | "video" | "upload" | "figma";

const captureModeCopy: Record<CaptureMode, { title: string; description: string }> = {
  guided: {
    title: "Guided demo capture",
    description:
      "Add screens from a focused workflow, then place hotspots on the moments that matter."
  },
  html: {
    title: "Guided HTML capture",
    description:
      "Use the browser recorder for clickable web states, or import a screen to start the storyboard."
  },
  sandbox: {
    title: "Sandbox demo capture",
    description:
      "Start with a screen or video, then turn the story into an explorable product path."
  },
  screenshot: {
    title: "Screenshot capture",
    description: "Import a crisp image and add focused annotations or hotspots."
  },
  video: {
    title: "Video capture",
    description: "Import a short walkthrough video and keep the surrounding story in one editor."
  },
  upload: {
    title: "Upload media",
    description:
      "Bring in screenshots or video you already recorded. Files stay local until you save them."
  },
  figma: {
    title: "Figma prototype import",
    description: "Arrange imported frames, add hotspots, and prepare the prototype for sharing."
  }
};

function normalizeStepOrder(steps: readonly DemoStep[]): readonly DemoStep[] {
  return steps.map((step, index) => ({ ...step, orderIndex: index }));
}

function normalizeChapterOrder(chapters: DemoDocument["chapters"]): DemoDocument["chapters"] {
  return [...chapters]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((chapter) => ({
      ...chapter,
      orderIndex: Math.max(0, Math.floor(chapter.orderIndex))
    }));
}

function clampPercent(value: number, minimum = 0, maximum = 100): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function safeExportDocument(document: DemoDocument): DemoDocument {
  return {
    ...document,
    chapters: document.chapters.map((chapter) => ({
      ...chapter,
      // Presenter notes are authoring-only and must never be published or exported.
      presenterNotes: null,
      mediaUrl: chapter.mediaUrl && isSafeMediaUrl(chapter.mediaUrl) ? chapter.mediaUrl : null,
      form: chapter.form ? parseDemoFormSchema(chapter.form) : null,
      buttons: chapter.buttons.map((button) => {
        const safeUrl = validateSafeUrl(button.url);
        return {
          ...button,
          actionType:
            button.actionType === "url" && safeUrl
              ? "url"
              : button.actionType === "url"
                ? "next"
                : button.actionType,
          targetStepId: button.actionType === "url" && safeUrl ? null : button.targetStepId,
          url: button.actionType === "url" ? safeUrl : null
        };
      })
    })),
    steps: document.steps.map((step) => ({
      ...step,
      audioNarration: step.audioNarration ? parseDemoAudioNarration(step.audioNarration) : null,
      hotspots: step.hotspots.map((hotspot) => {
        if (hotspot.actionType !== "open_url") return hotspot;
        const safeUrl = validateSafeUrl(hotspot.url);
        return {
          ...hotspot,
          actionType: safeUrl ? "open_url" : "next_step",
          targetStepId: safeUrl ? null : hotspot.targetStepId,
          url: safeUrl
        };
      }),
      media:
        step.media && isSafeMediaUrl(step.media.storagePath)
          ? step.media
          : step.media
            ? { ...step.media, storagePath: "" }
            : null
    }))
  };
}

const URL_DESTINATION_OPTION = "__supademo_open_url__";

function isSafeMediaUrl(value: string): boolean {
  if (value.startsWith("blob:")) return true;
  if (
    value.length <= 1_800_000 &&
    /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/u.test(value)
  ) {
    return true;
  }
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeTrackingKey(value: string): string {
  return sanitizeShareLabel(value);
}

type LocalExpiringShareLink = Readonly<{
  token: string;
  expiresAtMs: number;
  trackingLabel: string;
}>;

function createShareToken(): string | null {
  try {
    const uuid = globalThis.crypto?.randomUUID?.();
    return uuid ? `sl_${uuid.replace(/[^a-zA-Z0-9_-]/g, "")}` : null;
  } catch {
    return null;
  }
}

function persistExpiringShareLink(demoId: string, link: LocalExpiringShareLink): boolean {
  try {
    const key = `supademo_share_links_${demoId}`;
    const current = JSON.parse(localStorage.getItem(key) ?? "[]");
    const links = Array.isArray(current) ? current.slice(-49) : [];
    links.push(link);
    localStorage.setItem(key, JSON.stringify(links));
    return true;
  } catch {
    return false;
  }
}

function collectDocumentText(document: DemoDocument): readonly string[] {
  const texts: string[] = [];
  for (const step of document.steps) {
    texts.push(step.title, step.description ?? "");
    for (const hotspot of step.hotspots) texts.push(hotspot.tooltipText ?? "");
    for (const callout of step.callouts) texts.push(callout.title, callout.body);
  }
  for (const chapter of document.chapters) {
    texts.push(chapter.title, chapter.bodyText ?? "");
    for (const button of chapter.buttons) texts.push(button.label);
    if (chapter.form)
      texts.push(chapter.form.title, ...chapter.form.fields.map((field) => field.label));
  }
  return texts;
}

function collectTranslationSourceMap(document: DemoDocument): Readonly<Record<string, string>> {
  const source: Record<string, string> = {};
  const add = (key: string, value: string | null | undefined): void => {
    const bounded = typeof value === "string" ? value.slice(0, 4_000).trim() : "";
    if (bounded) source[key] = bounded;
  };

  for (const step of document.steps) {
    add(translationContentKey("step", step.id, "title"), step.title);
    add(translationContentKey("step", step.id, "description"), step.description);
    add(translationContentKey("step", step.id, "voice"), step.audioNarration?.transcriptText);
    for (const hotspot of step.hotspots) {
      add(translationContentKey("step", step.id, "hotspot", hotspot.id), hotspot.tooltipText);
    }
    for (const callout of step.callouts) {
      add(translationContentKey("step", step.id, "callout-title", callout.id), callout.title);
      add(translationContentKey("step", step.id, "callout-body", callout.id), callout.body);
    }
  }
  for (const chapter of document.chapters) {
    add(translationContentKey("chapter", chapter.id, "title"), chapter.title);
    add(translationContentKey("chapter", chapter.id, "body"), chapter.bodyText);
    if (chapter.form) {
      add(translationContentKey("chapter", chapter.id, "form-title"), chapter.form.title);
      for (const field of chapter.form.fields) {
        add(translationContentKey("chapter", chapter.id, "field", field.id), field.label);
        for (const option of field.options) {
          add(translationContentKey("chapter", chapter.id, `option-${field.id}`, option), option);
        }
      }
    }
    for (const button of chapter.buttons) {
      add(translationContentKey("chapter", chapter.id, "button", button.id), button.label);
    }
  }
  return Object.freeze(source);
}

function PersonalizationSettings({
  personalization,
  readOnly,
  onChange
}: {
  personalization: DemoPersonalization;
  readOnly: boolean;
  onChange: (next: DemoPersonalization) => void;
}) {
  const [allowlistDraft, setAllowlistDraft] = useState(personalization.allowlist.join(", "));

  useEffect(() => {
    setAllowlistDraft(personalization.allowlist.join(", "));
  }, [personalization.allowlist]);

  const commitAllowlist = (): void => {
    const allowlist = allowlistDraft
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 12);
    onChange(parseDemoPersonalization({ ...personalization, allowlist }));
  };

  const updateFallback = (name: string, value: string): void => {
    onChange(
      parseDemoPersonalization({
        ...personalization,
        fallbacks: { ...personalization.fallbacks, [name]: value.slice(0, 160) }
      })
    );
  };

  return (
    <section
      className="editor-personalization-panel"
      aria-labelledby="editor-personalization-title"
    >
      <div className="editor-panel-heading">
        <div>
          <span className="editor-kicker">Personalize</span>
          <strong id="editor-personalization-title">Variables &amp; tokens</strong>
        </div>
      </div>
      <p className="editor-inspector-note">
        Write tokens such as <code>{"{{name}}"}</code> in titles, chapters, hotspots, or buttons.
        Values arrive through <code>v_*</code> share-link parameters.
      </p>
      <label className="editor-checkbox-field">
        <input
          type="checkbox"
          checked={personalization.enabled}
          disabled={readOnly}
          onChange={(event) =>
            onChange(
              parseDemoPersonalization({ ...personalization, enabled: event.currentTarget.checked })
            )
          }
        />
        <span>Enable dynamic variables</span>
      </label>
      <label className="editor-field">
        <span>Allowed variable names</span>
        <input
          type="text"
          value={allowlistDraft}
          disabled={readOnly}
          maxLength={400}
          placeholder="name, company, role"
          onChange={(event) => setAllowlistDraft(event.currentTarget.value.slice(0, 400))}
          onBlur={commitAllowlist}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitAllowlist();
            }
          }}
        />
      </label>
      <div className="editor-personalization-fallbacks">
        <span className="editor-kicker">Fallback text</span>
        {personalization.allowlist.map((name) => (
          <label className="editor-field" key={name}>
            <span>{`{{${name}}}`} fallback</span>
            <input
              type="text"
              value={personalization.fallbacks[name] ?? ""}
              disabled={readOnly}
              maxLength={160}
              placeholder="Shown when the link has no value"
              onChange={(event) => updateFallback(name, event.currentTarget.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}

function BackgroundSettings({
  theme,
  readOnly,
  onChange
}: {
  theme: DemoTheme;
  readOnly: boolean;
  onChange: (theme: DemoTheme) => void;
}) {
  const updateTheme = (patch: Partial<DemoTheme>): void => {
    onChange({ ...theme, ...patch });
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) return;
    if (file.size > 10 * 1024 * 1024) return;
    updateTheme({ backgroundImageUrl: URL.createObjectURL(file) });
  };

  return (
    <section className="editor-background-panel" aria-labelledby="editor-background-title">
      <div className="editor-panel-heading">
        <div>
          <span className="editor-kicker">Personalize</span>
          <strong id="editor-background-title">Backgrounds &amp; frames</strong>
        </div>
      </div>
      <p className="editor-inspector-note">
        Frame the published viewer with a preset, custom color, or an uploaded image.
      </p>
      <label className="editor-field">
        <span>Background style</span>
        <select
          value={theme.backgroundPreset}
          disabled={readOnly}
          onChange={(event) =>
            updateTheme({
              backgroundPreset: event.currentTarget.value as DemoTheme["backgroundPreset"]
            })
          }
        >
          <option value="solid">Solid color</option>
          <option value="aurora">Aurora gradient</option>
          <option value="sunset">Sunset gradient</option>
          <option value="mint">Mint gradient</option>
        </select>
      </label>
      <div className="editor-background-presets" aria-label="Background presets">
        {[
          ["solid", "Solid color"],
          ["aurora", "Aurora gradient"],
          ["sunset", "Sunset gradient"],
          ["mint", "Mint gradient"]
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`editor-background-preset editor-background-preset-${value}${theme.backgroundPreset === value ? " is-active" : ""}`}
            aria-pressed={theme.backgroundPreset === value}
            disabled={readOnly}
            onClick={() =>
              updateTheme({ backgroundPreset: value as DemoTheme["backgroundPreset"] })
            }
          >
            <span aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <label className="editor-field editor-color-field">
        <span>Custom color</span>
        <input
          type="color"
          value={
            /^#[0-9a-fA-F]{6}$/u.test(theme.backgroundColor) ? theme.backgroundColor : "#0f172a"
          }
          disabled={readOnly}
          onChange={(event) => updateTheme({ backgroundColor: event.currentTarget.value })}
        />
      </label>
      <div className="editor-voiceover-actions">
        <label className="editor-small-button editor-file-button">
          Upload custom image
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={readOnly}
            onChange={handleImageUpload}
            aria-label="Upload custom background image"
          />
        </label>
        {theme.backgroundImageUrl ? (
          <button
            type="button"
            className="editor-text-button editor-button-danger-text"
            disabled={readOnly}
            onClick={() => updateTheme({ backgroundImageUrl: null })}
          >
            Remove image
          </button>
        ) : null}
      </div>
      {theme.backgroundImageUrl ? (
        <p className="editor-inspector-note" role="status">
          Custom image applied. Publish to update links and embeds.
        </p>
      ) : null}
    </section>
  );
}

function VoiceoverSettings({
  step,
  readOnly,
  onChange
}: {
  step: DemoStep;
  readOnly: boolean;
  onChange: (step: DemoStep) => void;
}) {
  const narration = step.audioNarration;
  const [script, setScript] = useState(narration?.transcriptText ?? "");
  const [voiceId, setVoiceId] = useState(narration?.voiceId ?? "en-US-1");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setScript(step.audioNarration?.transcriptText ?? "");
    setVoiceId(step.audioNarration?.voiceId ?? "en-US-1");
    setStatus("");
  }, [step.id]);

  const baseNarration = (): DemoAudioNarration =>
    narration ?? {
      assetId: `${step.id}-voiceover`,
      durationSeconds: 0,
      autoPlay: true,
      source: "ai",
      voiceId,
      audioUrl: null,
      transcriptText: script,
      expressive: false,
      speed: 1,
      stability: 0.5
    };

  const updateNarration = (patch: Partial<DemoAudioNarration>): void => {
    onChange({
      ...step,
      audioNarration: parseDemoAudioNarration({ ...baseNarration(), ...patch })
    });
  };

  const syncScript = (): void => {
    const synced = [step.title, ...step.hotspots.map((hotspot) => hotspot.tooltipText ?? "")]
      .filter(Boolean)
      .join(". ")
      .slice(0, 4_000);
    setScript(synced);
    updateNarration({ transcriptText: synced });
    setStatus("Script synced from this step.");
  };

  const handleGenerate = async (): Promise<void> => {
    if (readOnly) return;
    const boundedScript = script.trim().slice(0, 4_000);
    if (!boundedScript) {
      setStatus("Add narration text before generating audio.");
      return;
    }
    setStatus("Generating AI voiceover…");
    try {
      const job = await generateAiVoiceover(boundedScript, voiceId);
      updateNarration({
        assetId: job.jobId,
        audioUrl: job.audioAssetUrl,
        transcriptText: job.text,
        voiceId: job.voiceId,
        source: "ai",
        autoPlay: true
      });
      setStatus("AI voiceover ready. Save the demo to keep it.");
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Voiceover generation failed.");
    }
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("audio/") || file.size > 25 * 1024 * 1024) {
      setStatus("Choose an audio file up to 25 MB.");
      return;
    }
    const audioUrl = URL.createObjectURL(file);
    updateNarration({
      assetId: `upload-${Date.now()}`,
      audioUrl,
      source: "upload",
      transcriptText: script
    });
    setStatus("Audio uploaded locally. Publish after reviewing the preview.");
  };

  return (
    <section className="editor-voiceover-panel" aria-labelledby="editor-voiceover-title">
      <div className="editor-branch-heading">
        <div>
          <span className="editor-kicker">Voiceovers 2.0</span>
          <strong id="editor-voiceover-title">Narrate this step</strong>
        </div>
        {narration ? (
          <button
            type="button"
            className="editor-text-button editor-button-danger-text"
            disabled={readOnly}
            onClick={() => onChange({ ...step, audioNarration: null })}
          >
            Remove
          </button>
        ) : null}
      </div>
      <label className="editor-field">
        <span>Narration script</span>
        <textarea
          rows={4}
          maxLength={4_000}
          value={script}
          disabled={readOnly}
          placeholder="Describe what the viewer should notice on this step."
          onChange={(event) => {
            const value = event.currentTarget.value.slice(0, 4_000);
            setScript(value);
            updateNarration({ transcriptText: value });
          }}
        />
      </label>
      <div className="editor-voiceover-actions">
        <button
          type="button"
          className="editor-small-button"
          disabled={readOnly}
          onClick={syncScript}
        >
          Sync from hotspots
        </button>
        <label className="editor-small-button editor-file-button">
          Upload voice
          <input
            type="file"
            accept="audio/*"
            disabled={readOnly}
            onChange={handleUpload}
            aria-label="Upload voice audio"
          />
        </label>
      </div>
      <label className="editor-field">
        <span>AI voice</span>
        <select
          value={voiceId}
          disabled={readOnly}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setVoiceId(value);
            updateNarration({ voiceId: value, source: "ai" });
          }}
        >
          {getAvailableTtsVoices().map((voice) => (
            <option key={voice.voiceId} value={voice.voiceId}>
              {voice.name} · {voice.locale}
            </option>
          ))}
        </select>
      </label>
      <div className="editor-voiceover-actions">
        <button
          type="button"
          className="editor-button editor-button-primary"
          disabled={readOnly}
          onClick={() => void handleGenerate()}
        >
          Generate AI voiceover
        </button>
      </div>
      {narration ? (
        <>
          <label className="editor-checkbox-field">
            <input
              type="checkbox"
              checked={Boolean(narration.autoPlay)}
              disabled={readOnly}
              onChange={(event) => updateNarration({ autoPlay: event.currentTarget.checked })}
            />
            <span>Play automatically</span>
          </label>
          <label className="editor-checkbox-field">
            <input
              type="checkbox"
              checked={Boolean(narration.expressive)}
              disabled={readOnly}
              onChange={(event) => updateNarration({ expressive: event.currentTarget.checked })}
            />
            <span>Expressive mode</span>
          </label>
          <div className="editor-field-grid">
            <label className="editor-field">
              <span>Speed</span>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={narration.speed ?? 1}
                disabled={readOnly}
                onChange={(event) => updateNarration({ speed: Number(event.currentTarget.value) })}
              />
            </label>
            <label className="editor-field">
              <span>Stability</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={narration.stability ?? 0.5}
                disabled={readOnly}
                onChange={(event) =>
                  updateNarration({ stability: Number(event.currentTarget.value) })
                }
              />
            </label>
          </div>
          {narration.audioUrl && isSafeMediaUrl(narration.audioUrl) ? (
            <audio className="editor-voiceover-preview" controls src={narration.audioUrl} />
          ) : null}
        </>
      ) : null}
      {status ? (
        <p className="editor-inspector-note" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}

function AiTextSettings({
  step,
  readOnly,
  onChange
}: {
  step: DemoStep;
  readOnly: boolean;
  onChange: (step: DemoStep) => void;
}) {
  const [tone, setTone] = useState<RewriteTone>("professional");
  const [proposal, setProposal] = useState<TextRewriteProposal | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setProposal(null);
    setStatus("");
  }, [step.id]);

  const contextText = [
    step.title,
    step.description ?? "",
    ...step.hotspots.map((hotspot) => hotspot.tooltipText ?? "")
  ]
    .filter(Boolean)
    .join(". ")
    .slice(0, 4_000);

  const generateProposal = async (): Promise<void> => {
    if (readOnly) return;
    if (!contextText.trim()) {
      setStatus("Add step context before asking for a suggestion.");
      return;
    }
    setStatus("Writing a suggestion…");
    try {
      const nextProposal = await proposeTextRewrite(contextText, tone);
      setProposal(nextProposal);
      setStatus("Suggestion ready. Review it before applying.");
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "AI text generation failed.");
    }
  };

  return (
    <section className="editor-ai-text-panel" aria-labelledby="editor-ai-text-title">
      <div className="editor-branch-heading">
        <div>
          <span className="editor-kicker">Supademo AI</span>
          <strong id="editor-ai-text-title">Generate step copy</strong>
        </div>
      </div>
      <p>Use the current step and hotspot context to draft cleaner viewer-facing copy.</p>
      <label className="editor-field">
        <span>Tone</span>
        <select
          value={tone}
          disabled={readOnly}
          onChange={(event) => setTone(event.currentTarget.value as RewriteTone)}
        >
          <option value="professional">Professional</option>
          <option value="concise">Concise</option>
          <option value="casual">Casual</option>
          <option value="persuasive">Persuasive</option>
        </select>
      </label>
      <button
        type="button"
        className="editor-button editor-button-secondary"
        disabled={readOnly}
        onClick={() => void generateProposal()}
      >
        Generate suggestion
      </button>
      {proposal ? (
        <div className="editor-ai-text-proposal">
          <span className="editor-kicker">Preview</span>
          <p>{proposal.proposedText}</p>
          <div className="editor-voiceover-actions">
            <button
              type="button"
              className="editor-button editor-button-primary"
              disabled={readOnly}
              onClick={() => {
                onChange({ ...step, title: proposal.proposedText });
                setStatus("Suggestion applied to the step title.");
                setProposal({ ...proposal, isApplied: true });
              }}
            >
              Apply to title
            </button>
            <button type="button" className="editor-small-button" onClick={() => setProposal(null)}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      {status ? (
        <p className="editor-inspector-note" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}

function AiTranslationsSettings({
  document,
  readOnly,
  onChange
}: {
  document: DemoDocument;
  readOnly: boolean;
  onChange: (document: DemoDocument) => void;
}) {
  const [targetLocale, setTargetLocale] = useState<string>(SUPPORTED_TRANSLATION_LOCALES[0].locale);
  const [preview, setPreview] = useState<DemoTranslationDictionary | null>(null);
  const [editedTranslations, setEditedTranslations] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const sourceMap = collectTranslationSourceMap(document);

  const translate = async (): Promise<void> => {
    if (readOnly) return;
    if (Object.keys(sourceMap).length === 0) {
      setStatus("Add viewer-facing text before creating a translation.");
      return;
    }
    setStatus("Translating this demo…");
    try {
      const job = await executeAiTranslationJob({ ...sourceMap }, "en-US", targetLocale);
      setEditedTranslations({ ...job.translatedTexts });
      setPreview({
        locale: job.targetLocale,
        sourceLocale: job.sourceLocale,
        createdAtIso: new Date().toISOString(),
        translations: job.translatedTexts
      });
      setStatus("Translation ready. Review each field before saving.");
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Translation failed.");
    }
  };

  const saveTranslation = (): void => {
    if (readOnly || !preview) return;
    const nextTranslation: DemoTranslationDictionary = {
      ...preview,
      translations: Object.fromEntries(
        Object.entries(editedTranslations)
          .map(([key, value]) => [key, value.slice(0, 4_000).trim()])
          .filter(([, value]) => Boolean(value))
      )
    };
    onChange({
      ...document,
      translations: [
        ...document.translations.filter(
          (translation) => translation.locale.toLowerCase() !== preview.locale.toLowerCase()
        ),
        nextTranslation
      ]
    });
    setPreview(null);
    setStatus(`${translationLabelForLocale(preview.locale)} translation saved.`);
  };

  return (
    <section className="editor-translation-panel" aria-labelledby="editor-translation-title">
      <div className="editor-branch-heading">
        <div>
          <span className="editor-kicker">Personalize</span>
          <strong id="editor-translation-title">Translate with AI</strong>
        </div>
        <span className="editor-branch-count">{document.translations.length} saved</span>
      </div>
      <p>
        Localize text and voiceover transcripts, then let viewers switch languages from the
        Translate menu.
      </p>
      <label className="editor-field">
        <span>Translate to</span>
        <select
          value={targetLocale}
          disabled={readOnly}
          onChange={(event) => setTargetLocale(event.currentTarget.value)}
        >
          {SUPPORTED_TRANSLATION_LOCALES.map((option) => (
            <option key={option.locale} value={option.locale}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="editor-button editor-button-secondary"
        disabled={readOnly}
        onClick={() => void translate()}
      >
        Translate
      </button>
      {document.translations.length > 0 ? (
        <div className="editor-translation-list" aria-label="Saved translations">
          {document.translations.map((translation) => (
            <div className="editor-translation-list-row" key={translation.locale}>
              <span>{translationLabelForLocale(translation.locale)}</span>
              <button
                type="button"
                className="editor-text-button editor-button-danger-text"
                disabled={readOnly}
                onClick={() =>
                  onChange({
                    ...document,
                    translations: document.translations.filter(
                      (candidate) => candidate.locale !== translation.locale
                    )
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {preview ? (
        <div className="editor-translation-preview" aria-label="Translation preview">
          <div className="editor-translation-preview-heading">
            <span className="editor-kicker">Review translation</span>
            <strong>{translationLabelForLocale(preview.locale)}</strong>
          </div>
          <div className="editor-translation-rows">
            {Object.entries(sourceMap).map(([key, original]) => (
              <label className="editor-translation-row" key={key}>
                <span>
                  <small>Original</small>
                  {original}
                </span>
                <textarea
                  rows={2}
                  maxLength={4_000}
                  value={editedTranslations[key] ?? ""}
                  onChange={(event) =>
                    setEditedTranslations((current) => ({
                      ...current,
                      [key]: event.currentTarget.value.slice(0, 4_000)
                    }))
                  }
                  aria-label={`Translation for ${original}`}
                />
              </label>
            ))}
          </div>
          <div className="editor-voiceover-actions">
            <button
              type="button"
              className="editor-button editor-button-primary"
              disabled={readOnly}
              onClick={saveTranslation}
            >
              Save Translation
            </button>
            <button type="button" className="editor-small-button" onClick={() => setPreview(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
      {status ? (
        <p className="editor-inspector-note" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}

function persistLocalDocument(demoId: string, demoDocument: DemoDocument): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(`supademo_draft_${demoId}`, JSON.stringify(demoDocument));
  } catch {
    // Local persistence is a best-effort fallback for the browser-only demo workspace.
  }
}

type ShareTab = "Link" | "Embed" | "Download" | "Export" | "Present";

function downloadTextFile(filename: string, content: string, mimeType: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeDownloadName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/gu, "-").slice(0, 80) || "supademo";
}

function openPrintableExport(filename: string, content: string): boolean {
  if (typeof window === "undefined") return false;
  const blob = new Blob([content], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (!printWindow) {
    downloadBlob(filename, blob);
    URL.revokeObjectURL(url);
    return false;
  }
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

function SharePanel({
  open,
  initialTab,
  demoId,
  demoDocument,
  readOnly,
  onClose
}: {
  open: boolean;
  initialTab: ShareTab;
  demoId: string;
  demoDocument: DemoDocument;
  readOnly: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ShareTab>(initialTab);
  const [trackingKey, setTrackingKey] = useState("");
  const [publishedManifest, setPublishedManifest] = useState<PublishedDemoManifest | null>(null);
  const [publishError, setPublishError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [personalizedValues, setPersonalizedValues] = useState<Record<string, string>>({});
  const [startingStep, setStartingStep] = useState("0");
  const [expiryPreset, setExpiryPreset] = useState<ShareLinkExpiryPreset>("none");
  const [expiringShareUrl, setExpiringShareUrl] = useState("");
  const [expiryStatus, setExpiryStatus] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [videoFormat, setVideoFormat] = useState<VideoExportFormat>("mp4");
  const [videoResolution, setVideoResolution] = useState<ExportResolution>("1080p");
  const [videoFrameRate, setVideoFrameRate] = useState("30");
  const [videoSlideDuration, setVideoSlideDuration] = useState("2");
  const [offlineStatus, setOfflineStatus] = useState("");
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setCopyStatus("");
    setPublishError("");
    setPersonalizedValues({});
    setStartingStep("0");
    setExpiryPreset("none");
    setExpiringShareUrl("");
    setExpiryStatus("");
    setPopupOpen(false);
    setExportStatus("");
    setExportBusy(false);
    setVideoFormat("mp4");
    setVideoResolution("1080p");
    setVideoFrameRate("30");
    setVideoSlideDuration("2");
    setOfflineStatus("");
    setOfflineReady(readOfflineDownloads().some((entry) => entry.demoId === demoId));
    try {
      const raw = localStorage.getItem(`supademo_published_${demoId}`);
      if (!raw) {
        setPublishedManifest(null);
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) {
        setPublishedManifest(null);
        return;
      }
      const candidate = parsed as Record<string, unknown>;
      if (
        typeof candidate.id !== "string" ||
        typeof candidate.demoId !== "string" ||
        typeof candidate.version !== "number" ||
        typeof candidate.contentHash !== "string" ||
        typeof candidate.publishedAtIso !== "string" ||
        candidate.isPublished !== true
      ) {
        setPublishedManifest(null);
        return;
      }
      const document = parseDemoDocument(candidate.document);
      setPublishedManifest({
        id: candidate.id,
        demoId: candidate.demoId,
        version: candidate.version,
        contentHash: candidate.contentHash,
        publishedAtIso: candidate.publishedAtIso,
        isPublished: true,
        document
      });
    } catch {
      setPublishedManifest(null);
    }
  }, [demoId, initialTab, open]);

  const baseUrl = typeof globalThis.location?.origin === "string" ? globalThis.location.origin : "";
  const viewerPath = `/demos/${encodeURIComponent(demoId)}/view`;
  const viewerUrl = `${baseUrl}${viewerPath}`;
  const shareUrl = buildShareLinkUrl(viewerUrl, {
    trackingLabel: sanitizeTrackingKey(trackingKey)
  });
  const stepShareUrl = buildShareLinkUrl(shareUrl, {
    step: startingStep === "0" ? null : Number(startingStep)
  });
  const configuredVariables = demoDocument.settings.personalization.allowlist;
  const detectedVariables = extractTemplateVariableNames(collectDocumentText(demoDocument));
  const personalizedVariables = detectedVariables.filter((name) =>
    configuredVariables.includes(name)
  );
  const personalizedShareUrl = generatePersonalizedEmbedUrl(
    stepShareUrl,
    personalizedValues,
    configuredVariables
  );
  const dynamicShareUrl = generatePersonalizedEmbedUrl(
    stepShareUrl,
    Object.fromEntries(personalizedVariables.map((name) => [name, name.toUpperCase()])),
    configuredVariables
  );
  const embedSnippet = generateIframeSnippet({
    demoId,
    baseUrl: baseUrl || undefined
  });
  const popupSnippet = generatePopupEmbedSnippet({ demoId });
  const exportDocument = safeExportDocument(demoDocument);
  const sopMarkdown = generateSopMarkdownExport(exportDocument);
  const exportName = safeDownloadName(demoId);
  const tabs: readonly ShareTab[] = ["Link", "Embed", "Download", "Export", "Present"];

  const copyText = async (value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("Copied to clipboard");
    } catch {
      setCopyStatus("Copy was blocked. Select the text and copy it manually.");
    }
  };

  const copyStepsHtml = async (): Promise<void> => {
    const html = generateSopHtmlExport(exportDocument);
    const text = generateSopTextExport(exportDocument);
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" })
          })
        ]);
        setCopyStatus("Copied rich steps to clipboard");
        return;
      }
    } catch {
      // Fall back to plain text in browsers that block rich clipboard writes.
    }
    await copyText(html);
  };

  const handlePrintPdf = (): void => {
    const printableHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Supademo export</title><style>body{margin:32px;color:#172033;font:16px/1.5 system-ui,sans-serif}article{max-width:900px;margin:auto}img{display:block;max-width:100%;max-height:520px;object-fit:contain;border:1px solid #d6dce8;border-radius:8px}section{break-inside:avoid;margin:28px 0}h1{font-size:28px}h2{font-size:21px}</style></head><body>${generateSopHtmlExport(exportDocument)}</body></html>`;
    const opened = openPrintableExport(`${exportName}-export.html`, printableHtml);
    setExportStatus(
      opened
        ? "Printable export opened. Use your browser's Print → Save as PDF."
        : "Popup blocked; the printable export was downloaded as HTML."
    );
  };

  const handlePngExport = async (): Promise<void> => {
    setExportBusy(true);
    setExportStatus("");
    try {
      const blob = await createDemoPng(exportDocument);
      downloadBlob(`${exportName}-steps.png`, blob);
      setExportStatus("PNG export downloaded.");
    } catch (error: unknown) {
      setExportStatus(error instanceof Error ? error.message : "PNG export failed.");
    } finally {
      setExportBusy(false);
    }
  };

  const handleVideoExport = async (): Promise<void> => {
    if (exportDocument.steps.length > 70) {
      setExportStatus("Video exports are limited to 70 steps. Split this demo before exporting.");
      return;
    }
    setExportBusy(true);
    setExportStatus("Rendering export… keep this tab open until the download starts.");
    try {
      const result = await createDemoVideo(exportDocument, {
        format: videoFormat,
        resolution: videoResolution,
        frameRate: Number(videoFrameRate),
        slideDurationMs: Number(videoSlideDuration) * 1_000,
        transitionDelayMs: 250
      });
      downloadBlob(`${exportName}.${result.extension}`, result.blob);
      setExportStatus(
        result.extension === videoFormat
          ? `${videoFormat.toUpperCase()} export downloaded.`
          : `${videoFormat.toUpperCase()} is not available in this browser; WebM fallback downloaded.`
      );
    } catch (error: unknown) {
      setExportStatus(error instanceof Error ? error.message : "Video export failed.");
    } finally {
      setExportBusy(false);
    }
  };

  const handleOfflineDownload = (): void => {
    setOfflineStatus("");
    try {
      const zip = createOfflineZip(demoId, exportDocument);
      const record = saveOfflineDownload(demoId, exportDocument);
      if (!record) {
        setOfflineStatus(
          "This browser could not save the offline demo. Check available storage and try again."
        );
        return;
      }
      const buffer = new ArrayBuffer(zip.byteLength);
      new Uint8Array(buffer).set(zip);
      downloadBlob(`${exportName}-offline.zip`, new Blob([buffer], { type: "application/zip" }));
      setOfflineReady(true);
      setOfflineStatus(
        "Offline demo downloaded. Open the Offline Demos player to present it without a network connection."
      );
    } catch (error: unknown) {
      setOfflineStatus(error instanceof Error ? error.message : "Offline download failed.");
    }
  };

  const handlePublish = (): void => {
    if (readOnly) return;
    if (demoDocument.steps.length === 0) {
      setPublishError("Add at least one screen before publishing this demo.");
      return;
    }
    try {
      const manifest = publishDemoDocument(exportDocument, publishedManifest?.version ?? 0);
      setPublishedManifest(manifest);
      setPublishError("");
      try {
        localStorage.setItem(`supademo_published_${demoId}`, JSON.stringify(manifest));
      } catch {
        // The viewer remains usable in this tab even when local storage is unavailable.
      }
    } catch (error: unknown) {
      setPublishError(
        error instanceof Error ? error.message : "This demo cannot be published yet."
      );
    }
  };

  const handleCreateExpiringLink = (): void => {
    if (readOnly) return;
    if (!publishedManifest) {
      setExpiryStatus("Publish this demo before creating an expiring link.");
      return;
    }
    const expiresAtMs = calculateShareLinkExpiry(expiryPreset);
    if (!expiresAtMs) {
      setExpiryStatus("Choose an expiration window first.");
      setExpiringShareUrl("");
      return;
    }
    const token = createShareToken();
    if (!token) {
      setExpiryStatus("Secure link generation is unavailable in this browser.");
      setExpiringShareUrl("");
      return;
    }
    const record: LocalExpiringShareLink = {
      token,
      expiresAtMs,
      trackingLabel: sanitizeTrackingKey(trackingKey)
    };
    if (!persistExpiringShareLink(demoId, record)) {
      setExpiryStatus("This browser could not save the expiring link. Try again.");
      setExpiringShareUrl("");
      return;
    }
    setExpiringShareUrl(
      buildShareLinkUrl(shareUrl, {
        step: startingStep === "0" ? null : Number(startingStep),
        token,
        expiresAtMs
      })
    );
    setExpiryStatus(`Expires ${new Date(expiresAtMs).toLocaleString()}`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share demo"
      description="Publish a version, copy a trackable link, embed the viewer, or present it full-screen."
      className="editor-share-modal"
    >
      <div className="editor-share-tabs" role="tablist" aria-label="Share options">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? "is-active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Link" ? (
        <div className="editor-share-section">
          <div className="editor-share-status-card">
            <span className={`editor-share-dot${publishedManifest ? " is-published" : ""}`} />
            <span>
              <strong>{publishedManifest ? "Published" : "Draft"}</strong>
              <small>
                {publishedManifest
                  ? `Version ${publishedManifest.version} is ready to share.`
                  : "Publish only after the viewer path is ready."}
              </small>
            </span>
            {!readOnly ? (
              <button
                type="button"
                className="editor-button editor-button-primary"
                onClick={handlePublish}
              >
                {publishedManifest ? "Publish update" : "Publish"}
              </button>
            ) : null}
          </div>
          {publishError ? (
            <p className="editor-share-error" role="alert">
              {publishError}
            </p>
          ) : null}
          <label className="editor-field">
            <span>Trackable link label</span>
            <input
              type="text"
              value={trackingKey}
              maxLength={64}
              placeholder="e.g. launch-email"
              onChange={(event) => setTrackingKey(event.currentTarget.value)}
            />
          </label>
          <p className="editor-share-note">
            Use a unique label for each viewer, campaign, or recipient to attribute engagement.
          </p>
          <label className="editor-field">
            <span>Open at step</span>
            <select
              value={startingStep}
              aria-label="Share link starting step"
              onChange={(event) => setStartingStep(event.currentTarget.value)}
            >
              <option value="0">Start of demo</option>
              {demoDocument.steps.map((step, index) => (
                <option key={step.id} value={String(index + 1)}>
                  Step {index + 1}: {step.title}
                </option>
              ))}
            </select>
          </label>
          <div className="editor-share-copy-row">
            <input type="text" readOnly value={stepShareUrl} aria-label="Share link" />
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={() => void copyText(stepShareUrl)}
            >
              Copy link
            </button>
          </div>
          <p className="editor-share-note">
            Viewer events from the link can be attributed by its <code>ref</code> label. The
            <code>step</code> parameter opens a specific slide.
          </p>
          <section className="editor-share-expiry" aria-labelledby="share-expiry-title">
            <div className="editor-share-section-heading">
              <span className="editor-kicker">Access control</span>
              <strong id="share-expiry-title">Expiring share link</strong>
            </div>
            <p className="editor-share-note">
              Create a unique link that stops working after the selected window.
            </p>
            <label className="editor-field">
              <span>Expire after</span>
              <select
                value={expiryPreset}
                onChange={(event) => {
                  setExpiryPreset(event.currentTarget.value as ShareLinkExpiryPreset);
                  setExpiringShareUrl("");
                  setExpiryStatus("");
                }}
              >
                {SHARE_LINK_EXPIRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="editor-button editor-button-secondary"
              disabled={readOnly || expiryPreset === "none"}
              onClick={handleCreateExpiringLink}
            >
              Create expiring link
            </button>
            {expiringShareUrl ? (
              <div className="editor-share-copy-row">
                <input
                  type="text"
                  readOnly
                  value={expiringShareUrl}
                  aria-label="Expiring share link"
                />
                <button
                  type="button"
                  className="editor-button editor-button-secondary"
                  onClick={() => void copyText(expiringShareUrl)}
                >
                  Copy expiring link
                </button>
              </div>
            ) : null}
            {expiryStatus ? (
              <p className="editor-share-feedback" role="status">
                {expiryStatus}
              </p>
            ) : null}
          </section>
          {personalizedVariables.length > 0 ? (
            <section
              className="editor-share-personalization"
              aria-labelledby="share-personalization-title"
            >
              <div className="editor-share-section-heading">
                <span className="editor-kicker">Personalize link</span>
                <strong id="share-personalization-title">Fill in this viewer’s details</strong>
              </div>
              <p className="editor-share-note">
                These values are bounded and added as <code>v_*</code> parameters. The viewer uses
                them in your <code>{"{{tokens}}"}</code>.
              </p>
              {personalizedVariables.map((name) => (
                <label className="editor-field" key={name}>
                  <span>{name}</span>
                  <input
                    type="text"
                    value={personalizedValues[name] ?? ""}
                    maxLength={160}
                    placeholder={`Value for {{${name}}}`}
                    onChange={(event) => {
                      const value = event.currentTarget.value.slice(0, 160);
                      setPersonalizedValues((current) => ({ ...current, [name]: value }));
                    }}
                  />
                </label>
              ))}
              <div className="editor-share-copy-row">
                <input
                  type="text"
                  readOnly
                  value={personalizedShareUrl}
                  aria-label="Personalized share link"
                />
                <button
                  type="button"
                  className="editor-button editor-button-secondary"
                  onClick={() => void copyText(personalizedShareUrl)}
                >
                  Copy personalized link
                </button>
              </div>
              <div className="editor-share-actions">
                <button
                  type="button"
                  className="editor-button editor-button-secondary"
                  onClick={() => void copyText(dynamicShareUrl)}
                >
                  Copy dynamic link template
                </button>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === "Embed" ? (
        <div className="editor-share-section">
          <p className="editor-share-lede">
            Paste this responsive iframe snippet into a help center, website, or LMS.
          </p>
          <textarea
            className="editor-share-code"
            readOnly
            value={embedSnippet}
            aria-label="Embed snippet"
          />
          <div className="editor-share-actions">
            <button
              type="button"
              className="editor-button editor-button-primary"
              onClick={() => void copyText(embedSnippet)}
            >
              Copy embed code
            </button>
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={() => void copyText(popupSnippet)}
            >
              Copy popup trigger
            </button>
          </div>
          <p className="editor-share-note">
            The demo ID is URL-encoded and the iframe only requests fullscreen and clipboard-write.
          </p>
          <textarea
            className="editor-share-code"
            readOnly
            value={popupSnippet}
            aria-label="Popup embed snippet"
          />
        </div>
      ) : null}

      {tab === "Export" ? (
        <div className="editor-share-section">
          <p className="editor-share-lede">
            Repurpose the demo as a guide, printable PDF, image, or video for teams that cannot use
            an embed.
          </p>
          <div className="editor-share-section-heading">
            <strong>Copy Steps</strong>
            <small className="editor-share-note">
              Copy every step as image-plus-text content for Notion, Confluence, or a CMS.
            </small>
          </div>
          <div className="editor-share-export-grid">
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={() => void copyStepsHtml()}
            >
              Copy Steps (HTML)
            </button>
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={() => void copyText(generateSopTextExport(exportDocument))}
            >
              Copy Steps (Text)
            </button>
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={() =>
                downloadTextFile(`${exportName}-sop.md`, sopMarkdown, "text/markdown;charset=utf-8")
              }
            >
              Download SOP (Markdown)
            </button>
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={() =>
                downloadTextFile(
                  `${exportName}.json`,
                  JSON.stringify(exportDocument, null, 2),
                  "application/json"
                )
              }
            >
              Download document (JSON)
            </button>
          </div>
          <div className="editor-share-section-heading">
            <strong>Export to PDF or PNG</strong>
            <small className="editor-share-note">
              PDF opens a print-ready guide; PNG downloads a bounded contact sheet of the steps.
            </small>
          </div>
          <div className="editor-share-export-grid">
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={handlePrintPdf}
              disabled={exportBusy}
            >
              Export to PDF
            </button>
            <button
              type="button"
              className="editor-button editor-button-secondary"
              onClick={() => void handlePngExport()}
              disabled={exportBusy}
            >
              Export to PNG
            </button>
          </div>
          <div className="editor-share-section-heading">
            <strong>Export to MP4/GIF</strong>
            <small className="editor-share-note">
              Video exports support up to 70 steps. Encoder support varies by browser; unsupported
              formats use WebM.
            </small>
          </div>
          <div className="editor-share-export-controls">
            <label>
              Format
              <select
                value={videoFormat}
                onChange={(event) => setVideoFormat(event.target.value as VideoExportFormat)}
              >
                <option value="mp4">MP4</option>
                <option value="gif">GIF</option>
              </select>
            </label>
            <label>
              Resolution
              <select
                value={videoResolution}
                onChange={(event) => setVideoResolution(event.target.value as ExportResolution)}
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4k">4K</option>
              </select>
            </label>
            <label>
              Frame rate
              <select
                value={videoFrameRate}
                onChange={(event) => setVideoFrameRate(event.target.value)}
              >
                <option value="24">24 FPS</option>
                <option value="30">30 FPS</option>
                <option value="60">60 FPS</option>
              </select>
            </label>
            <label>
              Slide duration
              <select
                value={videoSlideDuration}
                onChange={(event) => setVideoSlideDuration(event.target.value)}
              >
                <option value="1">1 second</option>
                <option value="2">2 seconds</option>
                <option value="3">3 seconds</option>
                <option value="5">5 seconds</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            className="editor-button editor-button-primary"
            onClick={() => void handleVideoExport()}
            disabled={exportBusy}
          >
            {exportBusy ? "Rendering export…" : `Download as ${videoFormat.toUpperCase()}`}
          </button>
          {exportStatus ? (
            <p className="editor-share-feedback" role="status">
              {exportStatus}
            </p>
          ) : null}
          <p className="editor-share-note">
            Media paths are included only when they use a safe HTTPS or local blob URL.
          </p>
        </div>
      ) : null}

      {tab === "Download" ? (
        <div className="editor-share-section editor-share-download">
          <span className="editor-kicker">Offline access</span>
          <h3>Download an Offline Demo</h3>
          <p className="editor-share-lede">
            Save this demo to the browser and download a portable ZIP. Present it later from the
            Offline Demos player even when your network is unavailable.
          </p>
          <div className="editor-share-status-card">
            <span className={`editor-share-dot${offlineReady ? " is-published" : ""}`} />
            <span>
              <strong>{offlineReady ? "Offline download ready" : "Not downloaded"}</strong>
              <small>
                {offlineReady
                  ? "This demo is available in this browser."
                  : "Create a local offline copy from the latest saved document."}
              </small>
            </span>
          </div>
          <div className="editor-share-actions">
            <button
              type="button"
              className="editor-button editor-button-primary"
              onClick={handleOfflineDownload}
            >
              {offlineReady ? "Download update" : "Download"}
            </button>
            <a className="editor-button editor-button-secondary" href="/offline">
              Open Offline Demos
            </a>
          </div>
          {offlineStatus ? (
            <p className="editor-share-feedback" role="status">
              {offlineStatus}
            </p>
          ) : null}
          <p className="editor-share-note">
            The ZIP contains a local launch page, the validated demo document, and a static offline
            player. Remote media is included only when its URL remains safe and reachable.
          </p>
        </div>
      ) : null}

      {tab === "Present" ? (
        <div className="editor-share-section editor-share-present">
          <span className="editor-kicker">Presenter mode</span>
          <h3>Open the focused viewer preview</h3>
          <p>
            Use the same step path your audience will see, with hotspots and next/previous controls.
          </p>
          <a className="editor-button editor-button-primary" href={viewerPath}>
            Open viewer preview
          </a>
          <button
            type="button"
            className="editor-button editor-button-secondary"
            onClick={() => setPopupOpen(true)}
          >
            Open popup preview
          </button>
          {popupOpen ? (
            <div
              className="editor-popup-preview"
              role="dialog"
              aria-modal="true"
              aria-label="Interactive Demo Popup"
            >
              <div className="editor-popup-preview-frame">
                <button
                  type="button"
                  className="editor-popup-preview-close"
                  aria-label="Close popup preview"
                  onClick={() => setPopupOpen(false)}
                >
                  ×
                </button>
                <iframe
                  title="Interactive demo popup preview"
                  src={`${baseUrl}/e/${encodeURIComponent(demoId)}?popup=true`}
                  allow="fullscreen; clipboard-write"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {copyStatus ? (
        <p className="editor-share-feedback" role="status">
          {copyStatus}
        </p>
      ) : null}
    </Modal>
  );
}

function CaptureEntryPanel({
  copy,
  captureError,
  captureStatus,
  captureMode,
  compact = false,
  fileInputRef,
  onFileChange,
  onOpenFilePicker,
  readOnly
}: {
  copy: { title: string; description: string };
  captureError: string;
  captureStatus: string;
  captureMode: CaptureMode;
  compact?: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenFilePicker: () => void;
  readOnly: boolean;
}) {
  return (
    <section className={`editor-capture-entry${compact ? " is-compact" : ""}`}>
      <div className="editor-capture-copy">
        <span className="editor-kicker">{copy.title}</span>
        <strong>{compact ? "Add another screen" : "Start with your first screen"}</strong>
        <p>{copy.description}</p>
      </div>
      {!readOnly ? (
        <div className="editor-capture-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={onFileChange}
            className="editor-file-input"
            aria-label="Choose an image or video capture"
          />
          <button
            type="button"
            className="editor-button editor-button-primary"
            onClick={onOpenFilePicker}
          >
            Import screenshot or video
          </button>
          {captureMode === "html" || captureMode === "sandbox" ? (
            <a className="editor-capture-link" href="/download">
              Open recorder setup
            </a>
          ) : null}
          {captureMode === "video" ? (
            <>
              <a className="editor-capture-link" href="/screen-recorder">
                Record screen &amp; camera
              </a>
              <a className="editor-capture-link" href="/video-hotspots">
                Add video hotspots
              </a>
            </>
          ) : null}
          {captureMode === "upload" ? (
            <a className="editor-capture-link" href="/upload">
              Open upload workspace
            </a>
          ) : null}
        </div>
      ) : null}
      {captureError ? (
        <span className="editor-capture-error" role="alert">
          {captureError}
        </span>
      ) : null}
      {captureStatus ? (
        <span className="editor-capture-status" role="status">
          {captureStatus}
        </span>
      ) : null}
      <small className="editor-capture-limit">Images and videos up to 100 MB</small>
    </section>
  );
}

export interface EditorShellProps {
  demoId: string;
  initialDocument: DemoDocument;
  readOnly?: boolean;
  saveState?: "saved" | "saving" | "offline" | "conflict" | "error";
  onSaveDocument?: (doc: DemoDocument) => Promise<void>;
  onPreview?: () => void;
  onShare?: () => void;
  captureMode?: CaptureMode;
}

export function EditorShell({
  demoId,
  initialDocument,
  readOnly = false,
  saveState = "saved",
  onSaveDocument,
  onPreview,
  onShare,
  captureMode = "guided"
}: EditorShellProps) {
  const [document, setDocument] = useState<DemoDocument>(initialDocument);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    initialDocument.steps[0]?.id ?? null
  );
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [captureStatus, setCaptureStatus] = useState("");
  const [captureError, setCaptureError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const undoStackRef = useRef<DemoDocument[]>([]);
  const redoStackRef = useRef<DemoDocument[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareInitialTab, setShareInitialTab] = useState<ShareTab>("Link");
  const [hotspotUrlDraft, setHotspotUrlDraft] = useState("");

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (readOnly || initialDocument.steps.length > 0 || typeof localStorage === "undefined") {
      return;
    }
    try {
      const raw = localStorage.getItem(`supademo_draft_${demoId}`);
      if (!raw) return;
      const restored = parseDemoDocument(JSON.parse(raw));
      if (restored.demoId !== demoId) return;
      setDocument(restored);
      setSelectedStepId(restored.steps[0]?.id ?? null);
      setSelectedChapterId(null);
      setSelectedHotspotId(null);
    } catch {
      // A malformed or stale local draft fails closed to the server-provided empty document.
    }
  }, [demoId, initialDocument.steps.length, readOnly]);

  const selectedStep = document.steps.find((s) => s.id === selectedStepId) ?? null;
  const selectedChapter =
    document.chapters.find((chapter) => chapter.id === selectedChapterId) ?? null;
  const selectedHotspot = selectedStep?.hotspots.find((h) => h.id === selectedHotspotId) ?? null;
  const branchSummary = generateBranchingDiagnosticSummary(document);

  useEffect(() => {
    setHotspotUrlDraft(selectedHotspot?.url ?? "");
  }, [selectedHotspot?.id, selectedHotspot?.url]);

  const makeLocalId = (prefix: string): string => {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now().toString(36)}`;
  };

  const commitDocument = (nextDocument: DemoDocument): void => {
    const updated: DemoDocument = {
      ...nextDocument,
      demoId,
      updatedAtIso: new Date().toISOString()
    };
    undoStackRef.current.push(document);
    if (undoStackRef.current.length > 100) undoStackRef.current.shift();
    redoStackRef.current = [];
    setHistoryVersion((version) => version + 1);
    setDocument(updated);
    persistLocalDocument(demoId, updated);
    if (onSaveDocument) void onSaveDocument(updated);
  };

  const restoreFromHistory = (nextDocument: DemoDocument): void => {
    const updated: DemoDocument = {
      ...nextDocument,
      demoId,
      updatedAtIso: new Date().toISOString()
    };
    setHistoryVersion((version) => version + 1);
    setDocument(updated);
    const restoredStep =
      updated.steps.find((step) => step.id === selectedStepId) ?? updated.steps[0];
    setSelectedStepId(restoredStep?.id ?? null);
    setSelectedChapterId(
      updated.chapters.some((chapter) => chapter.id === selectedChapterId)
        ? selectedChapterId
        : null
    );
    setSelectedHotspotId(
      restoredStep?.hotspots.some((hotspot) => hotspot.id === selectedHotspotId)
        ? selectedHotspotId
        : null
    );
    persistLocalDocument(demoId, updated);
    if (onSaveDocument) void onSaveDocument(updated);
  };

  const handleUndo = (): void => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    redoStackRef.current.push(document);
    restoreFromHistory(previous);
  };

  const handleRedo = (): void => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(document);
    restoreFromHistory(next);
  };

  const handleTitleChange = (newTitle: string) => {
    if (readOnly) return;
    const updatedSteps = document.steps[0]
      ? [{ ...document.steps[0], title: newTitle }, ...document.steps.slice(1)]
      : document.steps;
    commitDocument({ ...document, steps: updatedSteps });
  };

  const handleAddStep = () => {
    if (readOnly) return;
    const newStepId = makeLocalId("step");
    const newStep: DemoStep = {
      id: newStepId,
      orderIndex: document.steps.length,
      title: `Step ${document.steps.length + 1}`,
      description: null,
      media: null,
      hotspots: [],
      callouts: [],
      audioNarration: null
    };
    const updated = { ...document, steps: [...document.steps, newStep] };
    commitDocument(updated);
    setSelectedStepId(newStepId);
    setSelectedChapterId(null);
    setSelectedHotspotId(null);
  };

  const handleAddChapter = (): void => {
    if (readOnly) return;
    const selectedStepIndex = selectedStep
      ? document.steps.findIndex((step) => step.id === selectedStep.id)
      : -1;
    const orderIndex =
      selectedStepIndex >= 0
        ? selectedStepIndex
        : (selectedChapter?.orderIndex ?? document.steps.length);
    const chapterId = makeLocalId("chapter");
    const chapter = {
      id: chapterId,
      type: "intro" as const,
      orderIndex: Math.max(0, Math.min(document.steps.length, orderIndex)),
      title: `Chapter ${document.chapters.length + 1}`,
      bodyText: "Add context before the viewer continues.",
      mediaAssetId: null,
      mediaUrl: null,
      presenterNotes: null,
      form: null,
      buttons: [
        {
          id: makeLocalId("chapter-button"),
          label: "Continue",
          actionType: "next" as const,
          targetStepId: null,
          url: null
        }
      ]
    };
    commitDocument({
      ...document,
      chapters: normalizeChapterOrder([...document.chapters, chapter])
    });
    setSelectedChapterId(chapterId);
    setSelectedStepId(null);
    setSelectedHotspotId(null);
  };

  const handleUpdateChapter = (updatedChapter: DemoDocument["chapters"][number]): void => {
    if (readOnly) return;
    const boundedChapter = {
      ...updatedChapter,
      orderIndex: Math.max(
        0,
        Math.min(document.steps.length, Math.floor(updatedChapter.orderIndex))
      ),
      title: updatedChapter.title.slice(0, 160),
      bodyText: updatedChapter.bodyText?.slice(0, 4_000) ?? null,
      mediaUrl: updatedChapter.mediaUrl?.slice(0, 2_048) ?? null,
      presenterNotes: updatedChapter.presenterNotes?.slice(0, 4_000) ?? null,
      form: updatedChapter.form ? parseDemoFormSchema(updatedChapter.form) : null
    };
    commitDocument({
      ...document,
      chapters: normalizeChapterOrder(
        document.chapters.map((chapter) =>
          chapter.id === updatedChapter.id ? boundedChapter : chapter
        )
      )
    });
  };

  const handleDeleteChapter = (): void => {
    if (readOnly || !selectedChapter) return;
    const selectedIndex = document.chapters.findIndex(
      (chapter) => chapter.id === selectedChapter.id
    );
    const remaining = document.chapters.filter((chapter) => chapter.id !== selectedChapter.id);
    commitDocument({ ...document, chapters: normalizeChapterOrder(remaining) });
    const fallback = remaining[selectedIndex] ?? remaining[selectedIndex - 1] ?? null;
    setSelectedChapterId(fallback?.id ?? null);
    setSelectedStepId(fallback ? null : (document.steps[0]?.id ?? null));
    setSelectedHotspotId(null);
  };

  const handleDuplicateStep = (): void => {
    if (readOnly || !selectedStep) return;
    const selectedIndex = document.steps.findIndex((step) => step.id === selectedStep.id);
    if (selectedIndex < 0) return;
    const duplicate = duplicateStep(selectedStep, selectedIndex + 1);
    const nextSteps = normalizeStepOrder([
      ...document.steps.slice(0, selectedIndex + 1),
      duplicate,
      ...document.steps.slice(selectedIndex + 1)
    ]);
    commitDocument({ ...document, steps: nextSteps });
    setSelectedStepId(duplicate.id);
    setSelectedChapterId(null);
    setSelectedHotspotId(null);
  };

  const handleDeleteStep = (): void => {
    if (readOnly || !selectedStep) return;
    const selectedIndex = document.steps.findIndex((step) => step.id === selectedStep.id);
    if (selectedIndex < 0) return;
    const remaining = deleteSteps(document.steps, new Set([selectedStep.id]));
    commitDocument({ ...document, steps: remaining });
    const fallback = remaining[selectedIndex] ?? remaining[selectedIndex - 1] ?? null;
    setSelectedStepId(fallback?.id ?? null);
    setSelectedChapterId(null);
    setSelectedHotspotId(null);
  };

  const handleMoveStep = (direction: "up" | "down"): void => {
    if (readOnly || !selectedStep) return;
    const fromIndex = document.steps.findIndex((step) => step.id === selectedStep.id);
    if (fromIndex < 0) return;
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= document.steps.length) return;
    const nextSteps = reorderSteps(document.steps, fromIndex, toIndex);
    commitDocument({ ...document, steps: nextSteps });
    setSelectedChapterId(null);
  };

  const handleCaptureFile = (event: ChangeEvent<HTMLInputElement>): void => {
    if (readOnly) return;
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    const maxBytes = 100 * 1024 * 1024;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setCaptureError("Choose an image or video file.");
      setCaptureStatus("");
      return;
    }
    if (file.size > maxBytes) {
      setCaptureError("Files must be 100 MB or smaller.");
      setCaptureStatus("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlsRef.current.add(objectUrl);
    const stepId = makeLocalId("step");
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._ -]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    const title = safeName || (isVideo ? "Captured video" : "Captured screen");
    const newStep: DemoStep = {
      id: stepId,
      orderIndex: document.steps.length,
      title,
      description: isVideo ? "Imported video walkthrough." : "Imported screen capture.",
      media: {
        assetId: makeLocalId("local-asset"),
        assetType: isVideo ? "video" : "screenshot",
        storagePath: objectUrl,
        width: null,
        height: null,
        durationSeconds: null,
        posterPath: null
      },
      hotspots: [],
      callouts: [],
      audioNarration: null
    };
    commitDocument({ ...document, steps: [...document.steps, newStep] });
    setSelectedStepId(stepId);
    setSelectedHotspotId(null);
    setCaptureError("");
    setCaptureStatus(`${isVideo ? "Video" : "Screen"} added as step ${document.steps.length + 1}.`);
  };

  const handleAddHotspot = () => {
    if (readOnly || !selectedStep) return;
    const newHotspotId = makeLocalId("hotspot");
    const newHotspot: DemoHotspot = {
      id: newHotspotId,
      x: 40,
      y: 40,
      width: 20,
      height: 12,
      targetStepId: null,
      tooltipText: "Click to continue",
      actionType: "next_step",
      url: null,
      style: { pulse: true, color: "#4f46e5", opacity: 0.8 }
    };
    const updatedSteps = document.steps.map((s) => {
      if (s.id !== selectedStep.id) return s;
      return { ...s, hotspots: [...s.hotspots, newHotspot] };
    });
    const updated = { ...document, steps: updatedSteps };
    commitDocument(updated);
    setSelectedHotspotId(newHotspotId);
  };

  const handleAddBranchChoice = (): void => {
    if (readOnly || !selectedStep) return;
    const selectedIndex = document.steps.findIndex((step) => step.id === selectedStep.id);
    if (selectedIndex < 0) return;

    const nextStep = document.steps[selectedIndex + 1] ?? null;
    const branchStepId = makeLocalId("branch");
    const branchStep: DemoStep = {
      id: branchStepId,
      orderIndex: document.steps.length,
      title: `Branch ${document.steps.length + 1}`,
      description: "A viewer-selected branch destination.",
      media: null,
      hotspots: [],
      callouts: [],
      audioNarration: null
    };

    const branchChoice: DemoHotspot = {
      id: makeLocalId("hotspot"),
      x: 18 + (selectedStep.hotspots.length % 3) * 24,
      y: 68,
      width: 20,
      height: 12,
      targetStepId: branchStepId,
      tooltipText: `Explore ${branchStep.title}`,
      actionType: "goto_step",
      url: null,
      style: { pulse: true, color: "#7c5cff", opacity: 0.86 }
    };

    const seededChoices: readonly DemoHotspot[] =
      selectedStep.hotspots.length === 0 && nextStep
        ? [
            {
              id: makeLocalId("hotspot"),
              x: 18,
              y: 52,
              width: 20,
              height: 12,
              targetStepId: nextStep.id,
              tooltipText: "Continue to next step",
              actionType: "goto_step",
              url: null,
              style: { pulse: true, color: "#4d56e8", opacity: 0.8 }
            },
            branchChoice
          ]
        : [...selectedStep.hotspots, branchChoice];

    const updatedSteps = normalizeStepOrder([
      ...document.steps.slice(0, selectedIndex),
      { ...selectedStep, hotspots: seededChoices },
      ...document.steps.slice(selectedIndex + 1),
      branchStep
    ]);
    commitDocument({ ...document, steps: updatedSteps });
    setSelectedStepId(selectedStep.id);
    setSelectedHotspotId(branchChoice.id);
  };

  const updateSelectedHotspot = (patch: Partial<DemoHotspot>): void => {
    if (readOnly || !selectedStep || !selectedHotspot) return;
    const updatedSteps = document.steps.map((step) => {
      if (step.id !== selectedStep.id) return step;
      return {
        ...step,
        hotspots: step.hotspots.map((hotspot) =>
          hotspot.id === selectedHotspot.id ? { ...hotspot, ...patch } : hotspot
        )
      };
    });
    commitDocument({ ...document, steps: updatedSteps });
  };

  const updateSelectedStep = (updatedStep: DemoStep): void => {
    if (readOnly || !selectedStep) return;
    commitDocument({
      ...document,
      steps: document.steps.map((step) => (step.id === selectedStep.id ? updatedStep : step))
    });
  };

  const handleNudgeHotspot = (direction: "up" | "down" | "left" | "right"): void => {
    if (!selectedHotspot) return;
    updateSelectedHotspot({
      ...nudgeHotspot(selectedHotspot, direction, 1)
    });
  };

  const handleHotspotKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    const directions: Record<string, "up" | "down" | "left" | "right"> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right"
    };
    const direction = directions[event.key];
    if (direction) {
      event.preventDefault();
      handleNudgeHotspot(direction);
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      handleDeleteHotspot();
    }
  };

  const handleDeleteHotspot = (): void => {
    if (readOnly || !selectedStep || !selectedHotspot) return;
    const updatedSteps = document.steps.map((step) =>
      step.id === selectedStep.id
        ? {
            ...step,
            hotspots: step.hotspots.filter((hotspot) => hotspot.id !== selectedHotspot.id)
          }
        : step
    );
    commitDocument({ ...document, steps: updatedSteps });
    setSelectedHotspotId(null);
  };

  const handlePreview = (): void => {
    if (onPreview) {
      onPreview();
      return;
    }
    setShareInitialTab("Present");
    setShareOpen(true);
  };

  const handleShare = (): void => {
    if (onShare) {
      onShare();
      return;
    }
    setShareInitialTab("Link");
    setShareOpen(true);
  };

  return (
    <div className="editor-shell">
      {readOnly ? (
        <div className="editor-readonly-banner" role="status">
          Read-only mode — You do not have permission to edit this demo.
        </div>
      ) : null}
      <header className="editor-topbar">
        <div className="editor-topbar-left">
          <a className="editor-back-link" href="/demos">
            <span aria-hidden="true">←</span> Back to Demos
          </a>
          <span className="editor-divider" aria-hidden="true" />
          <input
            className="editor-title-input"
            type="text"
            value={document.steps[0]?.title ?? "Untitled Demo"}
            disabled={readOnly}
            onChange={(event) => handleTitleChange(event.currentTarget.value)}
            aria-label="Demo Title"
          />
          <span className={`editor-save-state editor-save-${saveState}`} role="status">
            {saveState === "saved" && "✓ Saved"}
            {saveState === "saving" && "⟳ Saving…"}
            {saveState === "offline" && "⚠ Offline"}
            {saveState === "conflict" && "⚡ Conflict"}
            {saveState === "error" && "✖ Save error"}
          </span>
        </div>
        <div className="editor-topbar-actions" data-history-version={historyVersion}>
          {!readOnly ? (
            <>
              <button
                type="button"
                className="editor-small-button"
                onClick={handleUndo}
                disabled={undoStackRef.current.length === 0}
                aria-label="Undo last edit"
              >
                Undo
              </button>
              <button
                type="button"
                className="editor-small-button"
                onClick={handleRedo}
                disabled={redoStackRef.current.length === 0}
                aria-label="Redo last edit"
              >
                Redo
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="editor-button editor-button-secondary"
            onClick={handlePreview}
          >
            Preview
          </button>
          <button
            type="button"
            className="editor-button editor-button-primary"
            onClick={handleShare}
          >
            Share
          </button>
        </div>
      </header>

      <div className="editor-workspace">
        <aside className="editor-step-rail" aria-label="Step Navigation Rail">
          <div className="editor-panel-heading">
            <div>
              <span className="editor-kicker">Storyboard</span>
              <strong>Steps ({document.steps.length})</strong>
            </div>
            {!readOnly ? (
              <button type="button" className="editor-small-button" onClick={handleAddStep}>
                + Step
              </button>
            ) : null}
          </div>
          <div className="editor-step-list">
            {document.steps.map((step, index) => {
              const isSelected = step.id === selectedStepId;
              return (
                <button
                  key={step.id}
                  type="button"
                  className={`editor-step-card${isSelected ? " is-selected" : ""}`}
                  onClick={() => {
                    setSelectedStepId(step.id);
                    setSelectedChapterId(null);
                    setSelectedHotspotId(null);
                  }}
                  aria-pressed={isSelected}
                >
                  <span className="editor-step-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="editor-step-copy">
                    <strong>{step.title}</strong>
                    <small>
                      {step.hotspots.length} hotspot{step.hotspots.length === 1 ? "" : "s"}
                    </small>
                  </span>
                </button>
              );
            })}
            {document.steps.length === 0 ? (
              <p className="editor-empty-state">No steps yet. Add one to start your demo.</p>
            ) : null}
          </div>
          <div className="editor-panel-heading editor-chapter-heading">
            <div>
              <span className="editor-kicker">Context</span>
              <strong>Chapters ({document.chapters.length})</strong>
            </div>
            {!readOnly ? (
              <button
                type="button"
                className="editor-small-button"
                onClick={handleAddChapter}
                aria-label="Add chapter"
              >
                + Chapter
              </button>
            ) : null}
          </div>
          <div className="editor-chapter-list" aria-label="Chapter navigation">
            {document.chapters.map((chapter, index) => {
              const isSelected = chapter.id === selectedChapterId;
              const placement =
                chapter.orderIndex === 0
                  ? "Beginning"
                  : chapter.orderIndex >= document.steps.length
                    ? "End"
                    : `Before step ${chapter.orderIndex + 1}`;
              return (
                <button
                  key={chapter.id}
                  type="button"
                  className={`editor-chapter-card${isSelected ? " is-selected" : ""}`}
                  onClick={() => {
                    setSelectedChapterId(chapter.id);
                    setSelectedStepId(null);
                    setSelectedHotspotId(null);
                  }}
                  aria-pressed={isSelected}
                >
                  <span className="editor-chapter-number">
                    C{String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="editor-step-copy">
                    <strong>{chapter.title}</strong>
                    <small>
                      {chapter.type} · {placement} · {chapter.buttons.length} action
                      {chapter.buttons.length === 1 ? "" : "s"}
                    </small>
                  </span>
                </button>
              );
            })}
            {document.chapters.length === 0 ? (
              <p className="editor-empty-state">Add a chapter to guide viewers between screens.</p>
            ) : null}
          </div>
        </aside>

        <main className="editor-canvas" aria-label="Editor Canvas">
          <div className="editor-canvas-toolbar">
            <span>Canvas</span>
            <span>
              {document.layout.aspectRatio} · {document.steps.length} screen
              {document.steps.length === 1 ? "" : "s"}
            </span>
          </div>
          {selectedChapter ? (
            <div className="editor-chapter-preview" aria-label="Chapter preview">
              <span className="editor-chapter-preview-badge">{selectedChapter.type} · chapter</span>
              <h2>{selectedChapter.title}</h2>
              <p>{selectedChapter.bodyText || "Add a description for viewers."}</p>
              <div className="editor-chapter-preview-actions">
                {selectedChapter.buttons.map((button) => (
                  <button
                    key={button.id}
                    type="button"
                    className="editor-button editor-button-primary"
                    disabled
                  >
                    {button.label}
                  </button>
                ))}
                {selectedChapter.buttons.length === 0 ? (
                  <button type="button" className="editor-button editor-button-secondary" disabled>
                    Continue
                  </button>
                ) : null}
              </div>
              <small>Preview only — publish to see this chapter in the viewer.</small>
            </div>
          ) : selectedStep ? (
            <div
              className={`editor-preview editor-preview-${document.layout.aspectRatio.replace(":", "-")}`}
            >
              {selectedStep.media ? (
                selectedStep.media.assetType === "video" ? (
                  <video
                    src={selectedStep.media.storagePath}
                    controls
                    playsInline
                    aria-label={selectedStep.title}
                  />
                ) : (
                  <img src={selectedStep.media.storagePath} alt={selectedStep.title} />
                )
              ) : (
                <div className="editor-preview-placeholder">
                  <span className="editor-placeholder-icon" aria-hidden="true">
                    ▦
                  </span>
                  <strong>{selectedStep.title}</strong>
                  <small>Add a screen or video to this step</small>
                </div>
              )}
              {selectedStep.hotspots.map((hotspot) => {
                const isSelected = hotspot.id === selectedHotspotId;
                return (
                  <button
                    key={hotspot.id}
                    type="button"
                    className={`editor-hotspot${isSelected ? " is-selected" : ""}${
                      hotspot.style.pulse ? " is-pulsing" : ""
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedChapterId(null);
                      setSelectedHotspotId(hotspot.id);
                    }}
                    onKeyDown={handleHotspotKeyDown}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      width: `${hotspot.width}%`,
                      height: `${hotspot.height}%`,
                      backgroundColor: hotspot.style.color,
                      borderColor: hotspot.style.color,
                      opacity: clampPercent(hotspot.style.opacity, 0, 1)
                    }}
                    aria-label={hotspot.tooltipText ?? "Hotspot"}
                  >
                    <span aria-hidden="true">•</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <CaptureEntryPanel
              copy={captureModeCopy[captureMode]}
              captureError={captureError}
              captureStatus={captureStatus}
              fileInputRef={fileInputRef}
              onFileChange={handleCaptureFile}
              onOpenFilePicker={() => fileInputRef.current?.click()}
              readOnly={readOnly}
              captureMode={captureMode}
            />
          )}
          {selectedStep && !readOnly ? (
            <CaptureEntryPanel
              compact
              copy={captureModeCopy[captureMode]}
              captureError={captureError}
              captureStatus={captureStatus}
              fileInputRef={fileInputRef}
              onFileChange={handleCaptureFile}
              onOpenFilePicker={() => fileInputRef.current?.click()}
              readOnly={readOnly}
              captureMode={captureMode}
            />
          ) : null}
        </main>

        <aside className="editor-inspector" aria-label="Context Inspector">
          <div className="editor-panel-heading">
            <div>
              <span className="editor-kicker">Inspector</span>
              <strong>
                {selectedHotspot
                  ? "Hotspot properties"
                  : selectedChapter
                    ? "Chapter properties"
                    : selectedStep
                      ? "Step properties"
                      : "Demo settings"}
              </strong>
            </div>
          </div>
          {selectedChapter ? (
            <div className="editor-inspector-stack">
              <ChapterEditor
                chapter={selectedChapter}
                steps={document.steps}
                readOnly={readOnly}
                onChangeChapter={handleUpdateChapter}
              />
              {!readOnly ? (
                <button
                  type="button"
                  className="editor-button editor-button-danger editor-wide-button"
                  onClick={handleDeleteChapter}
                >
                  Delete chapter
                </button>
              ) : null}
            </div>
          ) : selectedHotspot ? (
            <div className="editor-inspector-stack">
              <label className="editor-field">
                <span>Tooltip text</span>
                <input
                  type="text"
                  value={selectedHotspot.tooltipText ?? ""}
                  disabled={readOnly}
                  maxLength={160}
                  onChange={(event) =>
                    updateSelectedHotspot({ tooltipText: event.currentTarget.value })
                  }
                />
              </label>
              <label className="editor-field">
                <span>Destination</span>
                <select
                  value={
                    selectedHotspot.actionType === "open_url"
                      ? URL_DESTINATION_OPTION
                      : (selectedHotspot.targetStepId ?? "")
                  }
                  disabled={readOnly}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    if (value === URL_DESTINATION_OPTION) {
                      updateSelectedHotspot({
                        actionType: "open_url",
                        targetStepId: null,
                        url: validateSafeUrl(hotspotUrlDraft)
                      });
                      return;
                    }
                    updateSelectedHotspot({
                      actionType: value ? "goto_step" : "next_step",
                      targetStepId: value || null,
                      url: null
                    });
                  }}
                >
                  <option value="">Next step (linear)</option>
                  {document.steps
                    .filter((step) => step.id !== selectedStep?.id)
                    .map((step) => (
                      <option key={step.id} value={step.id}>
                        {step.title}
                      </option>
                    ))}
                  <option value={URL_DESTINATION_OPTION}>Open URL</option>
                </select>
              </label>
              {selectedHotspot.actionType === "open_url" ? (
                <label className="editor-field">
                  <span>Destination URL</span>
                  <input
                    type="url"
                    inputMode="url"
                    value={hotspotUrlDraft}
                    maxLength={2048}
                    placeholder="https://example.com/next-step"
                    aria-invalid={Boolean(hotspotUrlDraft && !validateSafeUrl(hotspotUrlDraft))}
                    onChange={(event) => {
                      const value = event.currentTarget.value.slice(0, 2048);
                      setHotspotUrlDraft(value);
                      updateSelectedHotspot({
                        actionType: "open_url",
                        targetStepId: null,
                        url: validateSafeUrl(value)
                      });
                    }}
                  />
                  <small className="editor-url-help">
                    Use an HTTPS link or a relative path. Unsafe URL schemes are blocked.
                  </small>
                </label>
              ) : null}
              <div className="editor-field-grid">
                {(["x", "y", "width", "height"] as const).map((field) => (
                  <label className="editor-field" key={field}>
                    <span>{field === "x" || field === "y" ? field.toUpperCase() : field}</span>
                    <input
                      type="number"
                      min={field === "width" || field === "height" ? 5 : 0}
                      max={100}
                      step={1}
                      value={selectedHotspot[field]}
                      disabled={readOnly}
                      onChange={(event) => {
                        const value = clampPercent(
                          Number(event.currentTarget.value),
                          field === "width" || field === "height" ? 5 : 0
                        );
                        if (field === "width" || field === "height") {
                          updateSelectedHotspot({
                            ...resizeHotspot(
                              selectedHotspot,
                              field === "width" ? value : selectedHotspot.width,
                              field === "height" ? value : selectedHotspot.height
                            )
                          });
                        } else {
                          updateSelectedHotspot({ [field]: value });
                        }
                      }}
                    />
                  </label>
                ))}
              </div>
              <label className="editor-field">
                <span>Color</span>
                <input
                  type="color"
                  value={selectedHotspot.style.color}
                  disabled={readOnly}
                  onChange={(event) =>
                    updateSelectedHotspot({
                      style: { ...selectedHotspot.style, color: event.currentTarget.value }
                    })
                  }
                />
              </label>
              <label className="editor-field">
                <span>Opacity</span>
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.1}
                  value={clampPercent(selectedHotspot.style.opacity, 0.2, 1)}
                  disabled={readOnly}
                  onChange={(event) =>
                    updateSelectedHotspot({
                      style: {
                        ...selectedHotspot.style,
                        opacity: clampPercent(Number(event.currentTarget.value), 0.2, 1)
                      }
                    })
                  }
                />
              </label>
              <label className="editor-checkbox-field">
                <input
                  type="checkbox"
                  checked={selectedHotspot.style.pulse}
                  disabled={readOnly}
                  onChange={(event) =>
                    updateSelectedHotspot({
                      style: { ...selectedHotspot.style, pulse: event.currentTarget.checked }
                    })
                  }
                />
                <span>Pulse hotspot</span>
              </label>
              <div className="editor-inspector-note">
                <span className="editor-note-dot" aria-hidden="true" />
                Use arrow keys on the selected hotspot to nudge it by 1%.
              </div>
              {!readOnly ? (
                <button
                  type="button"
                  className="editor-button editor-button-danger editor-wide-button"
                  onClick={handleDeleteHotspot}
                >
                  Delete hotspot
                </button>
              ) : null}
            </div>
          ) : selectedStep ? (
            <div className="editor-inspector-stack">
              <label className="editor-field">
                <span>Step title</span>
                <input
                  type="text"
                  value={selectedStep.title}
                  disabled={readOnly}
                  maxLength={120}
                  onChange={(event) =>
                    commitDocument({
                      ...document,
                      steps: document.steps.map((step) =>
                        step.id === selectedStep.id
                          ? { ...step, title: event.currentTarget.value }
                          : step
                      )
                    })
                  }
                />
              </label>
              <div className="editor-inspector-note">
                <span className="editor-note-dot" aria-hidden="true" />
                Keep the step focused on one viewer action.
              </div>
              <BackgroundSettings
                theme={document.settings.theme}
                readOnly={readOnly}
                onChange={(theme) =>
                  commitDocument({
                    ...document,
                    settings: { ...document.settings, theme }
                  })
                }
              />
              <VoiceoverSettings
                step={selectedStep}
                readOnly={readOnly}
                onChange={updateSelectedStep}
              />
              <AiTextSettings
                step={selectedStep}
                readOnly={readOnly}
                onChange={updateSelectedStep}
              />
              <AiTranslationsSettings
                document={document}
                readOnly={readOnly}
                onChange={commitDocument}
              />
              <section className="editor-branch-panel" aria-labelledby="editor-branch-title">
                <div className="editor-branch-heading">
                  <div>
                    <span className="editor-kicker">Chapter paths</span>
                    <strong id="editor-branch-title">Conditional branching</strong>
                  </div>
                  <span className="editor-branch-count">
                    {selectedStep.hotspots.length} path
                    {selectedStep.hotspots.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p>Give viewers multiple buttons to choose a relevant path inside this demo.</p>
                {selectedStep.hotspots.length > 0 ? (
                  <div className="editor-branch-list" aria-label="Branch choices">
                    {selectedStep.hotspots.map((hotspot, index) => {
                      const target = document.steps.find(
                        (step) => step.id === hotspot.targetStepId
                      );
                      const destination =
                        hotspot.actionType === "open_url"
                          ? hotspot.url || "External URL"
                          : (target?.title ?? "Next step (linear)");
                      return (
                        <button
                          key={hotspot.id}
                          type="button"
                          className="editor-branch-choice"
                          onClick={() => setSelectedHotspotId(hotspot.id)}
                        >
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <strong>{hotspot.tooltipText || "Untitled path"}</strong>
                          <small>{destination}</small>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <small className="editor-branch-empty">
                    No choices yet. The viewer will follow the linear path.
                  </small>
                )}
                {branchSummary.diagnostics.length > 0 ? (
                  <p className="editor-branch-warning" role="status">
                    {branchSummary.diagnostics.length} path issue
                    {branchSummary.diagnostics.length === 1 ? "" : "s"} to review before publishing.
                  </p>
                ) : null}
                {!readOnly ? (
                  <button
                    type="button"
                    className="editor-small-button editor-branch-add"
                    onClick={handleAddBranchChoice}
                  >
                    + Add branch choice
                  </button>
                ) : null}
              </section>
              {!readOnly ? (
                <>
                  <button
                    type="button"
                    className="editor-button editor-button-primary editor-wide-button"
                    onClick={handleAddHotspot}
                  >
                    + Add hotspot
                  </button>
                  <div className="editor-step-actions" aria-label="Step actions">
                    <button
                      type="button"
                      className="editor-small-button"
                      onClick={() => handleMoveStep("up")}
                      disabled={
                        document.steps.findIndex((step) => step.id === selectedStep.id) === 0
                      }
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      className="editor-small-button"
                      onClick={() => handleMoveStep("down")}
                      disabled={
                        document.steps.findIndex((step) => step.id === selectedStep.id) ===
                        document.steps.length - 1
                      }
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      className="editor-small-button"
                      onClick={handleDuplicateStep}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="editor-small-button editor-button-danger"
                      onClick={handleDeleteStep}
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="editor-inspector-stack">
              <BackgroundSettings
                theme={document.settings.theme}
                readOnly={readOnly}
                onChange={(theme) =>
                  commitDocument({
                    ...document,
                    settings: { ...document.settings, theme }
                  })
                }
              />
              <PersonalizationSettings
                personalization={document.settings.personalization}
                readOnly={readOnly}
                onChange={(personalization) =>
                  commitDocument({
                    ...document,
                    settings: { ...document.settings, personalization }
                  })
                }
              />
              <p className="editor-empty-state">
                Select a step, chapter, or hotspot to edit its properties.
              </p>
            </div>
          )}
        </aside>
      </div>
      <SharePanel
        open={shareOpen}
        initialTab={shareInitialTab}
        demoId={demoId}
        demoDocument={document}
        readOnly={readOnly}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
