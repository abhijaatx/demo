import type { Metadata } from "next";
import { MarketingTutorials } from "../../components/marketing-tutorials";

export const metadata: Metadata = {
  title: "Software Tutorials | Step-by-Step Interactive Guides | Supademo",
  description: "Explore step-by-step interactive tutorials for the tools your team uses every day."
};

export default function TutorialsPage() {
  return <MarketingTutorials />;
}
