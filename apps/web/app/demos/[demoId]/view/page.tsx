import { createDefaultDemoDocument } from "@supademo/domain";
import { DemoViewer } from "../../../../components/demo-viewer";

export default async function DemoViewPage({
  params,
  searchParams
}: {
  params: Promise<{ demoId: string }>;
  searchParams?: Promise<{ localCapture?: string }> | { localCapture?: string };
}) {
  const { demoId } = await params;
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  return (
    <DemoViewer
      demoId={demoId}
      initialDocument={createDefaultDemoDocument(demoId)}
      localCaptureId={resolvedSearchParams.localCapture}
    />
  );
}
