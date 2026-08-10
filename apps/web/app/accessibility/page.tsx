import type { Metadata } from "next";
import { MarketingAccessibility } from "../../components/marketing-accessibility";

export const metadata: Metadata = {
  title: "Accessibility Statement | Supademo",
  description: "Supademo's commitment to digital accessibility and inclusive product experiences."
};

export default function AccessibilityPage() {
  return <MarketingAccessibility />;
}
