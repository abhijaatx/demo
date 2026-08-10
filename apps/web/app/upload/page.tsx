import type { Metadata } from "next";
import { UploadImportWorkbench } from "../../components/upload-import-workbench";

export const metadata: Metadata = {
  title: "Create from Uploads | Supademo",
  description: "Create an interactive demo from screenshots, videos, and presentation files."
};

export default function UploadPage() {
  return <UploadImportWorkbench />;
}
