import type { Metadata } from "next";
import { FigmaImportWorkbench } from "../../components/figma-import-workbench";

export const metadata: Metadata = {
  title: "Figma plugin import | Supademo",
  description: "Turn selected Figma frames into an interactive Supademo prototype."
};

export default function FigmaPluginPage() {
  return <FigmaImportWorkbench />;
}
