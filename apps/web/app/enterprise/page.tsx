import type { Metadata } from "next";
import { MarketingEnterprise } from "../../components/marketing-enterprise";

export const metadata: Metadata = {
  title: "Enterprise | Supademo",
  description:
    "Scale interactive demos with the security, governance, and support enterprise teams need."
};

export default function EnterprisePage() {
  return <MarketingEnterprise />;
}
