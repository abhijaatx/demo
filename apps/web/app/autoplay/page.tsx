import type { Metadata } from "next";
import { AutoplayWorkbench } from "../../components/autoplay-workbench";

export const metadata: Metadata = {
  title: "Autoplay & Loop | Supademo",
  description: "Configure autoplay, loop, duration, and transition timing for a demo."
};

export default function AutoplayPage() {
  return <AutoplayWorkbench />;
}
