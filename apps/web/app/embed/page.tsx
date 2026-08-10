import type { Metadata } from "next";
import { EmbedWorkbench } from "../../components/embed-workbench";

export const metadata: Metadata = {
  title: "Embed | Supademo",
  description: "Generate responsive, secure Supademo and Showcase embed snippets."
};

export default function EmbedPage() {
  return <EmbedWorkbench />;
}
