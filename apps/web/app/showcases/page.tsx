import type { Metadata } from "next";
import { WorkspaceReferenceSurface } from "../../components/workspace-reference-surface";

export const metadata: Metadata = {
  title: "Showcases | Supademo",
  robots: { index: false, follow: false }
};
export default function ShowcasesPage() {
  return <WorkspaceReferenceSurface kind="showcases" />;
}
