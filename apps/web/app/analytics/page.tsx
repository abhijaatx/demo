import type { Metadata } from "next";
import { WorkspaceReferenceSurface } from "../../components/workspace-reference-surface";

export const metadata: Metadata = {
  title: "Analytics | Supademo",
  robots: { index: false, follow: false }
};
export default function AnalyticsPage() {
  return <WorkspaceReferenceSurface kind="analytics" />;
}
