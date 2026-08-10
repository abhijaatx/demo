import type { Metadata } from "next";
import { HtmlEditWorkbench } from "../../components/html-edit-workbench";

export const metadata: Metadata = {
  title: "Edit HTML | Supademo",
  description: "Edit, redact, hide, and personalize captured HTML safely."
};

export default function EditHtmlPage() {
  return <HtmlEditWorkbench />;
}
