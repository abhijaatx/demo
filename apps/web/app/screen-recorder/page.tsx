import type { Metadata } from "next";
import { ScreenCameraRecorderWorkbench } from "../../components/screen-camera-recorder-workbench";

export const metadata: Metadata = {
  title: "Screen & Camera Recorder | Supademo",
  description: "Record your screen, webcam, or both in one local video."
};

export default function ScreenRecorderPage() {
  return <ScreenCameraRecorderWorkbench />;
}
