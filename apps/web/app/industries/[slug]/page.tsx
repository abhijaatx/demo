import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingIndustryPage } from "../../../components/marketing-industry";

const industryMetadata = {
  software: {
    title: "Accelerate Adoption and Growth Across Your Software Stack | Supademo",
    description:
      "Supademo helps software teams simplify training, support, adoption, and enablement with interactive demos that scale across your organization."
  },
  healthcare: {
    title: "Interactive Healthcare Demos That Cut Training Time and Boost Adoption | Supademo",
    description:
      "Simplify staff training, compliance, and patient onboarding with step-by-step interactive demos that scale across your organization."
  },
  "finance-banking": {
    title: "Drive Financial Compliance and Customer Clarity with Interactive Demos | Supademo",
    description:
      "From fintech startups to enterprise banks, Supademo helps teams onboard customers, train agents, and market products faster."
  },
  government: {
    title: "Modernize Training and Public Service With Guided Demos and Tutorials | Supademo",
    description:
      "Simplify how teams, citizens, and partners use standard government services with secure, interactive demos."
  }
} as const;

type IndustrySlug = keyof typeof industryMetadata;

type IndustryRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: IndustryRouteProps): Promise<Metadata> {
  const { slug } = await params;
  return industryMetadata[slug as IndustrySlug] ?? {};
}

export default async function IndustryRoute({ params }: IndustryRouteProps) {
  const { slug } = await params;
  if (!(slug in industryMetadata)) notFound();
  return <MarketingIndustryPage slug={slug as IndustrySlug} />;
}
