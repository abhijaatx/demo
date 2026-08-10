import assert from "node:assert/strict";
import { test } from "node:test";
import { createDefaultDemoDocument, publishDemoDocument, unpublishDemo } from "@supademo/domain";

test("publishDemoDocument creates immutable versioned manifest with content hash", () => {
  const doc = createDefaultDemoDocument("demo-pub-1");
  const step1 = {
    id: "s1",
    orderIndex: 0,
    title: "S1",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const step2 = {
    id: "s2",
    orderIndex: 1,
    title: "S2",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const docWithSteps = { ...doc, steps: [step1, step2] };

  const manifest = publishDemoDocument(docWithSteps, 0);
  assert.equal(manifest.version, 1);
  assert.equal(manifest.isPublished, true);
  assert.ok(manifest.contentHash.length > 0);

  const unpublished = unpublishDemo(manifest);
  assert.equal(unpublished.isPublished, false);
});

test("publishDemoDocument strips private chapter notes and unsafe destinations", () => {
  const doc = createDefaultDemoDocument("demo-pub-chapter");
  const documentWithChapter = {
    ...doc,
    steps: [
      {
        id: "s1",
        orderIndex: 0,
        title: "S1",
        media: null,
        hotspots: [],
        callouts: [],
        audioNarration: {
          assetId: "audio-1",
          durationSeconds: 1,
          autoPlay: true,
          audioUrl: "javascript:alert(1)",
          transcriptText: "hello"
        }
      }
    ],
    chapters: [
      {
        id: "chapter-1",
        type: "cta",
        // Positioned after the only step so the end CTA stays a terminal node:
        // a start chapter whose only button is an external URL would be a dead
        // end under the chapter-aware branching graph (and block publishing).
        orderIndex: 1,
        title: "Take action",
        bodyText: "Next step",
        mediaAssetId: null,
        mediaUrl: "javascript:alert(1)",
        presenterNotes: "private presenter context",
        form: {
          formId: "lead-form",
          title: "Lead capture",
          fields: [
            { id: "email", label: "Email", fieldType: "email", isRequired: true, options: [] }
          ],
          allowSkip: false,
          allowNonBusinessEmails: false,
          backgroundImageUrl: "javascript:alert(1)"
        },
        buttons: [
          {
            id: "button-1",
            label: "Unsafe",
            actionType: "url",
            targetStepId: null,
            url: "javascript:alert(1)"
          }
        ]
      }
    ]
  };

  const manifest = publishDemoDocument(documentWithChapter, 0);
  assert.equal(manifest.document.chapters[0].presenterNotes, null);
  assert.equal(manifest.document.chapters[0].mediaUrl, null);
  assert.equal(manifest.document.chapters[0].buttons[0].actionType, "next");
  assert.equal(manifest.document.chapters[0].buttons[0].url, null);
  assert.equal(manifest.document.chapters[0].form?.backgroundImageUrl, null);
  assert.equal(manifest.document.steps[0].audioNarration?.audioUrl, null);
});

test("publishDemoDocument re-normalizes embed chapter URLs on publish", () => {
  const safe = createDefaultDemoDocument("demo-pub-embed-safe");
  const safeDoc = {
    ...safe,
    steps: [
      {
        id: "s1",
        orderIndex: 0,
        title: "S1",
        media: null,
        hotspots: [],
        callouts: [],
        audioNarration: null
      }
    ],
    chapters: [
      {
        id: "embed-1",
        type: "embed",
        orderIndex: 1,
        title: "Book a demo",
        bodyText: null,
        mediaAssetId: null,
        mediaUrl: null,
        presenterNotes: "private",
        embedUrl: "https://calendly.com/team/meeting?month=2026-08#overlay",
        buttons: [
          {
            id: "button-1",
            label: "Continue",
            actionType: "next",
            targetStepId: null,
            url: null
          }
        ]
      }
    ]
  };
  const safeManifest = publishDemoDocument(safeDoc, 0);
  assert.equal(
    safeManifest.document.chapters[0].embedUrl,
    "https://calendly.com/team/meeting?month=2026-08"
  );
  assert.equal(safeManifest.document.chapters[0].presenterNotes, null);

  const unsafe = createDefaultDemoDocument("demo-pub-embed-unsafe");
  const unsafeDoc = {
    ...unsafe,
    steps: [
      {
        id: "s1",
        orderIndex: 0,
        title: "S1",
        media: null,
        hotspots: [],
        callouts: [],
        audioNarration: null
      }
    ],
    chapters: [
      {
        id: "embed-2",
        type: "embed",
        orderIndex: 1,
        title: "Unsafe embed",
        bodyText: null,
        mediaAssetId: null,
        mediaUrl: null,
        presenterNotes: null,
        embedUrl: "javascript:alert(1)",
        buttons: [
          {
            id: "button-2",
            label: "Continue",
            actionType: "next",
            targetStepId: null,
            url: null
          }
        ]
      }
    ]
  };
  const unsafeManifest = publishDemoDocument(unsafeDoc, 0);
  assert.equal(unsafeManifest.document.chapters[0].embedUrl, null);
});

test("publishDemoDocument re-validates demo-level background audio", () => {
  const base = createDefaultDemoDocument("demo-pub-bg");
  const withBackgroundAudio = {
    ...base,
    steps: [
      {
        id: "s1",
        orderIndex: 0,
        title: "S1",
        media: null,
        hotspots: [],
        callouts: [],
        audioNarration: null
      }
    ],
    settings: {
      ...base.settings,
      backgroundAudio: {
        audioAssetId: "bg-1",
        storagePath: "/music/bg.mp3",
        audioUrl: "javascript:alert(1)",
        title: "Calm ambient",
        presetId: "calm-ambient",
        volume: 0.8,
        duckingRatio: 0.6,
        loop: true,
        muted: false
      }
    }
  };

  const manifest = publishDemoDocument(withBackgroundAudio, 0);
  const publishedBg = manifest.document.settings.backgroundAudio;
  assert.ok(publishedBg);
  assert.equal(publishedBg.audioUrl, null); // unsafe scheme stripped on publish
  assert.equal(publishedBg.presetId, "calm-ambient");
  assert.equal(publishedBg.volume, 0.8);
  assert.equal(publishedBg.loop, true);

  const withoutBg = publishDemoDocument(base, 0);
  assert.equal(withoutBg.document.settings.backgroundAudio, null);
});
