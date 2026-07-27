import type { Metadata } from "next";
import { AppShell } from "../../components/app-shell";
import { DemoDashboardScreen } from "../../components/demo-dashboard-screen";

export const metadata: Metadata = {
  title: "Demos | Supademo",
  robots: { index: false, follow: false }
};

export default function DemosPage() {
  return (
    <AppShell pageTitle="Demos">
      <DemoDashboardScreen />
    </AppShell>
  );
}
