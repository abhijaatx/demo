import type { Metadata } from "next";
import { WorkspaceReferenceSurface } from "../../components/workspace-reference-surface";

export const metadata: Metadata = {
  title: "Videos | Supademo",
  robots: { index: false, follow: false }
};
export default function VideosPage() {
  return <WorkspaceReferenceSurface kind="videos" />;
}
