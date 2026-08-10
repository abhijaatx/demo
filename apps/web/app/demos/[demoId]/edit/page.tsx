import { createDefaultDemoDocument } from "@supademo/domain";
import React from "react";
import { EditorShell } from "../../../../components/editor-shell";

type DemoEditPageProps = {
  params: Promise<{ demoId: string }>;
  searchParams?:
    | Promise<{ capture?: string; sample?: string; localCapture?: string }>
    | {
        capture?: string;
        sample?: string;
        localCapture?: string;
      };
};

const captureModes = [
  "guided",
  "html",
  "sandbox",
  "screenshot",
  "video",
  "upload",
  "figma"
] as const;
type CaptureMode = (typeof captureModes)[number];

export default async function DemoEditPage({ params, searchParams }: DemoEditPageProps) {
  const { demoId } = await params;
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const captureMode: CaptureMode = captureModes.includes(
    resolvedSearchParams.capture as CaptureMode
  )
    ? (resolvedSearchParams.capture as CaptureMode)
    : "guided";
  const isLocalSample = resolvedSearchParams.sample === "1";
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
      captureMode={captureMode}
      localCaptureId={resolvedSearchParams.localCapture}
    />
  );
}
