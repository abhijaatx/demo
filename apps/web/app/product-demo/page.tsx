import type { Metadata } from "next";
import { MarketingProductDemo } from "../../components/marketing-product-demo";

export const metadata: Metadata = {
  title: "Book a Demo | Supademo — Interactive Demo Platform",
  description: "See Supademo in action and learn how modern teams scale product education."
};

export default function ProductDemoPage() {
  return <MarketingProductDemo />;
}
