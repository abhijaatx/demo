import type { Metadata } from "next";
import { OfflinePlayer } from "../../components/offline-player";

export const metadata: Metadata = {
  title: "Offline Demos | Supademo",
  robots: { index: false, follow: false }
};

export default function OfflinePage() {
  return <OfflinePlayer />;
}
