"use client";

import { Badge, Button, Card, EmptyState, Stack } from "@supademo/ui";

export type SectionKind = "hubs" | "analytics" | "leads" | "billing" | "help";

export interface SectionViewProps {
  readonly section: SectionKind;
}

export function SectionView({ section }: SectionViewProps) {
  if (section === "hubs") {
    return (
      <div className="content-wrap section-view" data-section="hubs">
        <header className="section-heading">
          <div>
            <p className="eyebrow">Portals & Collections</p>
            <h1>Hubs</h1>
            <p>Combine multiple interactive demos into a single, brandable customer portal.</p>
          </div>
          <a className="button button-primary" href="/demos?new=1">
            Create hub demo
          </a>
        </header>

        <EmptyState
          title="No hubs published yet"
          description="Build structured onboarding or product hubs by grouping your demos into a shareable experience."
          action={
            <a className="button button-secondary" href="/demos">
              Select demos for hub
            </a>
          }
        />
      </div>
    );
  }

  if (section === "analytics") {
    return (
      <div className="content-wrap section-view" data-section="analytics">
        <header className="section-heading">
          <div>
            <p className="eyebrow">Telemetry & Performance</p>
            <h1>Analytics</h1>
            <p>Track completion rates, engagement hotspots, and viewer progression.</p>
          </div>
          <Badge variant="brand">Live telemetry</Badge>
        </header>

        <div className="dashboard-grid">
          <Card
            title="Overview metrics"
            description="Aggregated activity across your workspace demos."
          >
            <Stack direction="row" gap="4" wrap>
              <div>
                <small className="eyebrow">Total views</small>
                <h2>1,248</h2>
              </div>
              <div>
                <small className="eyebrow">Avg completion</small>
                <h2>84%</h2>
              </div>
              <div>
                <small className="eyebrow">Leads captured</small>
                <h2>42</h2>
              </div>
            </Stack>
          </Card>
          <Card
            title="Top performing demos"
            description="Demos driving the highest viewer engagement."
          >
            <Stack gap="2">
              <div className="demo-row">
                <span>Product tour for new teams</span>
                <Badge variant="success">88% completion</Badge>
              </div>
              <div className="demo-row">
                <span>How to launch a campaign</span>
                <Badge variant="success">79% completion</Badge>
              </div>
            </Stack>
          </Card>
        </div>
      </div>
    );
  }

  if (section === "leads") {
    return (
      <div className="content-wrap section-view" data-section="leads">
        <header className="section-heading">
          <div>
            <p className="eyebrow">Prospects & Contacts</p>
            <h1>Leads</h1>
            <p>View contacts captured through email gates and call-to-action forms.</p>
          </div>
          <Button variant="secondary">Export CSV</Button>
        </header>

        <Card
          title="Captured contacts"
          description="Recent viewers who submitted their information."
        >
          <div className="member-table-wrap">
            <table className="member-table">
              <thead>
                <tr>
                  <th scope="col">Contact</th>
                  <th scope="col">Source Demo</th>
                  <th scope="col">Captured Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>alex.smith@example.com</td>
                  <td>Product tour for new teams</td>
                  <td>Today, 09:42 AM</td>
                </tr>
                <tr>
                  <td>taylor.lee@company.io</td>
                  <td>How to launch a campaign</td>
                  <td>Yesterday, 04:15 PM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  if (section === "billing") {
    return (
      <div className="content-wrap section-view" data-section="billing">
        <header className="section-heading">
          <div>
            <p className="eyebrow">Subscription & Usage</p>
            <h1>Billing</h1>
            <p>Manage your workspace plan, seat limits, and billing details.</p>
          </div>
          <Button>Upgrade plan</Button>
        </header>

        <div className="dashboard-grid">
          <Card title="Current Plan" description="Your workspace is on the Creator Pro plan.">
            <Stack gap="3">
              <div>
                <strong>3 of 10 demos used</strong>
                <p>Includes HTML capture, video export, and custom domains.</p>
              </div>
              <Badge variant="success">Active subscription</Badge>
            </Stack>
          </Card>
          <Card title="Invoices & Statements" description="Download past payment receipts.">
            <p>Next billing date: August 28, 2026</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrap section-view" data-section="help">
      <header className="section-heading">
        <div>
          <p className="eyebrow">Documentation & Support</p>
          <h1>Help & Resources</h1>
          <p>Learn how to capture, edit, and publish interactive walkthroughs.</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <Card title="Quickstart Guide" description="Learn the fundamentals in five minutes.">
          <Stack gap="2">
            <a className="text-link" href="/ui-lab">
              Try the UI Laboratory reference flow →
            </a>
            <a className="text-link" href="/demos?new=1">
              Create your first demo →
            </a>
          </Stack>
        </Card>
        <Card title="Keyboard Shortcuts" description="Work faster with command shortcuts.">
          <p>
            Press <kbd>⌘K</kbd> or <kbd>Ctrl+K</kbd> anywhere to open the command palette.
          </p>
        </Card>
      </div>
    </div>
  );
}
