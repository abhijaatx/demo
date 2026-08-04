import type { Metadata } from "next";
import { HomeWorkspace } from "../../components/home-workspace";

export const metadata: Metadata = {
  title: "Home | Supademo",
  robots: { index: false, follow: false }
};

export default function HomePage() {
  return <HomeWorkspace />;
}
