import type { Metadata } from "next";
import { MarketingCareersPage } from "../../components/marketing-careers";

export const metadata: Metadata = {
  title: "Grow Your Career Working at Supademo",
  description:
    "Join Supademo and help teams demonstrate products more effectively with interactive demos."
};

export default function CareersPage() {
  return <MarketingCareersPage />;
}
