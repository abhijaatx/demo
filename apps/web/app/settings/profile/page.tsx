import type { Metadata } from "next";
import { AppShell } from "../../../components/app-shell";
import { ProfileSettingsScreen } from "../../../components/profile-settings-screen";

export const metadata: Metadata = {
  title: "Profile settings | Supademo",
  robots: { index: false, follow: false }
};

export default function ProfileSettingsPage() {
  return (
    <AppShell>
      <ProfileSettingsScreen />
    </AppShell>
  );
}
