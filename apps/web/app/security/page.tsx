import type { Metadata } from "next";
import { MarketingSecurityPage } from "../../components/marketing-security";

export const metadata: Metadata = {
  title: "Trust Center - Supademo",
  description: "Supademo security, privacy, and compliance resources."
};

export default function SecurityPage() {
  return <MarketingSecurityPage />;
}
