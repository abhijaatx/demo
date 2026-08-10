import type { Metadata } from "next";
import { PersonalizationWorkbench } from "../../components/personalization-workbench";

export const metadata: Metadata = {
  title: "Personalize | Supademo",
  description: "Preview allowlisted dynamic variables and personalized demo links."
};

export default function PersonalizePage() {
  return <PersonalizationWorkbench />;
}
