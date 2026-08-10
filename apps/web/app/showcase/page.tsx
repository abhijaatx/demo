import type { Metadata } from "next";
import { MarketingShowcase } from "../../components/marketing-showcase";
import { WorkspaceShowcaseViewer } from "../../components/workspace-showcase-viewer";

export const metadata: Metadata = {
  title: "Demo Showcase | Supademo",
  description: "Explore interactive demo examples by demo type, industry, and use case."
};

export default async function ShowcasePage({
  searchParams
}: {
  searchParams: Promise<{ collection?: string }>;
}) {
  const params = await searchParams;
  return params.collection ? (
    <WorkspaceShowcaseViewer collectionId={params.collection} />
  ) : (
    <MarketingShowcase />
  );
}
