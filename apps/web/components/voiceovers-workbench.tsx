"use client";

import { getAvailableTtsVoices } from "@supademo/domain";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

const MAX_SCRIPT_LENGTH = 4_000;
const MAX_PRONUNCIATION_ENTRIES = 64;
const MAX_PRONUNCIATION_LENGTH = 160;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/webm"
]);

type VoiceSource = "ai" | "upload" | "record";

type VoiceStep = {
  readonly id: string;
  readonly title: string;
  readonly script: string;
  readonly voiceId: string;
  readonly expressive: boolean;
  readonly speed: number;
  readonly stability: number;
  readonly source: VoiceSource;
  readonly uploadedFileName: string | null;
};

type PronunciationEntry = {
  readonly id: string;
  readonly word: string;
  readonly written: string;
  readonly phonetic: string;
  readonly enabled: boolean;
};

const voices = getAvailableTtsVoices();
const defaultVoiceId = voices[0]?.voiceId ?? "en-US-1";

const INITIAL_STEPS: readonly VoiceStep[] = [
  {
    id: "voice-1",
    title: "Welcome to the workspace",
    script: "Welcome to the workspace. In this demo, we will show the core workflow.",
    voiceId: defaultVoiceId,
    expressive: true,
    speed: 1,
    stability: 0.5,
    source: "ai",
    uploadedFileName: null
  },
  {
    id: "voice-2",
    title: "Review your analytics",
    script: "Open analytics to understand which steps your viewers engage with most.",
    voiceId: defaultVoiceId,
    expressive: true,
    speed: 1,
    stability: 0.5,
    source: "ai",
    uploadedFileName: null
  },
  {
    id: "voice-3",
    title: "Share the finished demo",
    script: "When your walkthrough is ready, share it with a secure link or embed.",
    voiceId: defaultVoiceId,
    expressive: true,
    speed: 1,
    stability: 0.5,
    source: "ai",
    uploadedFileName: null
  }
];

