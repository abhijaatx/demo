import type { Metadata } from "next";
import { MarketingContentPage } from "../../../components/marketing-content-page";

export const metadata: Metadata = {
  title: "AI Policy | Supademo",
  description: "Learn about Supademo's AI policy."
};

export default function AiPolicyPage() {
  return <MarketingContentPage slug={["privacy-policy", "ai"]} />;
}
