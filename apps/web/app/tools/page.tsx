import type { Metadata } from "next";
import { MarketingTools } from "../../components/marketing-tools";

export const metadata: Metadata = {
  title: "Free Tools for Better Product Demos | Supademo",
  description:
    "Create interactive demos, screenshots, guides, calculators, and product videos with Supademo's free tools."
};

export default function ToolsPage() {
  return <MarketingTools />;
}
