import type { Metadata } from "next";
import { MarketingCompare } from "../../components/marketing-compare";

export const metadata: Metadata = {
  title: "Compare Supademo to Alternatives | Interactive Demo Platform Comparison",
  description:
    "See how Supademo compares with interactive demo, video, and process documentation tools."
};

export default function ComparePage() {
  return <MarketingCompare />;
}
