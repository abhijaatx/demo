"use client";

import { useMemo, useState } from "react";

const MAX_PROMPT_LENGTH = 600;

type ProviderId = "claude" | "chatgpt" | "gemini" | "cursor" | "copilot";
type ToolGroupId = "workspace" | "edit" | "personalize" | "analytics" | "share";

type Provider = {
  readonly id: ProviderId;
  readonly label: string;
  readonly description: string;
  readonly setup: string;
};

type ToolGroup = {
  readonly id: ToolGroupId;
  readonly label: string;
  readonly tools: readonly { readonly name: string; readonly description: string }[];
};

const providers: readonly Provider[] = [
  {
    id: "claude",
    label: "Claude Web / Desktop",
    description: "Connect an assistant that can review and edit your workspace.",
    setup: "Add the Supademo MCP server in Claude Settings → Connectors."
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    description: "Use natural-language commands to work with demos and analytics.",
    setup: "Add the Supademo connector in ChatGPT Settings → Apps."
  },
  {
    id: "gemini",
    label: "Gemini",
    description: "Ask Gemini to personalize, analyze, and organize demos.",
    setup: "Add the Supademo MCP endpoint to your Gemini connector settings."
  },
  {
    id: "cursor",
    label: "Cursor",
    description: "Keep demo editing tools available beside your codebase.",
    setup: "Add Supademo to Cursor MCP settings, then authenticate in the browser."
  },
  {
    id: "copilot",
    label: "GitHub Copilot",
    description: "Use Copilot for repeatable demo and showcase workflows.",
    setup: "Add the Supademo MCP server to your Copilot agent configuration."
  }
];

const toolGroups: readonly ToolGroup[] = [
  {
    id: "workspace",
    label: "Workspace & demos",
    tools: [
      {
        name: "list_workspaces",
        description: "List workspaces you can access with role and plan."
      },
      { name: "list_demos", description: "Search, filter, scope, and paginate demos." },
      {
        name: "get_demo",
        description: "Fetch steps, hotspots, chapters, buttons, forms, and links."
      },
      { name: "duplicate_demo", description: "Clone a demo with its complete content tree." },
      { name: "merge_demos", description: "Combine 2–50 demos into a new ordered demo." },
      {
        name: "move_demos",
        description: "Move up to 100 demos between personal, shared, and folders."
      }
    ]
  },
  {
    id: "edit",
    label: "Edit & publish",
    tools: [
      {
        name: "update_demo_settings",
        description: "Update title, description, folder, sharing, or version settings."
      },
      {
        name: "update_hotspots",
        description: "Change hotspot copy, color, backdrop, position, and behavior."
      },
      {
        name: "update_voiceovers",
        description: "Create or update step scripts and voice settings."
      },
      {
        name: "update_chapters",
        description: "Create context, CTA, form, gate, and branching chapters."
      },
      { name: "publish_demo", description: "Publish an approved version after reviewing changes." }
    ]
  },
  {
    id: "personalize",
    label: "Personalize",
    tools: [
      {
        name: "generate_personalized_link",
        description: "Generate a trackable link with allowlisted variables."
      },
      {
        name: "bulk_generate_links",
        description: "Create links for multiple contacts without exposing tokens."
      },
      {
        name: "translate_demo",
        description: "Translate demo text and voiceovers into a target language."
      },
      {
        name: "update_forms",
        description: "Configure lead capture fields and business-email rules."
      }
    ]
  },
  {
    id: "analytics",
    label: "Analytics",
    tools: [
      {
        name: "get_top_performing_demos",
        description: "Rank demos by views, engagement, and conversion."
      },
      {
        name: "get_demo_analytics",
        description: "Read aggregate engagement and step performance."
      },
      { name: "get_demo_sessions", description: "List viewer sessions with bounded pagination." },
      {
        name: "get_device_analytics",
        description: "Break down viewers by device, browser, and country."
      },
      {
        name: "get_demo_hotspot_performance",
        description: "Measure hotspot clicks and completion."
      }
    ]
  },
  {
    id: "share",
    label: "Showcases & hubs",
    tools: [
      {
        name: "get_top_performing_showcases",
        description: "Rank showcases by views and engagement."
      },
      { name: "get_showcase_analytics", description: "Read aggregate showcase analytics." },
      { name: "get_showcase_demo_performance", description: "Compare demos inside a showcase." },
      { name: "get_showcase_sessions", description: "Review showcase viewer sessions." },
      {
        name: "list_showcase_analytics_sources",
        description: "List demos and hubs included in analytics."
      }
    ]
  }
];

