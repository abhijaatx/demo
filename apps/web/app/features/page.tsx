import type { Metadata } from "next";
import { MarketingFeatures } from "../../components/marketing-features";

export const metadata: Metadata = {
  title: "Product Features | Supademo",
  description:
    "Capture, guide, share, and measure interactive product demos with Supademo features."
};

export default function FeaturesPage() {
  return <MarketingFeatures />;
}
