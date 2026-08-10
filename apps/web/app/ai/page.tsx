import type { Metadata } from "next";
import { MarketingAiPage } from "../../components/marketing-ai";

export const metadata: Metadata = {
  title: "Supademo AI — AI Demo Agents, Audits, Voice, and More",
  description:
    "Build, qualify, and scale product demos with Supademo AI demo agents, audits, text, and voiceovers."
};

export default function AiPage() {
  return <MarketingAiPage />;
}
