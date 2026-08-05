import type { Metadata } from "next";
import { AccountAnalyticsWorkbench } from "../../components/account-analytics-workbench";

export const metadata: Metadata = {
  title: "Lead and Account Analytics | Supademo",
  description: "Trace viewer and account engagement across Supademo demos.",
  robots: { index: false, follow: false }
};

export default function AccountAnalyticsPage() {
  return <AccountAnalyticsWorkbench />;
}
