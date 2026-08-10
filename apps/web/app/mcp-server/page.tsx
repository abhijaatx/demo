import type { Metadata } from "next";
import { McpWorkbench } from "../../components/mcp-workbench";

export const metadata: Metadata = {
  title: "MCP Server | Supademo",
  description: "Connect AI assistants to Supademo with explicit local OAuth scopes."
};

export default function McpServerPage() {
  return <McpWorkbench />;
}
