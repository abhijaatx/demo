import type { Metadata } from "next";
import { DesktopRecorderWorkbench } from "../../components/desktop-recorder-workbench";

export const metadata: Metadata = {
  title: "Desktop recorder | Supademo",
  description: "Capture native desktop apps and screens into local Supademo steps."
};

export default function DesktopRecorderPage() {
  return <DesktopRecorderWorkbench />;
}
