"use client";

import {
  Badge,
  Button,
  Card,
  DeviceFrame,
  Link as UiLink,
  Stack,
  Switch,
  Tabs,
  Thumbnail
} from "@supademo/ui";
import { useState } from "react";

export const UI_LAB_STAGES = ["Record", "Edit", "Share"] as const;
export type UiLabStage = (typeof UI_LAB_STAGES)[number];

const captureOptions = [
  { title: "Screenshot", description: "Capture one clear moment from a workflow." },
  { title: "Import flow", description: "Start from an existing set of screens." },
  { title: "Template", description: "Use a guided structure and make it yours." }
] as const;

export function UiLab() {
  const [stage, setStage] = useState<UiLabStage>("Record");
  const [advanced, setAdvanced] = useState(false);
  const [saved, setSaved] = useState(true);

  const moveTo = (nextStage: UiLabStage): void => {
    setStage(nextStage);
    setSaved(false);
  };

  return (
    <main className="ui-lab" data-lab-stage={stage.toLowerCase()}>
      <header className="ui-lab-header">
        <div className="ui-lab-header-copy">
          <UiLink href="/" variant="muted">
            ← Home
          </UiLink>
          <div>
            <p className="eyebrow">Reference UI laboratory</p>
            <h1>Record → Edit → Share</h1>
            <p>One calm path from a captured moment to a useful demo.</p>
          </div>
        </div>
        <div className="ui-lab-header-actions">
          <Badge variant={saved ? "success" : "warning"}>{saved ? "Saved" : "Saving"}</Badge>
          <Switch
            label="Show advanced controls"
            checked={advanced}
            onChange={(event) => setAdvanced(event.currentTarget.checked)}
          />
        </div>
      </header>

      <nav className="ui-lab-stage-nav" aria-label="Demo creation stages">
        {UI_LAB_STAGES.map((item, index) => (
          <button
            type="button"
            key={item}
            aria-current={stage === item ? "step" : undefined}
            onClick={() => setStage(item)}
          >
            <span aria-hidden="true">0{index + 1}</span>
            {item}
          </button>
        ))}
      </nav>

      {stage === "Record" ? (
        <section className="ui-lab-stage" aria-labelledby="ui-lab-record-heading">
          <div className="ui-lab-stage-heading">
            <div>
              <p className="eyebrow">01 · Record</p>
              <h2 id="ui-lab-record-heading">Choose a starting point</h2>
              <p>Keep the capture mode explicit. You can change it before you begin.</p>
            </div>
            <Badge variant="brand">Simple mode</Badge>
          </div>
          <div className="ui-lab-choice-grid">
            {captureOptions.map((option, index) => (
              <Card key={option.title} title={option.title} description={option.description}>
                <Thumbnail
                  src={`/ui-lab/capture-${index + 1}.png`}
                  alt={`${option.title} preview`}
                  size="md"
                />
                <Button onClick={() => moveTo("Edit")}>
                  {index === 0 ? "Start with screenshot" : `Choose ${option.title.toLowerCase()}`}
                </Button>
              </Card>
            ))}
          </div>
          {advanced ? (
            <Card
              title="Advanced capture settings"
              description="Only open these when the workflow requires them."
            >
              <Stack direction="row" gap="3" wrap>
                <Badge>Browser tab</Badge>
                <Badge>High resolution</Badge>
                <Badge>Include narration</Badge>
              </Stack>
            </Card>
          ) : null}
        </section>
      ) : null}

      {stage === "Edit" ? (
        <section className="ui-lab-stage" aria-labelledby="ui-lab-edit-heading">
          <div className="ui-lab-stage-heading">
            <div>
              <p className="eyebrow">02 · Edit</p>
              <h2 id="ui-lab-edit-heading">Add just enough guidance</h2>
              <p>The selected screen stays in the center while context stays in the inspector.</p>
            </div>
            <Button variant="secondary" onClick={() => moveTo("Share")}>
              Preview and share
            </Button>
          </div>
          <div className="ui-lab-editor" aria-label="Demo editor reference layout">
            <aside className="ui-lab-step-rail" aria-label="Demo steps">
              <strong>Steps</strong>
              <ol>
                {["Welcome", "Create a campaign", "Review results"].map((item, index) => (
                  <li key={item}>
                    <button type="button" aria-current={index === 0 ? "step" : undefined}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {item}
                    </button>
                  </li>
                ))}
              </ol>
              <Button variant="ghost" size="sm">
                Add step
              </Button>
            </aside>
            <div className="ui-lab-canvas">
              <DeviceFrame device="desktop" label="Selected screen preview">
                <div className="ui-lab-screen-preview">
                  <span className="ui-lab-screen-bar" />
                  <span className="ui-lab-screen-title">Campaign workspace</span>
                  <span className="ui-lab-screen-card" />
                  <span className="ui-lab-screen-card short" />
                </div>
              </DeviceFrame>
            </div>
            <aside className="ui-lab-inspector" aria-label="Context inspector">
              <Card title="Selected screen" description="Only settings for the current object.">
                <Stack gap="3">
                  <Button variant="secondary" size="sm">
                    Edit text
                  </Button>
                  <Button variant="secondary" size="sm">
                    Add hotspot
                  </Button>
                  <Button variant="secondary" size="sm">
                    Blur sensitive info
                  </Button>
                  {advanced ? (
                    <Button variant="ghost" size="sm">
                      Open layer controls
                    </Button>
                  ) : null}
                </Stack>
              </Card>
            </aside>
          </div>
        </section>
      ) : null}

      {stage === "Share" ? (
        <section className="ui-lab-stage" aria-labelledby="ui-lab-share-heading">
          <div className="ui-lab-stage-heading">
            <div>
              <p className="eyebrow">03 · Share</p>
              <h2 id="ui-lab-share-heading">Choose how people receive it</h2>
              <p>Preview the result, then publish one clear access path.</p>
            </div>
            <Button onClick={() => setSaved(true)}>Publish demo</Button>
          </div>
          <Card title="Share panel" description="Link, Embed, Export, and Present stay together.">
            <Tabs
              label="Share options"
              items={[
                {
                  value: "link",
                  label: "Link",
                  panel: <p className="ui-lab-tab-panel">Public link · Last published just now</p>
                },
                {
                  value: "embed",
                  label: "Embed",
                  panel: <p className="ui-lab-tab-panel">Responsive embed preview</p>
                },
                {
                  value: "export",
                  label: "Export",
                  panel: <p className="ui-lab-tab-panel">Download a presentation-ready copy</p>
                },
                {
                  value: "present",
                  label: "Present",
                  panel: <p className="ui-lab-tab-panel">Open a focused viewer preview</p>
                }
              ]}
            />
          </Card>
          {advanced ? (
            <Card
              title="Advanced access controls"
              description="Explain the outcome before exposing raw configuration."
            >
              <Stack direction="row" gap="3" wrap>
                <Badge>Require email</Badge>
                <Badge>Expire link</Badge>
                <Badge>No search indexing</Badge>
              </Stack>
            </Card>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
