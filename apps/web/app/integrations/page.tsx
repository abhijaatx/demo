import type { Metadata } from "next";
import { MarketingIntegrations } from "../../components/marketing-integrations";

export const metadata: Metadata = {
  title: "Featured Integrations | Supademo",
  description:
    "Connect Supademo to the tools your team already uses for support, sales, documentation, and more."
};

export default function IntegrationsPage() {
  return <MarketingIntegrations />;
}
