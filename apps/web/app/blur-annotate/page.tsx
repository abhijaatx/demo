import type { Metadata } from "next";
import { BlurAnnotateWorkbench } from "../../components/blur-annotate-workbench";

export const metadata: Metadata = {
  title: "Blur & Annotate | Supademo",
  description: "Redact sensitive details and annotate screenshot steps locally."
};

export default function BlurAnnotatePage() {
  return <BlurAnnotateWorkbench />;
}
