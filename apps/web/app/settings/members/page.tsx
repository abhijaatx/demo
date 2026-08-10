import type { Metadata } from "next";
import { AppShell } from "../../../components/app-shell";
import { MemberAdministrationScreen } from "../../../components/member-administration-screen";

export const metadata: Metadata = {
  title: "Members | Supademo",
  robots: { index: false, follow: false }
};

export default function MemberSettingsPage() {
  return (
    <AppShell pageTitle="Workspace members">
      <MemberAdministrationScreen />
    </AppShell>
  );
}
