import { createDefaultDemoDocument } from "@supademo/domain";
import React from "react";
import { EditorShell } from "../../../../components/editor-shell";

export default async function DemoEditPage({ params }: { params: Promise<{ demoId: string }> }) {
  const { demoId } = await params;
  const isLocalSample = demoId.startsWith("demo-");
  const emptyDocument = createDefaultDemoDocument(demoId);
  const initialDocument = isLocalSample
    ? {
        ...emptyDocument,
        steps: [
          {
            id: "sample-step-1",
            orderIndex: 0,
            title: "Start with the workspace overview",
            description: "Introduce the viewer to the first useful action.",
            media: null,
            hotspots: [],
            callouts: [],
            audioNarration: null
          },
          {
            id: "sample-step-2",
            orderIndex: 1,
            title: "Show the key workflow",
            description: "Keep the interaction focused and easy to follow.",
            media: null,
            hotspots: [],
            callouts: [],
            audioNarration: null
          },
          {
            id: "sample-step-3",
            orderIndex: 2,
            title: "Share the next step",
            description: "Close with one clear action for the viewer.",
            media: null,
            hotspots: [],
            callouts: [],
            audioNarration: null
          }
        ]
      }
    : emptyDocument;

  return (
    <EditorShell
      demoId={demoId}
      initialDocument={initialDocument}
      readOnly={isLocalSample}
      saveState="saved"
    />
  );
}
