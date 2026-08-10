import type { Metadata } from "next";
import { MarketingPricing } from "../../components/marketing-pricing";

export const metadata: Metadata = {
  title: "Plans & Pricing | Supademo",
  description:
    "Compare flexible Supademo plans and start a free trial for interactive product demos."
};

export default function PricingPage() {
  return <MarketingPricing />;
}
