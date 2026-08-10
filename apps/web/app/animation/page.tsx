import type { Metadata } from "next";
import { AnimationWorkbench } from "../../components/animation-workbench";

export const metadata: Metadata = {
  title: "Animation | Supademo",
  description: "Tune zoom, pan, hotspot, and chapter animations for a demo."
};

export default function AnimationPage() {
  return <AnimationWorkbench />;
}
