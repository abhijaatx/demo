import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCustomerDetail,
  getCustomerDetailMetadata,
  MarketingCustomerDetail
} from "../../components/marketing-customer-detail";
import {
  getFeatureDetail,
  getFeatureDetailMetadata,
  MarketingFeatureDetail
} from "../../components/marketing-feature-detail";
import {
  getMarketingReferenceMetadata,
  MarketingReferencePage
} from "../../components/marketing-reference-page";

type ReferenceRouteProps = {
  params: Promise<{ slug: string[] }>;
};

const reservedRoots = new Set([
  "analytics",
  "app",
  "auth",
  "compare",
  "enterprise",
  "demos",
  "home",
  "hubs",
  "integrations",
  "onboarding",
  "product",
  "product-demo",
  "routes",
  "settings",
  "showcases",
  "signup",
  "use-cases",
  "tools",
  "ui-lab",
  "videos",
  "workbench"
]);

// These legacy links resolve to the public Supademo 404 on the reference
// site. Keep them explicit so the fallback never invents a page for an
// invalid or viewer-only identifier.
const notFoundRoots = new Set([
  "resources",
  "article",
  "company",
  "products",
  "detail",
  "embed",
  "search",
  "new",
  "login",
  "supademohq",
  "@supademohq",
  "%40supademohq"
]);

export async function generateMetadata({ params }: ReferenceRouteProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug[0] === "features" && slug.length === 2 && getFeatureDetail(slug[1] ?? "")) {
    return getFeatureDetailMetadata(slug[1] ?? "");
  }
  if (slug[0] === "customers" && slug.length === 2 && getCustomerDetail(slug[1] ?? "")) {
    return getCustomerDetailMetadata(slug[1] ?? "");
  }
  return getMarketingReferenceMetadata(slug);
}

export default async function MarketingReferenceRoute({ params }: ReferenceRouteProps) {
  const { slug } = await params;
  if (slug.length === 0 || reservedRoots.has(slug[0] ?? "") || notFoundRoots.has(slug[0] ?? ""))
    notFound();
  if (slug[0] === "features" && slug.length === 2) {
    const featureSlug = slug[1] ?? "";
    if (getFeatureDetail(featureSlug)) return <MarketingFeatureDetail slug={featureSlug} />;
  }
  if (slug[0] === "customers" && slug.length === 2) {
    const customerSlug = slug[1] ?? "";
    if (getCustomerDetail(customerSlug)) return <MarketingCustomerDetail slug={customerSlug} />;
  }
  return <MarketingReferencePage slug={slug} />;
}
