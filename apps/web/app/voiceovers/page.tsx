import type { Metadata } from "next";
import { VoiceoversWorkbench } from "../../components/voiceovers-workbench";

export const metadata: Metadata = {
  title: "Voiceovers 2.0 | Supademo",
  description: "Configure AI voices, pronunciation, uploads, and recording workflows."
};

export default function VoiceoversPage() {
  return <VoiceoversWorkbench />;
}
