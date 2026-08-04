import type { Metadata } from "next";
import { CropMediaWorkbench } from "../../components/crop-media-workbench";

export const metadata: Metadata = {
  title: "Crop Media | Supademo",
  description: "Crop and align local demo screenshots and videos consistently."
};

export default function CropMediaPage() {
  return <CropMediaWorkbench />;
}
