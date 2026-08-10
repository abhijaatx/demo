"use client";

import {
  createDemoFormSchema,
  createFormField,
  FORM_FIELD_LIMIT,
  generateAiVoiceover,
  getAvailableTtsVoices,
  hashChapterPassword,
  normalizeEmailDomainList,
  parseChapterPasswordProtection,
  parseDemoAudioNarration,
  sanitizeEmbedUrl,
  validateSafeUrl,
  type ChapterButton,
  type ChapterLayout,
  type ChapterPasswordProtection,
  type ChapterTheme,
  type ChapterType,
  type DemoAudioNarration,
  type DemoChapter,
  type DemoFormSchema,
  type DemoStep,
  type FormField,
  type FormFieldType,
  type FormLayout,
  type FormTheme
} from "@supademo/domain";
import { useEffect, useState, type ChangeEvent } from "react";

export interface ChapterEditorProps {
  chapter: DemoChapter;
  steps: readonly DemoStep[];
  readOnly?: boolean;
  onChangeChapter: (updated: DemoChapter) => void;
}

const chapterTypes: readonly { value: ChapterType; label: string }[] = [
  { value: "intro", label: "Intro" },
  { value: "context", label: "Context" },
  { value: "instruction", label: "Instruction" },
  { value: "cta", label: "Call to action" },
  { value: "gate", label: "Password protected" },
  { value: "survey", label: "Survey" },
  { value: "quiz", label: "Quiz" },
  { value: "form", label: "Forms" },
  { value: "embed", label: "Embed" },
  { value: "outro", label: "Outro" }
];

function createDefaultForm(chapterId: string): DemoFormSchema {
  return createDemoFormSchema(
    `${chapterId}-form`,
    "Tell us about yourself",
    [
      createFormField("email", "Work email", "email", true),
      createFormField("name", "Name", "text", true),
      createFormField("company", "Company", "text")
    ],
    { allowSkip: false, allowNonBusinessEmails: false, layout: "center", theme: "light" }
  );
}

/**
 * Chapter visual settings (layout, theme, custom color, opacity, blur). For
 * form chapters the controls bind to the chapter's form appearance so the
 * existing viewer form rendering and legacy form appearance controls stay in
 * sync; for every other chapter type they bind to the chapter itself.
 */
function ChapterAppearanceSettings({
  layout,
  theme,
  backgroundColor,
  opacity,
  blurPx,
  readOnly,
  onChange
}: {
  layout: ChapterLayout;
  theme: ChapterTheme;
  backgroundColor: string | null;
  opacity: number;
  blurPx: number;
  readOnly: boolean;
  onChange: (patch: Partial<DemoChapter>) => void;
}) {
  return (
    <details className="chapter-form-appearance" aria-label="Chapter appearance settings">
      <summary>Chapter appearance</summary>
      <label className="editor-field">
        <span>Layout</span>
        <select
          value={layout}
          disabled={readOnly}
          onChange={(event) => onChange({ layout: event.currentTarget.value as ChapterLayout })}
        >
          <option value="left">Left aligned</option>
          <option value="center">Center aligned</option>
          <option value="right">Right aligned</option>
        </select>
      </label>
      <label className="editor-field">
        <span>Theme</span>
        <select
          value={theme}
          disabled={readOnly}
          onChange={(event) => onChange({ theme: event.currentTarget.value as ChapterTheme })}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      <label className="editor-field">
        <span>Background color</span>
        <input
          type="color"
          value={backgroundColor ?? "#ffffff"}
          disabled={readOnly}
          onChange={(event) => onChange({ backgroundColor: event.currentTarget.value })}
        />
        <small className="editor-url-help">Used with the Custom theme.</small>
      </label>
      <label className="editor-field">
        <span>Background opacity: {Math.round(opacity * 100)}%</span>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={opacity}
          disabled={readOnly}
          onChange={(event) => onChange({ opacity: Number(event.currentTarget.value) })}
        />
      </label>
      <label className="editor-field">
        <span>Background blur: {blurPx}px</span>
        <input
          type="range"
          min={0}
          max={24}
          step={1}
          value={blurPx}
          disabled={readOnly}
          onChange={(event) => onChange({ blurPx: Number(event.currentTarget.value) })}
        />
      </label>
    </details>
  );
}

function updateFormField(
  form: DemoFormSchema,
  fieldId: string,
  patch: Partial<FormField>
): DemoFormSchema {
  return {
    ...form,
    fields: form.fields.map((field) => (field.id === fieldId ? { ...field, ...patch } : field))
  };
}

