import type { Metadata } from "next";
import { MarketingHome } from "../components/marketing-home";

export const metadata: Metadata = {
  title: "Supademo: AI Interactive Product Demos",
  description:
    "Record a workflow, turn it into a guided demo, and share it with the people who need it."
};

export default function PublicHomePage() {
  return <MarketingHome />;
}
