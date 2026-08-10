import type { Metadata } from "next";
import { ExportWorkbench } from "../../components/export-workbench";

export const metadata: Metadata = {
  title: "Exports | Supademo",
  description: "Copy steps and export Supademo demos to visual, video, and SCORM formats.",
  robots: { index: false, follow: false }
};

export default function ExportsPage() {
  return <ExportWorkbench />;
}