/**
 * Chapter voiceover editor. Mirrors the step voiceover flow (AI generation,
 * voice picker, local upload with the 25 MB limit) but persists to the
 * chapter's voiceover field with explicit Save/Remove semantics. Chapter
 * voiceovers never autoplay on page load; the viewer only allows autoplay
 * after the viewer's first interaction.
 */
function ChapterVoiceoverSettings({
  chapter,
  readOnly,
  onChangeChapter
}: {
  chapter: DemoChapter;
  readOnly: boolean;
  onChangeChapter: (updated: DemoChapter) => void;
}) {
  const voiceover = chapter.voiceover;
  const [script, setScript] = useState(voiceover?.transcriptText ?? "");
  const [voiceId, setVoiceId] = useState(voiceover?.voiceId ?? "en-US-1");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setScript(chapter.voiceover?.transcriptText ?? "");
    setVoiceId(chapter.voiceover?.voiceId ?? "en-US-1");
    setStatus("");
  }, [chapter.id]);

  const baseVoiceover = (): DemoAudioNarration =>
    voiceover ?? {
      assetId: `${chapter.id}-voiceover`,
      durationSeconds: 0,
      autoPlay: false,
      source: "manual",
      voiceId,
      audioUrl: null,
      transcriptText: script,
      expressive: false,
      speed: 1,
      stability: 0.5
    };

  const updateVoiceover = (patch: Partial<DemoAudioNarration>): void => {
    onChangeChapter({
      ...chapter,
      voiceover: parseDemoAudioNarration({ ...baseVoiceover(), ...patch })
    });
  };

  const saveScript = (): void => {
    const boundedScript = script.trim().slice(0, 4_000);
    if (!boundedScript) {
      setStatus("Add narration text before saving.");
      return;
    }
    updateVoiceover({ transcriptText: boundedScript });
    setStatus("Chapter voiceover saved.");
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
      updateVoiceover({
        assetId: job.jobId,
        audioUrl: job.audioAssetUrl,
        transcriptText: job.text,
        voiceId: job.voiceId,
        source: "ai",
        autoPlay: false
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
    updateVoiceover({
      assetId: `upload-${Date.now()}`,
      audioUrl,
      source: "upload",
      transcriptText: script
    });
    setStatus("Audio uploaded locally. Publish after reviewing the preview.");
  };

  return (
    <section className="editor-voiceover-panel" aria-labelledby="chapter-voiceover-title">
      <div className="editor-branch-heading">
        <div>
          <span className="editor-kicker">Voiceover</span>
          <strong id="chapter-voiceover-title">Narrate this chapter</strong>
        </div>
        {voiceover ? (
          <button
            type="button"
            className="editor-text-button editor-button-danger-text"
            disabled={readOnly}
            onClick={() => onChangeChapter({ ...chapter, voiceover: null })}
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
          placeholder="Describe what the viewer should learn from this chapter."
          onChange={(event) => setScript(event.currentTarget.value.slice(0, 4_000))}
        />
      </label>
      <div className="editor-voiceover-actions">
        <button
          type="button"
          className="editor-button editor-button-primary"
          disabled={readOnly || !script.trim()}
          onClick={saveScript}
        >
          Save
        </button>
        <label className="editor-small-button editor-file-button">
          Upload voice
          <input
            type="file"
            accept="audio/*"
            disabled={readOnly}
            onChange={handleUpload}
            aria-label="Upload chapter voice audio"
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
            updateVoiceover({ voiceId: value, source: "ai" });
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
      {voiceover ? (
        <>
          <label className="editor-checkbox-field">
            <input
              type="checkbox"
              checked={Boolean(voiceover.autoPlay)}
              disabled={readOnly}
              onChange={(event) => updateVoiceover({ autoPlay: event.currentTarget.checked })}
            />
            <span>Play automatically after the viewer starts</span>
          </label>
          {voiceover.audioUrl &&
          (voiceover.audioUrl.startsWith("blob:") || validateSafeUrl(voiceover.audioUrl)) ? (
            <audio className="editor-voiceover-preview" controls src={voiceover.audioUrl} />
          ) : null}
        </>
      ) : null}
      <small className="editor-url-help">
        Chapter voiceovers never autoplay on page load. With autoplay enabled they start after the
        viewer&apos;s first action.
      </small>
      {status ? (
        <p className="editor-inspector-note" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}

function FormChapterSettings({
  form,
  readOnly,
  onChange
}: {
  form: DemoFormSchema;
  readOnly: boolean;
  onChange: (form: DemoFormSchema) => void;
}) {
  const [backgroundImageDraft, setBackgroundImageDraft] = useState(form.backgroundImageUrl ?? "");
  const [allowedDomainsDraft, setAllowedDomainsDraft] = useState(
    form.allowedEmailDomains.join(", ")
  );
  const [blockedDomainsDraft, setBlockedDomainsDraft] = useState(
    form.blockedEmailDomains.join(", ")
  );

  useEffect(() => {
    setBackgroundImageDraft(form.backgroundImageUrl ?? "");
    setAllowedDomainsDraft(form.allowedEmailDomains.join(", "));
    setBlockedDomainsDraft(form.blockedEmailDomains.join(", "));
  }, [form.formId]);

  const addField = (): void => {
    if (readOnly || form.fields.length >= FORM_FIELD_LIMIT) return;
    const fieldNumber = form.fields.length + 1;
    const field = createFormField(`field-${fieldNumber}`, `New field ${fieldNumber}`);
    onChange({ ...form, fields: [...form.fields, field] });
  };

  const removeField = (fieldId: string): void => {
    if (readOnly) return;
    onChange({ ...form, fields: form.fields.filter((field) => field.id !== fieldId) });
  };

  return (
    <section className="chapter-form-editor" aria-labelledby="chapter-form-settings-title">
      <div className="chapter-editor-section-heading">
        <div>
          <span className="editor-kicker">Native lead capture</span>
          <strong id="chapter-form-settings-title">Form fields</strong>
        </div>
        {!readOnly ? (
          <button
            type="button"
            className="editor-small-button"
            onClick={addField}
            disabled={form.fields.length >= FORM_FIELD_LIMIT}
          >
            + Add field
          </button>
        ) : null}
      </div>

      <label className="editor-field">
        <span>Form title</span>
        <input
          type="text"
          value={form.title}
          maxLength={160}
          disabled={readOnly}
          onChange={(event) =>
            onChange({ ...form, title: event.currentTarget.value.slice(0, 160) })
          }
        />
      </label>

      <div className="chapter-form-field-list">
        {form.fields.map((field, index) => (
          <div className="chapter-form-field-card" key={field.id}>
            <div className="chapter-editor-button-card-heading">
              <span>Field {index + 1}</span>
              {!readOnly ? (
                <button
                  type="button"
                  className="editor-text-button editor-button-danger-text"
                  onClick={() => removeField(field.id)}
                >
                  Remove
                </button>
              ) : null}
            </div>
            <label className="editor-field">
              <span>Label</span>
              <input
                type="text"
                value={field.label}
                maxLength={160}
                disabled={readOnly}
                onChange={(event) =>
                  onChange(
                    updateFormField(form, field.id, {
                      label: event.currentTarget.value.slice(0, 160)
                    })
                  )
                }
              />
            </label>
            <label className="editor-field">
              <span>Field type</span>
              <select
                value={field.fieldType}
                disabled={readOnly}
                onChange={(event) => {
                  const fieldType = event.currentTarget.value as FormFieldType;
                  onChange(
                    updateFormField(form, field.id, {
                      fieldType,
                      options: ["select", "radio"].includes(fieldType)
                        ? field.options.length > 0
                          ? field.options
                          : ["Option 1", "Option 2"]
                        : []
                    })
                  );
                }}
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="select">Dropdown</option>
                <option value="radio">Radio options</option>
                <option value="checkbox">Checkbox</option>
              </select>
            </label>
            <label className="chapter-form-checkbox">
              <input
                type="checkbox"
                checked={field.isRequired}
                disabled={readOnly}
                onChange={(event) =>
                  onChange(
                    updateFormField(form, field.id, { isRequired: event.currentTarget.checked })
                  )
                }
              />
              <span>Required</span>
            </label>
            {["select", "radio"].includes(field.fieldType) ? (
              <label className="editor-field">
                <span>Options (one per line)</span>
                <textarea
                  rows={3}
                  maxLength={2_400}
                  value={field.options.join("\n")}
                  disabled={readOnly}
                  onChange={(event) =>
                    onChange(
                      updateFormField(form, field.id, {
                        options: event.currentTarget.value
                          .split("\n")
                          .map((value) => value.trim().slice(0, 120))
                          .filter(Boolean)
                          .slice(0, 20)
                      })
                    )
                  }
                />
              </label>
            ) : null}
          </div>
        ))}
      </div>
      <small className="editor-url-help">Up to {FORM_FIELD_LIMIT} fields per form.</small>

      <div className="chapter-form-options">
        <label className="chapter-form-checkbox">
          <input
            type="checkbox"
            checked={form.allowSkip}
            disabled={readOnly}
            onChange={(event) => onChange({ ...form, allowSkip: event.currentTarget.checked })}
          />
          <span>Let viewers skip the form</span>
        </label>
        <label className="chapter-form-checkbox">
          <input
            type="checkbox"
            checked={form.allowNonBusinessEmails}
            disabled={readOnly}
            onChange={(event) =>
              onChange({ ...form, allowNonBusinessEmails: event.currentTarget.checked })
            }
          />
          <span>Allow non-business emails</span>
        </label>
      </div>

      <label className="editor-field">
        <span>
          Allowed email domains <small>(optional, comma-separated)</small>
        </span>
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={allowedDomainsDraft}
          maxLength={2_000}
          disabled={readOnly}
          aria-describedby="chapter-form-allowed-domains-help"
          placeholder="acme.com, acmecorp.io"
          onBlur={() => setAllowedDomainsDraft(form.allowedEmailDomains.join(", "))}
          onChange={(event) => {
            const value = event.currentTarget.value.slice(0, 2_000);
            setAllowedDomainsDraft(value);
            onChange({ ...form, allowedEmailDomains: normalizeEmailDomainList(value) });
          }}
        />
        <small id="chapter-form-allowed-domains-help" className="editor-url-help">
          When set, viewers must submit an email from one of these domains. Unsafe or malformed
          entries are removed automatically.
        </small>
      </label>
      <label className="editor-field">
        <span>
          Blocked email domains <small>(optional, comma-separated)</small>
        </span>
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={blockedDomainsDraft}
          maxLength={2_000}
          disabled={readOnly}
          aria-describedby="chapter-form-blocked-domains-help"
          placeholder="competitor.com, disposable-mail.com"
          onBlur={() => setBlockedDomainsDraft(form.blockedEmailDomains.join(", "))}
          onChange={(event) => {
            const value = event.currentTarget.value.slice(0, 2_000);
            setBlockedDomainsDraft(value);
            onChange({ ...form, blockedEmailDomains: normalizeEmailDomainList(value) });
          }}
        />
        <small id="chapter-form-blocked-domains-help" className="editor-url-help">
          Submissions from these domains are rejected. Blocked domains take precedence over the
          allowed list.
        </small>
      </label>

      <details className="chapter-form-appearance">
        <summary>Appearance</summary>
        <label className="editor-field">
          <span>Layout</span>
          <select
            value={form.layout}
            disabled={readOnly}
            onChange={(event) =>
              onChange({ ...form, layout: event.currentTarget.value as FormLayout })
            }
          >
            <option value="left">Left aligned</option>
            <option value="center">Center aligned</option>
            <option value="right">Right aligned</option>
          </select>
        </label>
        <label className="editor-field">
          <span>Theme</span>
          <select
            value={form.theme}
            disabled={readOnly}
            onChange={(event) =>
              onChange({ ...form, theme: event.currentTarget.value as FormTheme })
            }
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="editor-field">
          <span>Background color</span>
          <input
            type="color"
            value={form.backgroundColor ?? "#ffffff"}
            disabled={readOnly}
            onChange={(event) => onChange({ ...form, backgroundColor: event.currentTarget.value })}
          />
        </label>
        <label className="editor-field">
          <span>
            Background image URL <small>(optional)</small>
          </span>
          <input
            type="url"
            inputMode="url"
            value={backgroundImageDraft}
            maxLength={2_048}
            disabled={readOnly}
            aria-invalid={Boolean(backgroundImageDraft && !validateSafeUrl(backgroundImageDraft))}
            placeholder="https://cdn.example.com/form-background.png"
            onChange={(event) => {
              const value = event.currentTarget.value.slice(0, 2_048);
              setBackgroundImageDraft(value);
              onChange({
                ...form,
                backgroundImageUrl: value.startsWith("blob:") ? value : validateSafeUrl(value)
              });
            }}
          />
        </label>
        <label className="editor-field">
          <span>Background opacity: {Math.round(form.opacity * 100)}%</span>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={form.opacity}
            disabled={readOnly}
            onChange={(event) => onChange({ ...form, opacity: Number(event.currentTarget.value) })}
          />
        </label>
        <label className="editor-field">
          <span>Background blur: {form.blurPx}px</span>
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={form.blurPx}
            disabled={readOnly}
            onChange={(event) => onChange({ ...form, blurPx: Number(event.currentTarget.value) })}
          />
        </label>
      </details>
    </section>
  );
}

/**
 * Password-protect settings for gate chapters. The plaintext password exists
 * only in local component state and is converted to a one-way hash before it
 * is ever written to the chapter — it is never persisted, logged, rendered,
 * or placed in a URL.
 */
function ChapterGateSettings({
  chapter,
  readOnly,
  onChangeChapter
}: {
  chapter: DemoChapter;
  readOnly: boolean;
  onChangeChapter: (updated: DemoChapter) => void;
}) {
  const protection = chapter.passwordProtection;
  const [passwordDraft, setPasswordDraft] = useState("");
  const [buttonTextDraft, setButtonTextDraft] = useState(protection?.buttonText ?? "Unlock");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setButtonTextDraft(protection?.buttonText ?? "Unlock");
    setPasswordDraft("");
    setStatus("");
  }, [chapter.id]);

  const patchProtection = (patch: Partial<ChapterPasswordProtection>): void => {
    const base: ChapterPasswordProtection = protection ?? {
      passwordHash: null,
      buttonText: "Unlock",
      backgroundColor: null,
      textColor: null
    };
    onChangeChapter({
      ...chapter,
      passwordProtection: parseChapterPasswordProtection({ ...base, ...patch })
    });
  };

  const savePassword = async (): Promise<void> => {
    if (readOnly || saving) return;
    const boundedPassword = passwordDraft.trim().slice(0, 128);
    if (!boundedPassword) {
      setStatus("Enter a password before saving.");
      return;
    }
    setSaving(true);
    setStatus("Hashing password…");
    try {
      const passwordHash = await hashChapterPassword(boundedPassword);
      patchProtection({
        passwordHash,
        buttonText: buttonTextDraft.trim().slice(0, 96) || "Unlock"
      });
      setPasswordDraft("");
      setStatus("Password protection saved.");
    } catch {
      setStatus("Could not save password protection. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="chapter-form-editor" aria-labelledby="chapter-gate-settings-title">
      <div className="chapter-editor-section-heading">
        <div>
          <span className="editor-kicker">Password protected</span>
          <strong id="chapter-gate-settings-title">Password settings</strong>
        </div>
        {protection && !readOnly ? (
          <button
            type="button"
            className="editor-text-button editor-button-danger-text"
            onClick={() => {
              setPasswordDraft("");
              onChangeChapter({ ...chapter, passwordProtection: null });
            }}
          >
            Remove protection
          </button>
        ) : null}
      </div>
      <label className="editor-field">
        <span>Password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={passwordDraft}
          maxLength={128}
          disabled={readOnly}
          placeholder={protection ? "Change password (leave blank to keep)" : "Set a password"}
          onChange={(event) => setPasswordDraft(event.currentTarget.value.slice(0, 128))}
        />
        <small className="editor-url-help">
          Stored as a one-way hash only — the password is never saved, shown, or sent in plaintext.
        </small>
      </label>{" "}
      {protection ? (
        <>
          <label className="editor-field">
            <span>Button text</span>
            <input
              type="text"
              value={buttonTextDraft}
              maxLength={96}
              disabled={readOnly}
              onChange={(event) => {
                const value = event.currentTarget.value.slice(0, 96);
                setButtonTextDraft(value);
                patchProtection({ buttonText: value || "Unlock" });
              }}
            />
          </label>
          <div className="chapter-form-options">
            <label className="editor-field">
              <span>Background color</span>
              <input
                type="color"
                value={protection?.backgroundColor ?? "#4d56e8"}
                disabled={readOnly}
                onChange={(event) =>
                  patchProtection({ backgroundColor: event.currentTarget.value })
                }
              />
            </label>
            <label className="editor-field">
              <span>Text color</span>
              <input
                type="color"
                value={protection?.textColor ?? "#ffffff"}
                disabled={readOnly}
                onChange={(event) => patchProtection({ textColor: event.currentTarget.value })}
              />
            </label>
          </div>
        </>
      ) : null}
      <div className="editor-voiceover-actions">
        <button
          type="button"
          className="editor-button editor-button-primary"
          disabled={readOnly || saving || !passwordDraft.trim()}
          onClick={() => void savePassword()}
        >
          {saving ? "Saving…" : "Save password"}
        </button>
      </div>
      {status ? (
        <p className="editor-inspector-note" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Embed settings for embed chapters (forms, surveys, and calendars). The
 * editor accepts a URL (never arbitrary HTML): Go loads a preview of the
 * normalized validated URL only, and Save persists only that validated URL.
 * Invalid or unsafe input is never persisted or loaded, and the plaintext
 * draft exists only in local component state.
 */
function ChapterEmbedSettings({
  chapter,
  readOnly,
  onChangeChapter
}: {
  chapter: DemoChapter;
  readOnly: boolean;
  onChangeChapter: (updated: DemoChapter) => void;
}) {
  const [embedUrlDraft, setEmbedUrlDraft] = useState(chapter.embedUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(chapter.embedUrl);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setEmbedUrlDraft(chapter.embedUrl ?? "");
    setPreviewUrl(chapter.embedUrl);
    setStatus("");
  }, [chapter.id]);

  const handleGo = (): void => {
    if (readOnly) return;
    const safeUrl = sanitizeEmbedUrl(embedUrlDraft);
    if (!safeUrl) {
      setPreviewUrl(null);
      setStatus("Enter a valid public HTTPS embed URL to preview.");
      return;
    }
    setPreviewUrl(safeUrl);
    setStatus("Preview loaded. Click Save to apply this embed to the chapter.");
  };

  const handleSave = (): void => {
    if (readOnly) return;
    const safeUrl = sanitizeEmbedUrl(embedUrlDraft);
    if (!safeUrl) {
      setStatus("Enter a valid public HTTPS embed URL before saving.");
      return;
    }
    setPreviewUrl(safeUrl);
    onChangeChapter({ ...chapter, embedUrl: safeUrl });
    setStatus("Embed saved.");
  };

  return (
    <section className="chapter-form-editor" aria-labelledby="chapter-embed-settings-title">
      <div className="chapter-editor-section-heading">
        <div>
          <span className="editor-kicker">Embed forms, surveys, and calendars</span>
          <strong id="chapter-embed-settings-title">Embed URL</strong>
        </div>
        {chapter.embedUrl && !readOnly ? (
          <button
            type="button"
            className="editor-text-button editor-button-danger-text"
            onClick={() => {
              setEmbedUrlDraft("");
              setPreviewUrl(null);
              onChangeChapter({ ...chapter, embedUrl: null });
            }}
          >
            Remove embed
          </button>
        ) : null}
      </div>
      <label className="editor-field">
        <span>Embed URL</span>
        <input
          type="url"
          inputMode="url"
          value={embedUrlDraft}
          maxLength={2_048}
          disabled={readOnly}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(embedUrlDraft && !sanitizeEmbedUrl(embedUrlDraft))}
          placeholder="https://tally.so/r/example, https://calendly.com/team/meeting"
          onChange={(event) => {
            setEmbedUrlDraft(event.currentTarget.value.slice(0, 2_048));
            if (status) setStatus("");
          }}
        />
        <small className="editor-url-help">
          Paste the public embed or share link from Tally, Typeform, Google Forms, HubSpot, Jotform,
          Calendly, Cal.com, SurveyMonkey, Qualtrics, or similar. Only public HTTPS URLs are
          accepted.
        </small>
      </label>
      <div className="editor-voiceover-actions">
        <button
          type="button"
          className="editor-button editor-button-secondary"
          disabled={readOnly || !embedUrlDraft.trim()}
          onClick={handleGo}
        >
          Go
        </button>
        <button
          type="button"
          className="editor-button editor-button-primary"
          disabled={readOnly}
          onClick={handleSave}
        >
          Save
        </button>
      </div>
      {status ? (
        <p className="editor-inspector-note" role="status">
          {status}
        </p>
      ) : null}
      {previewUrl ? (
        <div className="chapter-embed-preview">
          <span className="editor-kicker">Preview</span>
          <iframe
            title="Embed preview"
            src={previewUrl}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-forms"
          />
        </div>
      ) : null}
    </section>
  );
}

function updateButton(
  chapter: DemoChapter,
  buttonId: string,
  patch: Partial<ChapterButton>
): DemoChapter {
  return {
    ...chapter,
    buttons: chapter.buttons.map((button) =>
      button.id === buttonId ? { ...button, ...patch } : button
    )
  };
}

export function ChapterEditor({
  chapter,
  steps,
  readOnly = false,
  onChangeChapter
}: ChapterEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({});
  const [mediaUrlDraft, setMediaUrlDraft] = useState(chapter.mediaUrl ?? "");

  useEffect(() => {
    setUrlDrafts((current) => {
      const next = { ...current };
      for (const button of chapter.buttons) {
        if (!(button.id in next)) next[button.id] = button.url ?? "";
      }
      return next;
    });
  }, [chapter.buttons]);

  useEffect(() => {
    setMediaUrlDraft(chapter.mediaUrl ?? "");
  }, [chapter.id]);

  const form = chapter.form ?? createDefaultForm(chapter.id);

  const handleChapterTypeChange = (type: ChapterType): void => {
    onChangeChapter({
      ...chapter,
      type,
      form: type === "form" ? (chapter.form ?? createDefaultForm(chapter.id)) : chapter.form,
      // A gate only applies to the Password protected chapter type; switching
      // away clears it so a dormant hash cannot gate a different chapter.
      passwordProtection: type === "gate" ? chapter.passwordProtection : null,
      // An embed URL only applies to embed chapters; switching away clears it
      // so a saved embed can never leak onto another chapter type.
      embedUrl: type === "embed" ? chapter.embedUrl : null
    });
  };

  const addButton = (): void => {
    if (readOnly || chapter.buttons.length >= 12) return;
    const button: ChapterButton = {
      id: `chapter-button-${Date.now().toString(36)}`,
      label: "Continue",
      actionType: "next",
      targetStepId: null,
      url: null
    };
    onChangeChapter({ ...chapter, buttons: [...chapter.buttons, button] });
  };

  const removeButton = (buttonId: string): void => {
    if (readOnly) return;
    onChangeChapter({
      ...chapter,
      buttons: chapter.buttons.filter((button) => button.id !== buttonId)
    });
  };

  return (
    <div className="chapter-editor" aria-label="Chapter Editor">
      <div className="chapter-editor-heading">
        <span className="editor-kicker">Chapter editor</span>
        <strong>{chapter.type === "cta" ? "Call to action" : "Context section"}</strong>
      </div>

      <label className="editor-field">
        <span>Placement</span>
        <select
          value={chapter.orderIndex}
          disabled={readOnly}
          onChange={(event) =>
            onChangeChapter({ ...chapter, orderIndex: Number(event.currentTarget.value) })
          }
        >
          <option value={0}>Beginning of demo</option>
          {steps.map((step, index) => (
            <option key={`${step.id}-placement`} value={index}>
              Before step {index + 1}: {step.title}
            </option>
          ))}
          <option value={steps.length}>End of demo</option>
        </select>
      </label>

      <label className="editor-field">
        <span>Chapter type</span>
        <select
          value={chapter.type}
          disabled={readOnly}
          onChange={(event) => handleChapterTypeChange(event.currentTarget.value as ChapterType)}
        >
          {chapterTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      {chapter.type === "form" ? (
        <FormChapterSettings
          form={form}
          readOnly={readOnly}
          onChange={(nextForm) => onChangeChapter({ ...chapter, form: nextForm })}
        />
      ) : null}

      {chapter.type === "gate" ? (
        <ChapterGateSettings
          chapter={chapter}
          readOnly={readOnly}
          onChangeChapter={onChangeChapter}
        />
      ) : null}

      {chapter.type === "embed" ? (
        <ChapterEmbedSettings
          chapter={chapter}
          readOnly={readOnly}
          onChangeChapter={onChangeChapter}
        />
      ) : null}

      <ChapterAppearanceSettings
        layout={chapter.type === "form" ? form.layout : chapter.layout}
        theme={chapter.type === "form" ? form.theme : chapter.theme}
        backgroundColor={chapter.type === "form" ? form.backgroundColor : chapter.backgroundColor}
        opacity={chapter.type === "form" ? form.opacity : chapter.opacity}
        blurPx={chapter.type === "form" ? form.blurPx : chapter.blurPx}
        readOnly={readOnly}
        onChange={(patch) => {
          if (chapter.type === "form" && form) {
            onChangeChapter({ ...chapter, form: { ...form, ...patch } });
          } else {
            onChangeChapter({ ...chapter, ...patch });
          }
        }}
      />

      <label className="editor-field">
        <span>Title</span>
        <input
          type="text"
          value={chapter.title}
          disabled={readOnly}
          maxLength={160}
          onChange={(event) => onChangeChapter({ ...chapter, title: event.currentTarget.value })}
          placeholder="e.g. Welcome to the platform"
        />
      </label>

      <label className="editor-field">
        <span>Description</span>
        <textarea
          rows={4}
          value={chapter.bodyText ?? ""}
          disabled={readOnly}
          maxLength={4_000}
          onChange={(event) =>
            onChangeChapter({ ...chapter, bodyText: event.currentTarget.value || null })
          }
          placeholder="Give viewers context before they continue."
        />
      </label>

      <label className="editor-field">
        <span>
          Chapter image URL <small>(optional)</small>
        </span>
        <input
          type="url"
          inputMode="url"
          value={mediaUrlDraft}
          disabled={readOnly}
          maxLength={2_048}
          placeholder="https://cdn.example.com/context.png"
          aria-invalid={Boolean(mediaUrlDraft && !validateSafeUrl(mediaUrlDraft))}
          onChange={(event) => {
            const value = event.currentTarget.value.slice(0, 2_048);
            setMediaUrlDraft(value);
            onChangeChapter({
              ...chapter,
              mediaUrl: validateSafeUrl(value)
            });
          }}
        />
        <small className="editor-url-help">
          Use an HTTPS image URL. Unsafe schemes are blocked.
        </small>
      </label>

      <section className="chapter-editor-buttons" aria-labelledby="chapter-buttons-title">
        <div className="chapter-editor-section-heading">
          <div>
            <span className="editor-kicker">Viewer actions</span>
            <strong id="chapter-buttons-title">Call-to-action buttons</strong>
          </div>
          {!readOnly ? (
            <button
              type="button"
              className="editor-small-button"
              onClick={addButton}
              disabled={chapter.buttons.length >= 12}
            >
              + Button
            </button>
          ) : null}
        </div>
        {chapter.buttons.length === 0 ? (
          <p className="chapter-editor-empty">
            No buttons. The viewer can continue with the default control.
          </p>
        ) : (
          <div className="chapter-editor-button-list">
            {chapter.buttons.map((button, index) => {
              const urlDraft = urlDrafts[button.id] ?? button.url ?? "";
              const safeUrl = validateSafeUrl(urlDraft);
              return (
                <div className="chapter-editor-button-card" key={button.id}>
                  <div className="chapter-editor-button-card-heading">
                    <span>Button {index + 1}</span>
                    {!readOnly ? (
                      <button
                        type="button"
                        className="editor-text-button editor-button-danger-text"
                        onClick={() => removeButton(button.id)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <label className="editor-field">
                    <span>Label</span>
                    <input
                      type="text"
                      value={button.label}
                      disabled={readOnly}
                      maxLength={96}
                      onChange={(event) =>
                        onChangeChapter(
                          updateButton(chapter, button.id, { label: event.currentTarget.value })
                        )
                      }
                    />
                  </label>
                  <label className="editor-field">
                    <span>Action</span>
                    <select
                      value={button.actionType}
                      disabled={readOnly}
                      onChange={(event) => {
                        const actionType = event.currentTarget.value as ChapterButton["actionType"];
                        onChangeChapter(
                          updateButton(chapter, button.id, {
                            actionType,
                            targetStepId: actionType === "step" ? (steps[0]?.id ?? null) : null,
                            url: actionType === "url" ? validateSafeUrl(button.url) : null
                          })
                        );
                      }}
                    >
                      <option value="next">Continue to next step</option>
                      <option value="step">Go to a step</option>
                      <option value="url">Open URL</option>
                    </select>
                  </label>
                  {button.actionType === "step" ? (
                    <label className="editor-field">
                      <span>Destination step</span>
                      <select
                        value={button.targetStepId ?? ""}
                        disabled={readOnly || steps.length === 0}
                        onChange={(event) =>
                          onChangeChapter(
                            updateButton(chapter, button.id, {
                              targetStepId: event.currentTarget.value || null
                            })
                          )
                        }
                      >
                        {steps.length === 0 ? <option value="">Add a step first</option> : null}
                        {steps.map((step, stepIndex) => (
                          <option key={step.id} value={step.id}>
                            Step {stepIndex + 1}: {step.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {button.actionType === "url" ? (
                    <label className="editor-field">
                      <span>Destination URL</span>
                      <input
                        type="url"
                        inputMode="url"
                        value={urlDraft}
                        disabled={readOnly}
                        maxLength={2_048}
                        placeholder="https://example.com/next-step"
                        aria-invalid={Boolean(urlDraft && !safeUrl)}
                        onChange={(event) => {
                          const value = event.currentTarget.value.slice(0, 2_048);
                          setUrlDrafts((current) => ({ ...current, [button.id]: value }));
                          onChangeChapter(
                            updateButton(chapter, button.id, { url: validateSafeUrl(value) })
                          );
                        }}
                      />
                      <small className="editor-url-help">
                        HTTPS links and relative paths are allowed; unsafe schemes are blocked.
                      </small>
                    </label>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ChapterVoiceoverSettings
        chapter={chapter}
        readOnly={readOnly}
        onChangeChapter={onChangeChapter}
      />

      <div className="chapter-editor-advanced">
        <button
          type="button"
          className="editor-text-button"
          onClick={() => setShowAdvanced((current) => !current)}
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? "Hide presenter notes" : "Show presenter notes"}
        </button>
        {showAdvanced ? (
          <label className="editor-field">
            <span>Private presenter notes</span>
            <textarea
              rows={3}
              value={chapter.presenterNotes ?? ""}
              disabled={readOnly}
              maxLength={4_000}
              onChange={(event) =>
                onChangeChapter({
                  ...chapter,
                  presenterNotes: event.currentTarget.value || null
                })
              }
              placeholder="Visible to presenters only."
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
