import type { Metadata } from "next";
import { MarketingAiAgentsPage } from "../../../components/marketing-ai-agents";

export const metadata: Metadata = {
  title: "AI Demo Agent: Run Product Demos & Qualification on Autopilot | Supademo",
  description:
    "Deploy self-improving AI agents that run discovery, answer questions, handle objections, and showcase interactive content."
};

export default function AiDemoAgentsPage() {
  return <MarketingAiAgentsPage />;
}
