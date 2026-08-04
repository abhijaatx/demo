import type { Metadata } from "next";
import { StepManagerWorkbench } from "../../components/step-manager-workbench";

export const metadata: Metadata = {
  title: "Step Manager | Supademo",
  description: "Add, replace, duplicate, delete, and reorder demo steps."
};

export default function StepManagerPage() {
  return <StepManagerWorkbench />;
}
