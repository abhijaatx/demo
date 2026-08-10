import type { Metadata } from "next";
import { WorkspaceReferenceSurface } from "../../components/workspace-reference-surface";

export const metadata: Metadata = {
  title: "Route hubs | Supademo",
  robots: { index: false, follow: false }
};
export default function RoutesPage() {
  return <WorkspaceReferenceSurface kind="routes" />;
}
