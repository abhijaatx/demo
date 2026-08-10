import type { Metadata } from "next";
import { VideoEditorWorkbench } from "../../components/video-editor-workbench";

export const metadata: Metadata = {
  title: "Video Editor | Supademo",
  description: "Split, trim, mute, and adjust video demo segments on a local timeline."
};

export default function VideoEditorPage() {
  return <VideoEditorWorkbench />;
}
