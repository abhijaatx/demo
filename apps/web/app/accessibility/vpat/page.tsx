import type { Metadata } from "next";
import { MarketingVpat } from "../../../components/marketing-vpat";

export const metadata: Metadata = {
  title: "VPAT - Accessibility Conformance Report | Supademo - WCAG 2.2 Level A & AA",
  description: "Supademo accessibility conformance report for WCAG 2.2 Level A and AA."
};

export default function AccessibilityVpatPage() {
  return <MarketingVpat />;
}
