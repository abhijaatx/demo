import type { Metadata } from "next";
import { BrandingWorkbench } from "../../components/branding-workbench";

export const metadata: Metadata = {
  title: "Branding | Supademo",
  description: "Customize the identity, watermark, and call to action on shared Supademo pages.",
  robots: { index: false, follow: false }
};

export default function BrandingPage() {
  return <BrandingWorkbench />;
}
