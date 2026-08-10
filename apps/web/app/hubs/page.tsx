import type { Metadata } from "next";
import { WorkspaceReferenceSurface } from "../../components/workspace-reference-surface";

export const metadata: Metadata = {
  title: "Demo hubs | Supademo",
  robots: { index: false, follow: false }
};
export default function HubsPage() {
  return <WorkspaceReferenceSurface kind="hubs" />;
}
