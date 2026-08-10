import type { Metadata } from "next";
import { MarketingHelp } from "../../components/marketing-help";

export const metadata: Metadata = {
  title: "Help | Supademo",
  description: "Find Supademo docs, product updates, support, and an interactive product tour."
};

export default function HelpPage() {
  return <MarketingHelp />;
}