function makeId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}`;
}

function downloadPlan(value: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function VoiceoversWorkbench() {
  const [steps, setSteps] = useState<readonly VoiceStep[]>(INITIAL_STEPS);
  const [selectedId, setSelectedId] = useState(INITIAL_STEPS[0]!.id);
  const [pronunciations, setPronunciations] = useState<readonly PronunciationEntry[]>([]);
  const [pronunciationWord, setPronunciationWord] = useState("");
  const [pronunciationWritten, setPronunciationWritten] = useState("");
  const [pronunciationPhonetic, setPronunciationPhonetic] = useState("");
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneRecording, setCloneRecording] = useState(false);
  const [cloneStatus, setCloneStatus] = useState("No clone sample recorded.");
  const [manualRecording, setManualRecording] = useState(false);
  const [message, setMessage] = useState("Select a step to edit its narration and voice settings.");
  const [error, setError] = useState("");
  const objectUrlsByStepRef = useRef<Map<string, string>>(new Map());

  const selectedStep = steps.find((step) => step.id === selectedId) ?? steps[0]!;
  const selectedVoice = voices.find((voice) => voice.voiceId === selectedStep.voiceId) ?? voices[0];

  useEffect(() => {
    return () => {
      for (const url of objectUrlsByStepRef.current.values()) URL.revokeObjectURL(url);
      objectUrlsByStepRef.current.clear();
    };
  }, []);

  const updateStep = (patch: Partial<VoiceStep>) => {
    setSteps((current) =>
      current.map((step) => (step.id === selectedStep.id ? { ...step, ...patch } : step))
    );
    setError("");
    setMessage("Voiceover settings saved locally for this step.");
  };

  const syncSelectedScript = () => {
    const synced = `${selectedStep.title}. ${selectedStep.script}`.slice(0, MAX_SCRIPT_LENGTH);
    updateStep({ script: synced });
    setMessage("This step's script is synced from its title and narrative context.");
  };

  const syncAllVoiceSettings = () => {
    setSteps((current) =>
      current.map((step) => ({
        ...step,
        voiceId: selectedStep.voiceId,
        expressive: selectedStep.expressive,
        speed: selectedStep.speed,
        stability: selectedStep.stability
      }))
    );
    setMessage(`Voice settings synced across all ${String(steps.length)} steps.`);
  };

  const handleAudioUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!AUDIO_TYPES.has(file.type) || file.size > MAX_AUDIO_BYTES) {
      setError("Choose an MP3, WAV, OGG, M4A, or WebM audio file up to 25 MB.");
      return;
    }
    const previousUrl = objectUrlsByStepRef.current.get(selectedStep.id);
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    const url = URL.createObjectURL(file);
    objectUrlsByStepRef.current.set(selectedStep.id, url);
    updateStep({ source: "upload", uploadedFileName: file.name.slice(0, 120) });
    setMessage(`${file.name.slice(0, 120)} is ready locally. Save the demo to publish it.`);
  };

  const addPronunciation = () => {
    if (pronunciations.length >= MAX_PRONUNCIATION_ENTRIES) {
      setError(
        `The pronunciation library supports up to ${String(MAX_PRONUNCIATION_ENTRIES)} entries.`
      );
      return;
    }
    const word = pronunciationWord.trim().slice(0, MAX_PRONUNCIATION_LENGTH);
    const written = pronunciationWritten.trim().slice(0, MAX_PRONUNCIATION_LENGTH);
    const phonetic = pronunciationPhonetic.trim().slice(0, MAX_PRONUNCIATION_LENGTH);
    if (!word || !written || !phonetic) {
      setError("Add a word, written form, and phonetic form before saving a pronunciation.");
      return;
    }
    setPronunciations((current) => [
      ...current,
      { id: makeId("pronunciation"), word, written, phonetic, enabled: true }
    ]);
    setPronunciationWord("");
    setPronunciationWritten("");
    setPronunciationPhonetic("");
    setError("");
    setMessage(`Pronunciation for “${word}” added.`);
  };

  const startCloneRecording = () => {
    if (cloneRecording) {
      setCloneRecording(false);
      setCloneStatus(
        "Clone recording stopped. This browser-local preview does not capture microphone data."
      );
      setMessage(
        "Clone workflow stopped. Connect an approved recording provider before publishing a real clone."
      );
      return;
    }
    setCloneRecording(true);
    setCloneStatus("Recording state active… read the sample script, then stop when finished.");
  };

  const startManualRecording = () => {
    setManualRecording((current) => {
      const next = !current;
      setMessage(
        next
          ? "Manual recording state active. Stop when the browser capture is complete."
          : "Manual recording stopped. No microphone data is retained by this preview."
      );
      return next;
    });
  };

  const plan = useMemo(
    () => ({
      schemaVersion: 1,
      source: "browser-local-voiceovers-workbench",
      voiceCatalog: voices.map((voice) => ({
        voiceId: voice.voiceId,
        name: voice.name,
        locale: voice.locale
      })),
      pronunciations,
      clone: { status: cloneStatus, captured: false },
      steps: steps.map(({ uploadedFileName, ...step }) => ({ ...step, uploadedFileName }))
    }),
    [cloneStatus, pronunciations, steps]
  );

  return (
    <main className="motion-workbench-page voiceovers-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/demos">
          ← Back to demos
        </a>
        <span className="motion-workbench-kicker">Voiceovers 2.0</span>
        <h1>Give every step a clear voice</h1>
        <p>
          Choose an AI voice, sync scripts across the storyboard, fine-tune expression, manage
          pronunciation, or hand off to a reviewed recording workflow.
        </p>
      </header>

      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <button
          type="button"
          className="motion-workbench-button motion-workbench-button-secondary"
          onClick={() => downloadPlan(plan, "supademo-voiceover-plan.json")}
        >
          Download plan
        </button>
      </div>
      {error ? (
        <p className="voiceovers-workbench-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="voiceovers-workbench-layout" aria-label="Voiceover editor">
        <aside className="motion-workbench-panel voiceovers-workbench-steps">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Storyboard</span>
              <h2>Voice per step</h2>
            </div>
            <span className="motion-workbench-count">{steps.length}</span>
          </div>
          <div className="motion-workbench-step-list" role="listbox" aria-label="Voiceover steps">
            {steps.map((step, index) => (
              <button
                type="button"
                role="option"
                aria-selected={step.id === selectedStep.id}
                className={`motion-workbench-step${step.id === selectedStep.id ? " is-selected" : ""}`}
                key={step.id}
                onClick={() => setSelectedId(step.id)}
              >
                <span className="motion-workbench-step-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>{step.title}</strong>
                  <small>
                    {step.source === "ai"
                      ? "AI voice"
                      : step.source === "upload"
                        ? (step.uploadedFileName ?? "Uploaded voice")
                        : "Recorded voice"}
                  </small>
                </span>
                <span className="voiceovers-workbench-status-dot" data-source={step.source} />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="motion-workbench-button motion-workbench-button-secondary voiceovers-workbench-sync-all"
            onClick={syncAllVoiceSettings}
          >
            Sync voice settings across steps
          </button>
        </aside>

        <section className="motion-workbench-panel voiceovers-workbench-editor">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Narration</span>
              <h2>{selectedStep.title}</h2>
            </div>
            <span className="voiceovers-workbench-voice-pill">
              {selectedVoice?.name ?? "AI voice"}
            </span>
          </div>
          <label className="motion-workbench-field">
            <span>
              Narration script{" "}
              <output>
                {selectedStep.script.length}/{MAX_SCRIPT_LENGTH}
              </output>
            </span>
            <textarea
              rows={7}
              maxLength={MAX_SCRIPT_LENGTH}
              value={selectedStep.script}
              onChange={(event) =>
                updateStep({ script: event.currentTarget.value.slice(0, MAX_SCRIPT_LENGTH) })
              }
            />
          </label>
          <div className="voiceovers-workbench-actions">
            <button
              type="button"
              className="motion-workbench-button motion-workbench-button-secondary"
              onClick={syncSelectedScript}
            >
              Sync from step context
            </button>
            <label className="motion-workbench-button motion-workbench-button-secondary voiceovers-workbench-file-button">
              Upload voice
              <input
                type="file"
                accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm"
                onChange={handleAudioUpload}
                aria-label="Upload voice audio"
              />
            </label>
            <button
              type="button"
              className="motion-workbench-button motion-workbench-button-secondary"
              onClick={startManualRecording}
            >
              {manualRecording ? "Stop recording" : "Record my voice"}
            </button>
          </div>
          <label className="motion-workbench-field">
            <span>AI voice</span>
            <select
              value={selectedStep.voiceId}
              onChange={(event) =>
                updateStep({
                  voiceId: event.currentTarget.value,
                  source: "ai",
                  uploadedFileName: null
                })
              }
            >
              {voices.map((voice) => (
                <option key={voice.voiceId} value={voice.voiceId}>
                  {voice.name} · {voice.locale}
                </option>
              ))}
            </select>
          </label>
          <div className="motion-workbench-slider-grid">
            <label className="motion-workbench-field">
              <span>
                Speed <output>{selectedStep.speed.toFixed(1)}×</output>
              </span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={selectedStep.speed}
                onChange={(event) => updateStep({ speed: Number(event.currentTarget.value) })}
              />
            </label>
            <label className="motion-workbench-field">
              <span>
                Stability <output>{selectedStep.stability.toFixed(1)}</output>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedStep.stability}
                onChange={(event) => updateStep({ stability: Number(event.currentTarget.value) })}
              />
            </label>
          </div>
          <label className="motion-workbench-toggle">
            <input
              type="checkbox"
              checked={selectedStep.expressive}
              onChange={(event) => updateStep({ expressive: event.currentTarget.checked })}
            />
            <span>
              <strong>Expressive mode</strong>
              <small>Add more natural emphasis and pacing.</small>
            </span>
          </label>
          {selectedStep.uploadedFileName ? (
            <p className="voiceovers-workbench-file-note" role="status">
              Uploaded locally: {selectedStep.uploadedFileName}. Audio is not sent anywhere by this
              preview.
            </p>
          ) : null}
          {manualRecording ? (
            <p className="voiceovers-workbench-file-note" role="status">
              Recording state is active for preview only. A real microphone capture requires an
              approved media pipeline.
            </p>
          ) : null}
        </section>

        <aside className="motion-workbench-panel voiceovers-workbench-tools">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Tools</span>
              <h2>Voice library</h2>
            </div>
          </div>
          <button
            type="button"
            className="voiceovers-workbench-tool-card"
            onClick={() => setCloneOpen((current) => !current)}
          >
            <span className="voiceovers-workbench-tool-icon">◉</span>
            <span>
              <strong>Clone a voice</strong>
              <small>Record a reviewed sample and use it in the voice catalog.</small>
            </span>
            <span>›</span>
          </button>
          {cloneOpen ? (
            <div className="voiceovers-workbench-clone">
              <p>Read: “Make every product moment easy to understand.”</p>
              <button
                type="button"
                className="motion-workbench-button motion-workbench-button-primary"
                onClick={startCloneRecording}
              >
                {cloneRecording ? "Stop" : "Record"}
              </button>
              <small>{cloneStatus}</small>
            </div>
          ) : null}
          <div className="motion-workbench-divider" />
          <div className="motion-workbench-panel-heading voiceovers-workbench-subheading">
            <div>
              <span className="motion-workbench-label">Pronunciation library</span>
              <h3>Teach the narrator</h3>
            </div>
            <span className="motion-workbench-count">
              {pronunciations.length}/{MAX_PRONUNCIATION_ENTRIES}
            </span>
          </div>
          <div className="voiceovers-workbench-pronunciation-form">
            <input
              value={pronunciationWord}
              maxLength={MAX_PRONUNCIATION_LENGTH}
              placeholder="Word"
              onChange={(event) => setPronunciationWord(event.currentTarget.value)}
              aria-label="Pronunciation word"
            />
            <input
              value={pronunciationWritten}
              maxLength={MAX_PRONUNCIATION_LENGTH}
              placeholder="Written form"
              onChange={(event) => setPronunciationWritten(event.currentTarget.value)}
              aria-label="Pronunciation written form"
            />
            <input
              value={pronunciationPhonetic}
              maxLength={MAX_PRONUNCIATION_LENGTH}
              placeholder="Phonetic form"
              onChange={(event) => setPronunciationPhonetic(event.currentTarget.value)}
              aria-label="Pronunciation phonetic form"
            />
            <button
              type="button"
              className="motion-workbench-button motion-workbench-button-secondary"
              onClick={addPronunciation}
            >
              Add
            </button>
          </div>
          <div className="voiceovers-workbench-pronunciation-list">
            {pronunciations.length ? (
              pronunciations.map((entry) => (
                <div className="voiceovers-workbench-pronunciation" key={entry.id}>
                  <span>
                    <strong>{entry.word}</strong>
                    <small>
                      {entry.written} · {entry.phonetic}
                    </small>
                  </span>
                  <button
                    type="button"
                    aria-label={`Toggle ${entry.word}`}
                    onClick={() =>
                      setPronunciations((current) =>
                        current.map((item) =>
                          item.id === entry.id ? { ...item, enabled: !item.enabled } : item
                        )
                      )
                    }
                  >
                    {entry.enabled ? "On" : "Off"}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${entry.word}`}
                    onClick={() =>
                      setPronunciations((current) => current.filter((item) => item.id !== entry.id))
                    }
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <p className="motion-workbench-helper">No custom pronunciations yet.</p>
            )}
          </div>
        </aside>
      </section>
      <p className="voiceovers-workbench-disclaimer">
        Browser-local preview: uploaded audio is validated and held as an object URL for this
        session. Clone and manual record controls intentionally do not request microphone
        permissions or transmit audio.
      </p>
    </main>
  );
}
