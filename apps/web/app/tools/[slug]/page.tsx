import type { Metadata } from "next";
import {
  getMarketingReferenceMetadata,
  MarketingReferencePage
} from "../../../components/marketing-reference-page";
import {
  getToolDetail,
  getToolDetailMetadata,
  MarketingToolDetail
} from "../../../components/marketing-tool-detail";

type ToolRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ToolRouteProps): Promise<Metadata> {
  const { slug } = await params;
  if (getToolDetail(slug)) return getToolDetailMetadata(slug);
  return getMarketingReferenceMetadata(["tools", slug]);
}

export default async function ToolRoute({ params }: ToolRouteProps) {
  const { slug } = await params;
  if (getToolDetail(slug)) return <MarketingToolDetail slug={slug} />;
  return <MarketingReferencePage slug={["tools", slug]} />;
}
