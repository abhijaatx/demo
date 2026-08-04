import type { Metadata } from "next";
import { MarketingDownloadPage } from "../../components/marketing-download";

export const metadata: Metadata = {
  title: "Download the Supademo Desktop App",
  description:
    "Choose the Supademo Chrome extension or desktop recorder for creating product demos."
};

export default function DownloadPage() {
  return <MarketingDownloadPage />;
}
