import type { Metadata } from "next";
import { WorkspaceOnboardingScreen } from "../../../components/workspace-onboarding-screen";

export const metadata: Metadata = {
  title: "Create a workspace | Supademo",
  robots: { index: false, follow: false }
};

export default function WorkspaceOnboardingPage() {
  return <WorkspaceOnboardingScreen />;
}
