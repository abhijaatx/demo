import type { Metadata } from "next";
import { MarketingBlogPage } from "../../components/marketing-blog";

export const metadata: Metadata = {
  title: "Supademo Blog | Interactive Demo Insights & Product Updates",
  description:
    "Product updates, interactive demo tutorials, and GTM insights to help you create better demos and grow faster."
};

export default function BlogPage() {
  return <MarketingBlogPage />;
}
