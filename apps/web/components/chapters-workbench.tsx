"use client";

import { validateSafeUrl } from "@supademo/domain";
import { useMemo, useState } from "react";

type ChapterType = "intro" | "context" | "cta" | "form" | "outro";
type ChapterTheme = "light" | "dark" | "custom";
type ChapterLayout = "left" | "center" | "right";
type ButtonAction = "next" | "step" | "url";

type ChapterButton = {
  readonly id: string;
  readonly label: string;
  readonly action: ButtonAction;
  readonly targetStep: number | null;
  readonly url: string;
};

type Chapter = {
  readonly id: string;
  readonly type: ChapterType;
  readonly placement: number;
  readonly title: string;
  readonly body: string;
  readonly theme: ChapterTheme;
  readonly layout: ChapterLayout;
  readonly opacity: number;
  readonly blur: number;
  readonly buttons: readonly ChapterButton[];
};

const MAX_TITLE = 160;
const MAX_BODY = 800;
const MAX_BUTTONS = 12;
const DEMO_STEPS = [
  "Welcome to the workspace",
  "Explore the dashboard",
  "Review your analytics",
  "Share the finished demo"
];

const initialChapters: readonly Chapter[] = [
  {
    id: "chapter-intro",
    type: "intro",
    placement: 0,
    title: "Welcome to the workspace",
    body: "Start with a little context before the first step.",
    theme: "light",
    layout: "center",
    opacity: 0.96,
    blur: 0,
    buttons: [
      { id: "button-intro", label: "Get started", action: "next", targetStep: null, url: "" }
    ]
  },
  {
    id: "chapter-cta",
    type: "cta",
    placement: DEMO_STEPS.length,
    title: "Ready to see it in action?",
    body: "Give viewers a clear next step when they reach the end.",
    theme: "dark",
    layout: "center",
    opacity: 0.9,
    blur: 4,
    buttons: [
      {
        id: "button-cta",
        label: "Book a demo",
        action: "url",
        targetStep: null,
        url: "https://example.com/book-demo"
      }
    ]
  }
];

