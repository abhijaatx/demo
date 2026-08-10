import type { Metadata } from "next";
import { AppShell } from "../../components/app-shell";
import { DemoDashboardScreen } from "../../components/demo-dashboard-screen";
import { WorkspaceReferenceSurface } from "../../components/workspace-reference-surface";

export const metadata: Metadata = {
  title: "Demos | Supademo",
  robots: { index: false, follow: false }
};

export default function DemosPage() {
  const demoOnly = process.env.APP_ENV === "local" && process.env.DEMO_ONLY === "true";

  const legacyDashboard = false;
  return legacyDashboard ? (
    <AppShell pageTitle="Demos">
      <DemoDashboardScreen demoOnly={demoOnly} />
    </AppShell>
  ) : (
    <WorkspaceReferenceSurface kind="demos" />
  );
}
