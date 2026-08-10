import type { Metadata } from "next";
import { FindReplaceWorkbench } from "../../components/find-replace-workbench";

export const metadata: Metadata = {
  title: "Find & Replace | Supademo",
  description: "Maintain demo copy, emails, and dates across every slide."
};

export default function FindReplacePage() {
  return <FindReplaceWorkbench />;
}
