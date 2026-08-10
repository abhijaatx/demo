import type { Metadata } from "next";
import { SessionMetricsWorkbench } from "../../components/session-metrics-workbench";

export const metadata: Metadata = {
  title: "Session Metrics | Supademo",
  description: "Inspect viewer-level demo engagement and session analytics."
};

export default function SessionMetricsPage() {
  return <SessionMetricsWorkbench />;
}
