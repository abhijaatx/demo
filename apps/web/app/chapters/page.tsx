import type { Metadata } from "next";
import { ChaptersWorkbench } from "../../components/chapters-workbench";

export const metadata: Metadata = {
  title: "Chapters | Supademo",
  description: "Add context, forms, branching, and CTAs between demo steps."
};

export default function ChaptersPage() {
  return <ChaptersWorkbench />;
}
