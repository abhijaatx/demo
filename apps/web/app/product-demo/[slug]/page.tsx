import type { Metadata } from "next";
import { MarketingLiveTraining } from "../../../components/marketing-live-training";
import {
  getMarketingReferenceMetadata,
  MarketingReferencePage
} from "../../../components/marketing-reference-page";

type ProductDemoRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductDemoRouteProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "live-training") {
    return {
      title: "Join a Free Training Session of Supademo",
      description:
        "Join a free Supademo training session for hands-on guidance, real-time questions, and practical demo-building skills."
    };
  }
  return getMarketingReferenceMetadata(["product-demo", slug]);
}

export default async function ProductDemoRoute({ params }: ProductDemoRouteProps) {
  const { slug } = await params;
  if (slug === "live-training") return <MarketingLiveTraining />;
  return <MarketingReferencePage slug={["product-demo", slug]} />;
}
