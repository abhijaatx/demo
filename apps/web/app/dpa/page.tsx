import type { Metadata } from "next";
import { MarketingContentPage } from "../../components/marketing-content-page";

export const metadata: Metadata = {
  title: "Data Processing Agreement | Supademo",
  description:
    "How Supademo processes personal data on behalf of customers: GDPR Standard Contractual Clauses, UK Addendum, subprocessors, security, and CCPA terms."
};

export default function DpaPage() {
  return <MarketingContentPage slug={["dpa"]} />;
}
