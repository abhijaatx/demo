import type { Metadata } from "next";
import { VideoHotspotsWorkbench } from "../../components/video-hotspots-workbench";

export const metadata: Metadata = {
  title: "Interactive Video Hotspots | Supademo",
  description: "Add timeline-based hotspots to a local video before publishing a demo."
};

export default function VideoHotspotsPage() {
  return <VideoHotspotsWorkbench />;
}
