import type { Metadata } from "next";
import { MarketingNotFoundPage } from "../../components/marketing-not-found";

export const metadata: Metadata = {
  title: "Supademo: AI Interactive Product Demos",
  description:
    "Create world-class interactive product demos with AI. Trusted by 200k+ businesses to drive revenue, adoption, and training. Get started for free."
};

export default function ProductPage() {
  return <MarketingNotFoundPage />;
}
