import type { Metadata } from "next";
import { MarketingUseCases } from "../../components/marketing-use-cases";

export const metadata: Metadata = {
  title: "Interactive Product Demos for All Use Cases | Supademo",
  description:
    "Explore practical interactive product demo use cases for sales, marketing, customer success, onboarding, support, product, and training teams."
};

export default function UseCasesPage() {
  return <MarketingUseCases />;
}
