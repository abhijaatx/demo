import type { Metadata } from "next";
import { MarketingContentDirectoryPage } from "../../components/marketing-content-directory";

export const metadata: Metadata = {
  title: "Free Growth Playbooks & Marketing Resources for Startups | Supademo",
  description:
    "Strategic playbooks and content to help you create better demos, convert more prospects, and amplify your reach."
};

export default function ContentPage() {
  return <MarketingContentDirectoryPage />;
}
