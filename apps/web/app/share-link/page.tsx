import type { Metadata } from "next";
import { ShareLinksWorkbench } from "../../components/share-links-workbench";

export const metadata: Metadata = {
  title: "Share Link | Supademo",
  description: "Create trackable, expiring, and gated demo share links."
};

export default function ShareLinkPage() {
  return <ShareLinksWorkbench />;
}
