import type { Metadata } from "next";
import {
  getMarketingReferenceMetadata,
  MarketingReferencePage
} from "../../../components/marketing-reference-page";
import {
  getUseCaseDetail,
  getUseCaseDetailMetadata,
  MarketingUseCaseDetail
} from "../../../components/marketing-use-case-detail";

type UseCaseRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: UseCaseRouteProps): Promise<Metadata> {
  const { slug } = await params;
  if (getUseCaseDetail(slug)) return getUseCaseDetailMetadata(slug);
  return getMarketingReferenceMetadata(["use-cases", slug]);
}

export default async function UseCaseRoute({ params }: UseCaseRouteProps) {
  const { slug } = await params;
  if (getUseCaseDetail(slug)) return <MarketingUseCaseDetail slug={slug} />;
  return <MarketingReferencePage slug={["use-cases", slug]} />;
}
