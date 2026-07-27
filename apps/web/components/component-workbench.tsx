"use client";

import {
  AlertIcon,
  AspectRatio,
  Badge,
  Banner,
  Button,
  Card,
  Checkbox,
  CloseIcon,
  DeviceFrame,
  Dropdown,
  EmptyState,
  IconButton,
  Image as MediaImage,
  InlineAlert,
  Input,
  MediaFallback,
  Modal,
  Progress,
  Select,
  Skeleton,
  Stack,
  Switch,
  Table,
  Tabs,
  Thumbnail,
  Tooltip
} from "@supademo/ui";
import { useEffect, useState } from "react";

type WorkbenchMode = "simple" | "advanced";
type WorkbenchTheme = "light" | "dark";

const rows = [
  { id: "demo-1", name: "Product tour", status: "Published", viewers: "1,240" },
  { id: "demo-2", name: "Campaign launch", status: "Draft", viewers: "—" }
] as const;

const baselineSelectors = [
  "[data-workbench-section=controls]",
  "[data-workbench-section=feedback]",
  "[data-workbench-section=data]",
  "[data-workbench-section=media]",
  "[data-workbench-section=disclosure]"
] as const;

export function ComponentWorkbench() {
  const [mode, setMode] = useState<WorkbenchMode>("simple");
  const [theme, setTheme] = useState<WorkbenchTheme>("light");
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(new Set(["demo-1"]));
  const [showNotice, setShowNotice] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    root.dataset.theme = theme;
    return () => {
      if (previous) root.dataset.theme = previous;
      else delete root.dataset.theme;
    };
  }, [theme]);

  const toggleRow = (id: string) => {
    setSelectedRows((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllRows = (ids: readonly (string | number)[]) => {
    const stringIds = ids.map(String);
    setSelectedRows((current) => {
      const allSelected = stringIds.length > 0 && stringIds.every((id) => current.has(id));
      return allSelected ? new Set() : new Set(stringIds);
    });
  };

  return (
    <main
      className="workbench"
      data-theme={theme}
      data-workbench-baselines={baselineSelectors.join(",")}
    >
      <header className="workbench-header">
        <div>
          <p className="eyebrow">Internal UI workbench</p>
          <h1>Shared components, in context</h1>
          <p className="workbench-intro">
            Exercise normal, loading, error, disabled, dark-mode, and progressive-disclosure states
            before a component reaches the creator or viewer experience.
          </p>
        </div>
        <div className="workbench-header-actions" aria-label="Workbench controls">
          <div className="workbench-segmented" aria-label="Disclosure mode">
            <button
              type="button"
              aria-pressed={mode === "simple"}
              onClick={() => setMode("simple")}
            >
              Simple
            </button>
            <button
              type="button"
              aria-pressed={mode === "advanced"}
              onClick={() => setMode("advanced")}
            >
              Advanced
            </button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            aria-pressed={theme === "dark"}
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </Button>
        </div>
      </header>

      {showNotice ? (
        <Banner
          variant="success"
          title="Baseline-ready surface"
          onDismiss={() => setShowNotice(false)}
        >
          Every section uses a stable `data-workbench-section` selector for deterministic visual
          checks.
        </Banner>
      ) : null}

      <div className="workbench-grid">
        <section
          className="workbench-section"
          data-workbench-section="controls"
          aria-labelledby="controls-heading"
        >
          <div className="workbench-section-heading">
            <div>
              <p className="eyebrow">Controls</p>
              <h2 id="controls-heading">Native, labeled actions</h2>
            </div>
            <Badge variant="brand">Normal · Disabled · Loading</Badge>
          </div>
          <div className="workbench-card-grid">
            <Card title="Primary actions" description="One clear action per surface.">
              <Stack direction="row" gap="3" wrap>
                <Button
                  onClick={() => setLoading((current) => !current)}
                  loading={loading}
                  loadingLabel="Saving demo"
                >
                  Save demo
                </Button>
                <Button variant="secondary" disabled>
                  Disabled
                </Button>
                <Tooltip content="Close preview">
                  <IconButton aria-label="Close preview">
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Card>
            <Card
              title="Form states"
              description="Labels, descriptions, and errors stay connected."
            >
              <Stack gap="3">
                <Input
                  id="workbench-demo-name"
                  label="Demo name"
                  defaultValue="Product tour"
                  description="Shown to viewers on the share page."
                  error={showError ? "Use a name with at least 3 characters." : undefined}
                />
                <Checkbox label="Notify the owner" defaultChecked />
                <Switch
                  label="Publish when ready"
                  defaultChecked
                  description="This is reversible."
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowError((current) => !current)}
                >
                  {showError ? "Clear field error" : "Show field error"}
                </Button>
              </Stack>
            </Card>
          </div>
        </section>

        <section
          className="workbench-section"
          data-workbench-section="feedback"
          aria-labelledby="feedback-heading"
        >
          <div className="workbench-section-heading">
            <div>
              <p className="eyebrow">Feedback</p>
              <h2 id="feedback-heading">Clear recovery states</h2>
            </div>
            <Badge variant="warning">Loading · Error · Empty</Badge>
          </div>
          <div className="workbench-card-grid">
            <Card title="Loading content" description="Skeletons preserve the final shape.">
              {loading ? (
                <Skeleton variant="rect" lines={2} />
              ) : (
                <Progress label="Upload progress" value={64} />
              )}
              <Button variant="ghost" size="sm" onClick={() => setLoading((current) => !current)}>
                {loading ? "Show loaded state" : "Show loading state"}
              </Button>
            </Card>
            <Card
              title="Error and empty states"
              description="The next useful action is always visible."
            >
              <Stack gap="3">
                <InlineAlert title="Could not load viewers">
                  Try again or check your connection.
                </InlineAlert>
                <EmptyState
                  title="No branches yet"
                  description="Add a branch when different viewers need different paths."
                  action={<Button size="sm">Add branch</Button>}
                />
              </Stack>
            </Card>
          </div>
        </section>

        <section
          className="workbench-section"
          data-workbench-section="data"
          aria-labelledby="data-heading"
        >
          <div className="workbench-section-heading">
            <div>
              <p className="eyebrow">Data display</p>
              <h2 id="data-heading">Readable at a glance</h2>
            </div>
            <Badge variant="success">Selection · Tabs</Badge>
          </div>
          <Card
            title="Recent demos"
            description="Selection is local UI state and never replaces server authorization."
          >
            <Table
              caption="Recent demos"
              rows={rows}
              columns={[
                { key: "name", header: "Demo", sortable: true, render: (row) => row.name },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => (
                    <Badge variant={row.status === "Published" ? "success" : "neutral"}>
                      {row.status}
                    </Badge>
                  )
                },
                { key: "viewers", header: "Viewers", render: (row) => row.viewers }
              ]}
              getRowId={(row) => row.id}
              selectable
              selectedRowIds={selectedRows}
              onRowSelectionChange={(id) => toggleRow(String(id))}
              onSelectAll={toggleAllRows}
            />
            <Tabs
              label="Demo details"
              defaultValue="overview"
              items={[
                {
                  value: "overview",
                  label: "Overview",
                  panel: (
                    <p className="workbench-tab-copy">
                      The simple path keeps the viewer focused on one story.
                    </p>
                  )
                },
                {
                  value: "activity",
                  label: "Activity",
                  disabled: true,
                  panel: <p>Activity is unavailable in this fixture.</p>
                }
              ]}
            />
          </Card>
        </section>

        <section
          className="workbench-section"
          data-workbench-section="media"
          aria-labelledby="media-heading"
        >
          <div className="workbench-section-heading">
            <div>
              <p className="eyebrow">Media</p>
              <h2 id="media-heading">Stable presentation surfaces</h2>
            </div>
            <Badge>Same-origin default</Badge>
          </div>
          <div className="workbench-media-grid">
            <Card title="Thumbnail" description="Fixed dimensions prevent layout shift.">
              <Thumbnail src="/workbench/demo.png" alt="Product tour thumbnail" size="md" />
            </Card>
            <Card title="Fallback" description="Unavailable media explains what happened.">
              <AspectRatio ratio={16 / 9}>
                <MediaFallback label="Screenshot unavailable">
                  <AlertIcon />
                </MediaFallback>
              </AspectRatio>
            </Card>
            <Card
              title="Device frame"
              description="Use for product screenshots, not interaction chrome."
            >
              <DeviceFrame device="phone" label="Phone preview">
                <MediaImage
                  src="https://blocked.example.test/screen.png"
                  alt="Blocked external screenshot"
                  width={390}
                  height={844}
                />
              </DeviceFrame>
            </Card>
          </div>
        </section>

        <section
          className="workbench-section"
          data-workbench-section="disclosure"
          aria-labelledby="disclosure-heading"
        >
          <div className="workbench-section-heading">
            <div>
              <p className="eyebrow">Progressive disclosure</p>
              <h2 id="disclosure-heading">Keep the first demo simple</h2>
            </div>
            <Badge variant="brand">{mode === "simple" ? "Simple mode" : "Advanced mode"}</Badge>
          </div>
          <Card
            title={mode === "simple" ? "Start with the story" : "Advanced controls"}
            description={
              mode === "simple"
                ? "Capture a screen, add a hotspot, preview, and share."
                : "Reveal branching and personalization only when the selected demo needs them."
            }
          >
            <Stack direction="row" gap="3" wrap>
              <Button onClick={() => setShowModal(true)}>Create demo</Button>
              <Dropdown
                open={menuOpen}
                onOpenChange={setMenuOpen}
                trigger={<Button variant="secondary">More actions</Button>}
              >
                <button type="button" role="menuitem" onClick={() => setMenuOpen(false)}>
                  Preview
                </button>
                <button type="button" role="menuitem" onClick={() => setMenuOpen(false)}>
                  Duplicate
                </button>
              </Dropdown>
              {mode === "advanced" ? (
                <>
                  <Select label="Viewer path" defaultValue="guided">
                    <option value="guided">Guided</option>
                    <option value="self-serve">Self-serve</option>
                  </Select>
                  <Button variant="danger" disabled>
                    Launch experiment
                  </Button>
                </>
              ) : null}
            </Stack>
          </Card>
        </section>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create demo"
        description="Start with one clear story; advanced controls can come later."
      >
        <Stack gap="4">
          <Input label="Demo name" defaultValue="Untitled demo" />
          <Button onClick={() => setShowModal(false)}>Continue to Record</Button>
        </Stack>
      </Modal>
    </main>
  );
}
