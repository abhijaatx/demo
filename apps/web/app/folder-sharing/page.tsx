import type { Metadata } from "next";
import { FolderSharingWorkbench } from "../../components/folder-sharing-workbench";

export const metadata: Metadata = {
  title: "Folder Sharing | Supademo",
  description: "Share a Supademo folder and its nested demo library with one public link.",
  robots: { index: false, follow: false }
};

export default function FolderSharingPage() {
  return <FolderSharingWorkbench />;
}
