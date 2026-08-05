import type { Metadata } from "next";
import { DemoHubWorkbench } from "../../components/demo-hub-workbench";

export const metadata: Metadata = {
  title: "Demo Hub | Supademo",
  description: "Create, customize, and install a searchable Demo Hub for Supademo content.",
  robots: { index: false, follow: false }
};

export default function DemoHubPage() {
  return <DemoHubWorkbench />;
}
