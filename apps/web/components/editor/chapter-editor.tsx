"use client";

import {
  validateSafeUrl,
  type ChapterButton,
  type ChapterType,
  type DemoChapter,
  type DemoStep
} from "@supademo/domain";
import { useEffect, useState } from "react";

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
  { value: "gate", label: "Gate" },
  { value: "survey", label: "Survey" },
  { value: "quiz", label: "Quiz" },
  { value: "outro", label: "Outro" }
];

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
          onChange={(event) =>
            onChangeChapter({ ...chapter, type: event.currentTarget.value as ChapterType })
          }
        >
          {chapterTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

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
