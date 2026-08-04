import type { Metadata } from "next";
import { MarketingShowcase } from "../../components/marketing-showcase";

export const metadata: Metadata = {
  title: "Demo Showcase | Supademo",
  description: "Explore interactive demo examples by demo type, industry, and use case."
};

export default function ShowcasePage() {
  return <MarketingShowcase />;
}
