import type { Metadata } from "next";
import { MarketingContentPage } from "../../components/marketing-content-page";

export const metadata: Metadata = {
  title: "Supademo | Terms of Service",
  description:
    "Showcase your product with interactive, self-guided product demos that can be easily embedded in your website and blogs. And boost your website conversions."
};

export default function TermsPage() {
  return <MarketingContentPage slug={["terms-of-service"]} />;
}
