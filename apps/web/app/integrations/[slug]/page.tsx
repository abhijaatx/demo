import type { Metadata } from "next";
import { MarketingIntegrationDetailClient } from "../../../components/marketing-integrations";

type IntegrationRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: IntegrationRouteProps): Promise<Metadata> {
  await params;
  return {
    title: "Supademo integration",
    description: "Connect Supademo to the tools your team already uses."
  };
}

export default async function IntegrationRoute({ params }: IntegrationRouteProps) {
  const { slug } = await params;
  return <MarketingIntegrationDetailClient slug={slug} />;
}
