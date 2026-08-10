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
