import type { Metadata } from "next";
import { AiCommandWorkbench } from "../../components/ai-command-workbench";

export const metadata: Metadata = {
  title: "AI Command | Supademo",
  description: "Review and approve plain-English bulk demo edits."
};

export default function AiCommandPage() {
  return <AiCommandWorkbench />;
}
