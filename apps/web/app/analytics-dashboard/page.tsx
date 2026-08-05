import type { Metadata } from "next";
import { AnalyticsDashboardWorkbench } from "../../components/analytics-dashboard-workbench";

export const metadata: Metadata = {
  title: "Analytics Dashboard | Supademo",
  description: "Explore Supademo views, engagement, and source analytics.",
  robots: { index: false, follow: false }
};

export default function AnalyticsDashboardPage() {
  return <AnalyticsDashboardWorkbench />;
}