function makeId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}`;
}

function newChapter(type: ChapterType, placement: number): Chapter {
  return {
    id: makeId("chapter"),
    type,
    placement,
    title: type === "cta" ? "Continue your journey" : "Add context for viewers",
    body: "Explain why this step matters before the viewer continues.",
    theme: "light",
    layout: "center",
    opacity: 0.96,
    blur: 0,
    buttons: [
      { id: makeId("button"), label: "Continue", action: "next", targetStep: null, url: "" }
    ]
  };
}

export function ChaptersWorkbench() {
  const [chapters, setChapters] = useState<readonly Chapter[]>(initialChapters);
  const [selectedId, setSelectedId] = useState(initialChapters[0]!.id);
  const [message, setMessage] = useState(
    "Add an intro, context card, form, or CTA anywhere in the demo flow."
  );
  const [error, setError] = useState("");
  const selected = chapters.find((chapter) => chapter.id === selectedId) ?? chapters[0]!;

  const sorted = useMemo(() => [...chapters].sort((a, b) => a.placement - b.placement), [chapters]);
  const updateSelected = (patch: Partial<Chapter>): void => {
    setChapters((current) =>
      current.map((chapter) => (chapter.id === selected.id ? { ...chapter, ...patch } : chapter))
    );
    setMessage("Chapter changes are saved in this browser-local draft.");
    setError("");
  };

  const addChapter = (type: ChapterType, placement: number): void => {
    const chapter = newChapter(type, placement);
    setChapters((current) => [...current, chapter]);
    setSelectedId(chapter.id);
    setMessage(
      `${type === "cta" ? "CTA" : "Chapter"} added at ${placement === 0 ? "the beginning" : placement === DEMO_STEPS.length ? "the end" : `step ${String(placement)}`}.`
    );
    setError("");
  };

  const removeSelected = (): void => {
    if (chapters.length <= 1) {
      setError("Keep at least one chapter in the draft.");
      return;
    }
    const remaining = chapters.filter((chapter) => chapter.id !== selected.id);
    setChapters(remaining);
    setSelectedId(remaining[0]!.id);
    setMessage("Chapter removed from the local draft.");
  };

  const updateButton = (buttonId: string, patch: Partial<ChapterButton>): void =>
    updateSelected({
      buttons: selected.buttons.map((button) =>
        button.id === buttonId ? { ...button, ...patch } : button
      )
    });

  const addButton = (): void => {
    if (selected.buttons.length >= MAX_BUTTONS) {
      setError(`A chapter can contain up to ${String(MAX_BUTTONS)} buttons.`);
      return;
    }
    updateSelected({
      buttons: [
        ...selected.buttons,
        { id: makeId("button"), label: "Continue", action: "next", targetStep: null, url: "" }
      ]
    });
  };

  return (
    <main className="motion-workbench-page chapters-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/demos">
          ← Back to demos
        </a>
        <span className="motion-workbench-kicker">Chapters · Context and branching</span>
        <h1>Shape the story between every step</h1>
        <p>
          Add intro overlays, context cards, lead-capture forms, branching choices, and end CTAs
          without losing the viewer’s place.
        </p>
      </header>
      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <span className="chapters-workbench-local-badge">Browser-local editor preview</span>
      </div>
      {error ? (
        <p className="chapters-workbench-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="chapters-workbench-layout">
        <aside className="motion-workbench-panel chapters-workbench-flow">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Story flow</span>
              <h2>Chapters</h2>
            </div>
            <span className="motion-workbench-count">{chapters.length}</span>
          </div>
          <button
            type="button"
            className="chapters-workbench-add"
            onClick={() => addChapter("intro", 0)}
          >
            ＋ Initial overlay
          </button>
          {DEMO_STEPS.map((step, index) => (
            <div className="chapters-workbench-step" key={step}>
              <div className="chapters-workbench-step-title">
                <span>{String(index + 1)}</span>
                <strong>{step}</strong>
              </div>
              <button
                type="button"
                className="chapters-workbench-insert"
                onClick={() => addChapter("context", index + 1)}
              >
                ＋ Add chapter here
              </button>
              {sorted
                .filter((chapter) => chapter.placement === index + 1)
                .map((chapter) => (
                  <button
                    type="button"
                    className={`chapters-workbench-card${chapter.id === selectedId ? " is-selected" : ""}`}
                    key={chapter.id}
                    onClick={() => setSelectedId(chapter.id)}
                  >
                    <span>{chapter.type}</span>
                    <strong>{chapter.title}</strong>
                  </button>
                ))}
            </div>
          ))}
          <button
            type="button"
            className="chapters-workbench-add"
            onClick={() => addChapter("cta", DEMO_STEPS.length)}
          >
            ＋ End CTA
          </button>
          <p className="chapters-workbench-helper">
            Chapters can be added before the first step, between steps, or at the end. Viewers see
            one overlay at a time.
          </p>
        </aside>

        <section
          className="motion-workbench-panel chapters-workbench-editor"
          aria-label="Chapter editor"
        >
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Customize</span>
              <h2>Edit selected chapter</h2>
            </div>
            <button type="button" className="motion-workbench-button" onClick={removeSelected}>
              Delete
            </button>
          </div>
          <div className="chapters-workbench-placement">
            <span>Placement</span>
            <select
              value={selected.placement}
              onChange={(event) => updateSelected({ placement: Number(event.currentTarget.value) })}
            >
              <option value={0}>Beginning of demo</option>
              {DEMO_STEPS.map((step, index) => (
                <option value={index + 1} key={step}>
                  After step {index + 1}: {step}
                </option>
              ))}
              <option value={DEMO_STEPS.length}>End of demo</option>
            </select>
          </div>
          <div className="chapters-workbench-editor-grid">
            <label className="motion-workbench-field">
              <span>Chapter type</span>
              <select
                value={selected.type}
                onChange={(event) =>
                  updateSelected({ type: event.currentTarget.value as ChapterType })
                }
              >
                <option value="intro">Intro</option>
                <option value="context">Context</option>
                <option value="cta">Call to action</option>
                <option value="form">Lead capture form</option>
                <option value="outro">Outro</option>
              </select>
            </label>
            <label className="motion-workbench-field">
              <span>Title</span>
              <input
                type="text"
                maxLength={MAX_TITLE}
                value={selected.title}
                onChange={(event) =>
                  updateSelected({ title: event.currentTarget.value.slice(0, MAX_TITLE) })
                }
              />
            </label>
          </div>
          <label className="motion-workbench-field">
            <span>Description</span>
            <textarea
              rows={4}
              maxLength={MAX_BODY}
              value={selected.body}
              onChange={(event) =>
                updateSelected({ body: event.currentTarget.value.slice(0, MAX_BODY) })
              }
            />
          </label>
          <div className="chapters-workbench-editor-grid">
            <label className="motion-workbench-field">
              <span>Layout</span>
              <select
                value={selected.layout}
                onChange={(event) =>
                  updateSelected({ layout: event.currentTarget.value as ChapterLayout })
                }
              >
                <option value="left">Left aligned</option>
                <option value="center">Centered</option>
                <option value="right">Right aligned</option>
              </select>
            </label>
            <label className="motion-workbench-field">
              <span>Theme</span>
              <select
                value={selected.theme}
                onChange={(event) =>
                  updateSelected({ theme: event.currentTarget.value as ChapterTheme })
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="custom">Custom</option>
              </select>
            </label>
          </div>
          <div className="chapters-workbench-sliders">
            <label className="motion-workbench-field">
              <span>Overlay opacity: {Math.round(selected.opacity * 100)}%</span>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={selected.opacity}
                onChange={(event) => updateSelected({ opacity: Number(event.currentTarget.value) })}
              />
            </label>
            <label className="motion-workbench-field">
              <span>Background blur: {selected.blur}px</span>
              <input
                type="range"
                min={0}
                max={24}
                step={1}
                value={selected.blur}
                onChange={(event) => updateSelected({ blur: Number(event.currentTarget.value) })}
              />
            </label>
          </div>
          <section className="chapters-workbench-buttons" aria-labelledby="chapter-buttons-heading">
            <div className="motion-workbench-panel-heading">
              <div>
                <span className="motion-workbench-label">Viewer actions</span>
                <h3 id="chapter-buttons-heading">Buttons</h3>
              </div>
              <button
                type="button"
                className="motion-workbench-button"
                onClick={addButton}
                disabled={selected.buttons.length >= MAX_BUTTONS}
              >
                ＋ Button
              </button>
            </div>
            {selected.buttons.map((button, index) => (
              <div className="chapters-workbench-button-card" key={button.id}>
                <div className="chapters-workbench-button-heading">
                  <strong>Button {index + 1}</strong>
                  <button
                    type="button"
                    className="chapters-workbench-remove"
                    onClick={() =>
                      updateSelected({
                        buttons: selected.buttons.filter((item) => item.id !== button.id)
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
                <label className="motion-workbench-field">
                  <span>Label</span>
                  <input
                    type="text"
                    maxLength={96}
                    value={button.label}
                    onChange={(event) =>
                      updateButton(button.id, { label: event.currentTarget.value.slice(0, 96) })
                    }
                  />
                </label>
                <label className="motion-workbench-field">
                  <span>Action</span>
                  <select
                    value={button.action}
                    onChange={(event) =>
                      updateButton(button.id, {
                        action: event.currentTarget.value as ButtonAction,
                        targetStep: null
                      })
                    }
                  >
                    <option value="next">Continue to next step</option>
                    <option value="step">Go to a step</option>
                    <option value="url">Open external URL</option>
                  </select>
                </label>
                {button.action === "step" ? (
                  <label className="motion-workbench-field">
                    <span>Destination step</span>
                    <select
                      value={button.targetStep ?? 1}
                      onChange={(event) =>
                        updateButton(button.id, { targetStep: Number(event.currentTarget.value) })
                      }
                    >
                      {DEMO_STEPS.map((step, stepIndex) => (
                        <option value={stepIndex + 1} key={step}>
                          {stepIndex + 1}: {step}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {button.action === "url" ? (
                  <label className="motion-workbench-field">
                    <span>Destination URL</span>
                    <input
                      type="url"
                      maxLength={2_048}
                      value={button.url}
                      aria-invalid={Boolean(button.url && !validateSafeUrl(button.url))}
                      onChange={(event) =>
                        updateButton(button.id, {
                          url: validateSafeUrl(event.currentTarget.value.slice(0, 2_048)) ?? ""
                        })
                      }
                    />
                    <small>HTTPS and relative paths are allowed.</small>
                  </label>
                ) : null}
              </div>
            ))}
          </section>
        </section>

        <aside className="motion-workbench-panel chapters-workbench-preview">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Viewer preview</span>
              <h2>
                {selected.type === "cta"
                  ? "Call to action"
                  : selected.type === "form"
                    ? "Lead capture"
                    : "Context overlay"}
              </h2>
            </div>
            <span className="chapters-workbench-preview-step">
              {selected.placement === 0
                ? "Before step 1"
                : selected.placement === DEMO_STEPS.length
                  ? "After final step"
                  : `After step ${String(selected.placement)}`}
            </span>
          </div>
          <div
            className={`chapters-workbench-preview-card chapters-workbench-preview-${selected.theme}`}
            style={{
              opacity: selected.opacity,
              filter: `blur(${String(Math.min(selected.blur, 4))}px)`
            }}
          >
            <span className="chapters-workbench-preview-label">{selected.type}</span>
            <strong>{selected.title}</strong>
            <p>{selected.body}</p>
            {selected.type === "form" ? (
              <div className="chapters-workbench-form-preview">
                <span>Work email</span>
                <div>name@company.com</div>
                <span>Company</span>
                <div>Acme</div>
              </div>
            ) : null}
            <div className="chapters-workbench-preview-actions">
              {selected.buttons.map((button) => (
                <button type="button" key={button.id}>
                  {button.label}
                </button>
              ))}
            </div>
          </div>
          <div className="chapters-workbench-branching">
            <strong>Conditional branching</strong>
            <p>
              Use buttons to route viewers to a step, external URL, or lead-capture form. Links are
              validated before saving.
            </p>
          </div>
        </aside>
      </div>
      <p className="chapters-workbench-disclaimer">
        This is a local authoring preview. Uploaded cover media and published links are
        intentionally not sent to a server from this screen.
      </p>
    </main>
  );
}
