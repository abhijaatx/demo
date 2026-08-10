import type { Metadata } from "next";
import { MarketingAcademy } from "../../components/marketing-academy";

export const metadata: Metadata = {
  title: "Supademo Academy | Learn to Create Interactive Demos",
  description: "Learn how to create stunning interactive demos with Supademo Academy."
};

export default function AcademyPage() {
  return <MarketingAcademy />;
}