const scopeLabels = [
  ["read", "Read demos and workspaces"],
  ["write", "Edit and publish demos"],
  ["analytics", "Read analytics and viewer sessions"]
] as const;

function makeSetup(provider: Provider, scopes: readonly string[]): string {
  return [
    "Supademo MCP connection",
    `Provider: ${provider.label}`,
    `Scopes: ${scopes.join(", ") || "read"}`,
    "Authentication: OAuth in the provider (no token is shown in this preview).",
    provider.setup
  ].join("\n");
}

export function McpWorkbench() {
  const [connectedProvider, setConnectedProvider] = useState<ProviderId | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>("claude");
  const [scopes, setScopes] = useState<readonly string[]>(["read", "analytics"]);
  const [toolGroup, setToolGroup] = useState<ToolGroupId>("workspace");
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState(
    "Connect a provider, choose the minimum scopes, then prompt your assistant."
  );
  const [error, setError] = useState("");
  const [promptPlan, setPromptPlan] = useState<string | null>(null);

  const provider = providers.find((item) => item.id === selectedProvider) ?? providers[0]!;
  const selectedTools = toolGroups.find((group) => group.id === toolGroup) ?? toolGroups[0]!;
  const isConnected = connectedProvider === selectedProvider;
  const scopeText = useMemo(() => scopes.join(", ") || "read", [scopes]);

  const toggleScope = (scope: string): void => {
    setScopes((current) =>
      current.includes(scope) ? current.filter((value) => value !== scope) : [...current, scope]
    );
    setMessage("Scopes updated. Reconnect to apply changed permissions.");
  };

  const connect = (): void => {
    if (!scopes.includes("read")) {
      setError("Read access is required to connect an MCP client.");
      return;
    }
    setConnectedProvider(selectedProvider);
    setError("");
    setMessage(`${provider.label} is connected in this browser-local preview.`);
  };

  const disconnect = (): void => {
    setConnectedProvider(null);
    setPromptPlan(null);
    setMessage("Connection revoked. No provider token is stored by this preview.");
  };

  const copySetup = async (): Promise<void> => {
    const setup = makeSetup(provider, scopes);
    try {
      await navigator.clipboard?.writeText(setup);
      setMessage("Safe setup instructions copied. They contain no secret or access token.");
    } catch {
      setMessage("Setup instructions are ready below; clipboard permission was unavailable.");
    }
  };

  const planPrompt = (): void => {
    const bounded = prompt.trim().slice(0, MAX_PROMPT_LENGTH);
    if (!bounded) {
      setError("Write a prompt before planning it.");
      return;
    }
    if (!isConnected) {
      setError("Connect a provider before sending an MCP prompt.");
      return;
    }
    setPromptPlan(
      `Reviewable plan: inspect the referenced demo, use the ${selectedTools.label.toLowerCase()} tools, and request approval before any write or publish action.`
    );
    setError("");
    setMessage("Prompt plan created locally. Mutating tools still require provider approval.");
  };

  return (
    <main className="motion-workbench-page mcp-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/demos">
          ← Back to demos
        </a>
        <span className="motion-workbench-kicker">MCP Server · Workspace connections</span>
        <h1>Let your AI assistant work with Supademo</h1>
        <p>
          Connect Claude, ChatGPT, Gemini, Cursor, or Copilot with OAuth, choose least-privilege
          scopes, and prompt the same editing and analytics tools available in Supademo.
        </p>
      </header>

      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <span className="mcp-workbench-local-badge">Browser-local connection preview</span>
      </div>
      {error ? (
        <p className="mcp-workbench-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="mcp-workbench-layout" aria-label="MCP Server setup">
        <aside className="motion-workbench-panel mcp-workbench-providers">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Step 1</span>
              <h2>Choose a client</h2>
            </div>
            <span className="motion-workbench-count">OAuth</span>
          </div>
          <div className="mcp-workbench-provider-list" role="listbox" aria-label="AI providers">
            {providers.map((item) => (
              <button
                type="button"
                role="option"
                aria-selected={item.id === selectedProvider}
                className={`mcp-workbench-provider${item.id === selectedProvider ? " is-selected" : ""}`}
                key={item.id}
                onClick={() => {
                  setSelectedProvider(item.id);
                  setError("");
                }}
              >
                <span className="mcp-workbench-provider-mark">{item.label.slice(0, 1)}</span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="motion-workbench-panel mcp-workbench-connection">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Step 2</span>
              <h2>Authorize {provider.label}</h2>
            </div>
            <span className={`mcp-workbench-status${isConnected ? " is-connected" : ""}`}>
              {isConnected ? "Connected" : "Not connected"}
            </span>
          </div>
          <p className="mcp-workbench-copy">{provider.setup}</p>
          <fieldset className="mcp-workbench-scopes">
            <legend>Requested scopes</legend>
            {scopeLabels.map(([id, label]) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={scopes.includes(id)}
                  onChange={() => toggleScope(id)}
                />
                <span>
                  <strong>{label}</strong>
                  <small>
                    {id === "write"
                      ? "Changes stay behind an approval step."
                      : "Only the selected data is available."}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="mcp-workbench-actions">
            <button
              type="button"
              className="motion-workbench-button motion-workbench-button-primary"
              onClick={isConnected ? disconnect : connect}
            >
              {isConnected ? "Revoke connection" : "Connect with OAuth"}
            </button>
            <button type="button" className="motion-workbench-button" onClick={copySetup}>
              Copy setup
            </button>
          </div>
          <details className="mcp-workbench-setup-details">
            <summary>Review connection details</summary>
            <pre>{makeSetup(provider, scopes)}</pre>
          </details>
        </section>

        <aside className="motion-workbench-panel mcp-workbench-tools">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Step 3</span>
              <h2>Available tools</h2>
            </div>
            <span className="motion-workbench-count">{selectedTools.tools.length}</span>
          </div>
          <div className="mcp-workbench-tool-tabs" role="tablist" aria-label="MCP tool groups">
            {toolGroups.map((group) => (
              <button
                type="button"
                role="tab"
                aria-selected={group.id === toolGroup}
                className={group.id === toolGroup ? "is-selected" : ""}
                key={group.id}
                onClick={() => setToolGroup(group.id)}
              >
                {group.label}
              </button>
            ))}
          </div>
          <ul className="mcp-workbench-tool-list">
            {selectedTools.tools.map((tool) => (
              <li key={tool.name}>
                <code>{tool.name}</code>
                <span>{tool.description}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section
        className="mcp-workbench-prompt motion-workbench-panel"
        aria-label="Prompt assistant"
      >
        <div className="motion-workbench-panel-heading">
          <div>
            <span className="motion-workbench-label">Step 4</span>
            <h2>Prompt your assistant</h2>
          </div>
          <span className="mcp-workbench-scope-note">Scopes: {scopeText}</span>
        </div>
        <label className="motion-workbench-field">
          <span>
            Example request{" "}
            <output>
              {prompt.length}/{MAX_PROMPT_LENGTH}
            </output>
          </span>
          <textarea
            rows={3}
            maxLength={MAX_PROMPT_LENGTH}
            value={prompt}
            onChange={(event) => setPrompt(event.currentTarget.value)}
            placeholder="Update the hotspots in my onboarding demo and show me the proposed changes first."
          />
        </label>
        <button
          type="button"
          className="motion-workbench-button motion-workbench-button-primary"
          onClick={planPrompt}
        >
          Plan request
        </button>
        {promptPlan ? (
          <p className="mcp-workbench-plan" role="status">
            {promptPlan}
          </p>
        ) : null}
        <p className="mcp-workbench-disclaimer">
          This implementation is a local product preview: it never creates an OAuth token, calls an
          external MCP server, or applies a remote change.
        </p>
      </section>
    </main>
  );
}
