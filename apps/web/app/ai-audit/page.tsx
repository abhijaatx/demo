import type { Metadata } from "next";
import { AiAuditWorkbench } from "../../components/ai-audit-workbench";

export const metadata: Metadata = {
  title: "AI Audit | Supademo",
  description: "Review local, bounded demo quality recommendations before applying them."
};

export default function AiAuditPage() {
  return <AiAuditWorkbench />;
}
