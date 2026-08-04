import { createDefaultDemoDocument } from "@supademo/domain";
import { DemoViewer } from "../../../components/demo-viewer";

export default async function EmbeddedDemoPage({
  params
}: {
  params: Promise<{ demoId: string }>;
}) {
  const { demoId } = await params;
  return (
    <DemoViewer demoId={demoId} initialDocument={createDefaultDemoDocument(demoId)} embedded />
  );
}
