"use client";

import {
  AnalyticsIcon,
  DemosIcon,
  FilterIcon,
  FolderPlusIcon,
  GiftIcon,
  HelpCircleIcon,
  HubsIcon,
  HomeIcon,
  LayoutIcon,
  Modal,
  MoreIcon,
  SearchIcon,
  SettingsIcon,
  SortIcon,
  VideoIcon,
  CloseIcon,
  InfoIcon
} from "@supademo/ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ShowcaseEditorDialog } from "./showcase-editor";

export type WorkspaceReferenceKind =
  "demos" | "screenshots" | "videos" | "showcases" | "hubs" | "routes" | "analytics";

const demoItems = [
  {
    id: "demo-urban-enforcement",
    name: "Optimize Urban Enforcement Center",
    owner: "Abhijaat Krishna",
    date: "21 Jun",
    tone: "urban",
    image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/x7a-cMKvfK0wUo3qbir7U.jpg"
  },
  {
    id: "demo-amazon-fresh",
    name: "Complete an Amazon Fresh purchase",
    owner: "Abhijaat Krishna",
    date: "15 Jun",
    tone: "fresh",
    image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/ZMshzrt2rbFa0JBgMXOrz.jpg"
  },
  {
    id: "demo-shop-products",
    name: "Shop and Discover Products",
    owner: "Abhijaat Krishna",
    date: "15 Jun",
    tone: "shop",
    image: "https://media.supademo.com/clyp848gi00nlgwbspl1gpyow/2jAdK1WdzdugSw97h-AFM.jpg"
  },
  {
    id: "demo-export-cases",
    name: "Search, View, and Export Cases",
    owner: "Abhijaat Krishna",
    date: "15 Jun",
    tone: "search",
    image:
      "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/screenshots/_j3D8XqsrOrl8rDn8fq3D.jpg"
  },
  {
    id: "demo-product-walkthrough",
    name: "Interactive Product Walkthrough",
    owner: "Abhijaat Krishna",
    date: "15 Jun",
    tone: "interactive",
    image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/Xv_XoVIntLPIGeWdNjOEP.jpg"
  }
] as const;

type CreateMode = "guided" | "html" | "sandbox" | "screenshot" | "video" | "upload";

const createModes: readonly {
  readonly id: CreateMode;
  readonly title: string;
  readonly description: string;
}[] = [
  {
    id: "guided",
    title: "Guided demo",
    description: "Capture a workflow and add focused steps and hotspots."
  },
  {
    id: "html",
    title: "Guided HTML",
    description: "Capture a realistic, clickable web workflow from your browser."
  },
  {
    id: "sandbox",
    title: "Sandbox demo",
    description: "Start an explorable product environment for free-form discovery."
  },
  {
    id: "screenshot",
    title: "Screenshot",
    description: "Annotate one crisp screen for an update or quick explanation."
  },
  {
    id: "video",
    title: "Video",
    description: "Upload or record a short walkthrough for your team."
  },
  {
    id: "upload",
    title: "Upload media",
    description: "Bring in screenshots or a video you already recorded."
  }
];

const collectionFeatureArtwork = {
  screenshots: "https://supademo.com/tools/screenshot-editor.avif",
  videos: "https://supademo.com/images/tools-hero-img-02.avif",
  showcases: "https://supademo.com/showcase/turo-header.avif"
} as const;

const nav = [
  ["Home", "/home", "home"],
  ["Supademos", "/demos", "demos"],
  ["Videos", "/videos", "videos"],
  ["Demo agents", "/ai/demo-agents", "wand"],
  ["Showcases", "/showcases", "showcases"],
  ["Demo hubs", "/hubs", "hubs"],
  ["Route hubs", "/routes", "routes"],
  ["Analytics", "/analytics", "analytics"]
] as const;

function Icon({ type }: { type: string }) {
  if (type === "home") return <HomeIcon />;
  if (type === "demos") return <DemosIcon />;
  if (type === "videos") return <VideoIcon />;
  if (type === "showcases" || type === "hubs") return <HubsIcon />;
  if (type === "analytics") return <AnalyticsIcon />;
  return <span className={`workspace-ref-icon workspace-ref-icon-${type}`} aria-hidden="true" />;
}

function Frame({ kind, children }: { kind: WorkspaceReferenceKind; children: ReactNode }) {
  const active = kind === "screenshots" ? "demos" : kind;
  return (
    <div className="home-workspace workspace-reference">
      <aside className="home-sidebar" aria-label="Workspace navigation">
        <div className="home-sidebar-top">
          <a className="home-workspace-switcher" href="/home">
            <span className="home-logo-mark">S</span>
            <span>
              <strong>My Workspace</strong>
              <small>Free · Admin</small>
            </span>
            <span className="home-chevron" aria-hidden="true" />
          </a>
          <nav className="home-primary-nav">
            <a className="home-nav-item" href="/home">
              <Icon type="home" />
              <span>Home</span>
            </a>
            <p className="home-nav-label">Create</p>
            {nav.slice(1, 4).map(([label, href, icon]) => (
              <a
                className={`home-nav-item ${active === icon ? "is-active" : ""}`}
                href={href}
                key={label}
                aria-current={active === icon ? "page" : undefined}
              >
                <Icon type={icon} />
                <span>{label}</span>
                {label === "Demo agents" ? <em>Beta</em> : null}
              </a>
            ))}
            <p className="home-nav-label">Share</p>
            {nav.slice(4, 7).map(([label, href, icon]) => (
              <a
                className={`home-nav-item ${active === icon ? "is-active" : ""}`}
                href={href}
                key={label}
                aria-current={active === icon ? "page" : undefined}
              >
                <Icon type={icon} />
                <span>{label}</span>
                {label === "Route hubs" ? <em>New</em> : null}
              </a>
            ))}
            <p className="home-nav-label">Measure</p>
            <a
              className={`home-nav-item ${active === "analytics" ? "is-active" : ""}`}
              href="/analytics"
              aria-current={active === "analytics" ? "page" : undefined}
            >
              <Icon type="analytics" />
              <span>Analytics</span>
            </a>
          </nav>
        </div>
        <div className="home-sidebar-bottom">
          <section className="home-upgrade-card">
            <span className="home-upgrade-star" aria-hidden="true" />
            <strong>Unlock premium features</strong>
            <p>Get the most out of Supademo with 30+ pro features.</p>
            <a href="/app?section=billing">Upgrade</a>
          </section>
          <div className="home-account-row">
            <span>
              <strong>Abhijaat Krishna</strong>
              <small>krishnaabhijaat@gmail.com</small>
            </span>
            <a href="/settings/profile" aria-label="Account settings">
              <SettingsIcon />
            </a>
            <button type="button" aria-label="Notifications">
              <span className="home-bell" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
      <div className="home-main">
        <header className="home-topbar">
          <a href="/home" aria-label="Home">
            <HomeIcon />
          </a>
          <div className="home-top-actions">
            <a className="home-earn" href="/app?section=billing">
              <GiftIcon size={18} /> Earn $200
            </a>
            <label className="home-search">
              <SearchIcon />
              <span className="sr-only">Search workspace</span>
              <input placeholder="Search..." />
              <kbd>⌘K</kbd>
            </label>
          </div>
        </header>
        <main className="workspace-ref-content">{children}</main>
      </div>
    </div>
  );
}

function DemoThumb({
  tone,
  large = false,
  image
}: {
  tone: string;
  large?: boolean;
  image?: string;
}) {
  return (
    <span className={`workspace-ref-thumb ${tone} ${large ? "is-large" : ""}`} aria-hidden="true">
      {image ? (
        <img src={image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      ) : (
        <>
          <span className="thumb-browser-bar">
            <i />
            <i />
            <i />
          </span>
          <span className="thumb-sidebar" />
          <span className="thumb-heading" />
          <span className="thumb-panel thumb-panel-one" />
          <span className="thumb-panel thumb-panel-two" />
          <b className="thumb-cta" />
        </>
      )}
    </span>
  );
}

function Toolbar({
  onFilter,
  onSort,
  onFolder,
  onLayout,
  layout
}: {
  onFilter: () => void;
  onSort: () => void;
  onFolder: () => void;
  onLayout: () => void;
  layout: "grid" | "list";
}) {
  return (
    <div className="workspace-ref-toolbar" aria-label="Collection controls">
      <button type="button" title="Filter" aria-label="Filter" onClick={onFilter}>
        <FilterIcon />
      </button>
      <button type="button" title="Sort" aria-label="Sort" onClick={onSort}>
        <SortIcon />
      </button>
      <button type="button" title="New folder" aria-label="New folder" onClick={onFolder}>
        <FolderPlusIcon />
      </button>
      <button
        type="button"
        title={layout === "grid" ? "List view" : "Grid view"}
        aria-label={layout === "grid" ? "List view" : "Grid view"}
        onClick={onLayout}
      >
        <LayoutIcon />
      </button>
    </div>
  );
}

function StatusMessage({ children }: { children: ReactNode }) {
  return (
    <p className="workspace-ref-status" role="status">
      {children}
    </p>
  );
}

function CreateDemoDialog({
  open,
  defaultMode,
  onClose,
  onStart
}: {
  readonly open: boolean;
  readonly defaultMode: CreateMode;
  readonly onClose: () => void;
  readonly onStart: (mode: CreateMode) => void;
}) {
  const [mode, setMode] = useState<CreateMode>(defaultMode);

  // Keep the selected entry in sync when the dialog is opened from a route-specific action.
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode, open]);

  const selected = createModes.find((item) => item.id === mode) ?? createModes[0];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a demo"
      description="Choose a starting point. You can change the details in the editor."
      className="workspace-ref-create-dialog"
    >
      <div className="workspace-ref-create-options" role="listbox" aria-label="Demo format">
        {createModes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={mode === item.id}
            className={mode === item.id ? "is-selected" : undefined}
            onClick={() => setMode(item.id)}
          >
            <span className={`workspace-ref-create-icon workspace-ref-create-icon-${item.id}`} />
            <span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
          </button>
        ))}
      </div>
      <div className="workspace-ref-create-footer">
        <span>{selected?.title} selected</span>
        <button type="button" className="workspace-ref-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="workspace-ref-primary" onClick={() => onStart(mode)}>
          Continue
        </button>
      </div>
    </Modal>
  );
}

function DemosSurface({ mode }: { mode: "demos" | "screenshots" | "videos" }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [segment, setSegment] = useState(mode === "screenshots" ? "Screenshots" : "Supademos");
  const [tab, setTab] = useState("Shared with Team");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [status, setStatus] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const createOpen = searchParams.get("new") === "1";
  const requestedMode = searchParams.get("mode");
  const defaultCreateMode: CreateMode =
    requestedMode === "html" ||
    requestedMode === "sandbox" ||
    requestedMode === "screenshot" ||
    requestedMode === "video" ||
    requestedMode === "upload"
      ? requestedMode
      : "guided";
  const showingScreenshots = mode === "screenshots" || segment === "Screenshots";
  const title =
    mode === "videos" ? "Videos" : showingScreenshots ? "Screenshots" : "Team Supademos";
  const sortedItems = useMemo(() => {
    if (sortAsc === null) return [...demoItems];
    return [...demoItems].sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
  }, [sortAsc]);
  const sortLabel = sortAsc === null ? "Reference order" : sortAsc ? "A–Z" : "Z–A";

  const choose = (message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 2200);
  };

  const openCreate = (requested: CreateMode = "guided"): void => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("new", "1");
    if (requested === "guided") next.delete("mode");
    else next.set("mode", requested);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const closeCreate = (): void => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("new");
    next.delete("mode");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const startCreate = (selectedMode: CreateMode): void => {
    const draftId =
      typeof globalThis.crypto?.randomUUID === "function"
        ? `draft-${globalThis.crypto.randomUUID()}`
        : `draft-${Date.now().toString(36)}`;
    const destination = `/demos/${draftId}/edit?capture=${encodeURIComponent(selectedMode)}`;
    closeCreate();
    router.push(destination);
  };

  return (
    <Frame kind={mode}>
      <section className="workspace-ref-heading">
        <div className="workspace-ref-breadcrumb">
          <HomeIcon />
          <span>›</span>
          <span>Create</span>
          <span>›</span>
          <strong>{title}</strong>
        </div>
        <div className="workspace-ref-title-row">
          <div className="workspace-ref-title-with-help">
            <h1>{title}</h1>
            {mode !== "videos" ? (
              <span title="About this collection">
                <HelpCircleIcon />
              </span>
            ) : null}
          </div>
          <div className="workspace-ref-actions">
            <button
              type="button"
              className="workspace-ref-primary"
              onClick={() =>
                openCreate(
                  showingScreenshots ? "screenshot" : mode === "videos" ? "video" : "guided"
                )
              }
            >
              Create
            </button>
            {mode !== "videos" ? (
              <div className="workspace-ref-segment" aria-label="Create type">
                <button
                  type="button"
                  className={segment === "Supademos" ? "active" : ""}
                  onClick={() => setSegment("Supademos")}
                >
                  Supademos
                </button>
                <button
                  type="button"
                  className={segment === "Screenshots" ? "active" : ""}
                  onClick={() => setSegment("Screenshots")}
                >
                  Screenshots
                </button>
              </div>
            ) : null}
          </div>
        </div>
        {!showingScreenshots ? (
          <div className="workspace-ref-tabs" role="tablist" aria-label={`${title} ownership`}>
            {["Shared with Team", "Personal", "Archived"].map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                className={tab === item ? "active" : ""}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {showingScreenshots ? (
        <>
          <div className="workspace-ref-underbar">
            <Toolbar
              onFilter={() => setFilterOpen(!filterOpen)}
              onSort={() => setSortAsc(!sortAsc)}
              onFolder={() => choose("New folder ready")}
              onLayout={() => setLayout(layout === "grid" ? "list" : "grid")}
              layout={layout}
            />
          </div>
          {filterOpen ? <StatusMessage>Showing all screenshots · {sortLabel}</StatusMessage> : null}
          <section className="workspace-ref-feature workspace-ref-feature-screenshot workspace-ref-transition">
            <DemoThumb tone="search" large image={collectionFeatureArtwork.screenshots} />
            <div>
              <h2>Snap beautiful screenshots instantly</h2>
              <p>
                Create, annotate and share beautiful screenshots instantly. Perfect for product
                updates or for internal communication!
              </p>
              <button
                type="button"
                className="workspace-ref-primary"
                onClick={() => openCreate("screenshot")}
              >
                Create
              </button>
              <button
                type="button"
                className="workspace-ref-feature-link"
                onClick={() => choose("Opening screenshot tutorial")}
              >
                ◇ Supa Screenshot in 2 min
              </button>
            </div>
          </section>
        </>
      ) : mode === "videos" ? (
        <>
          <div className="workspace-ref-underbar">
            <Toolbar
              onFilter={() => setFilterOpen(!filterOpen)}
              onSort={() => setSortAsc(!sortAsc)}
              onFolder={() => choose("New folder ready")}
              onLayout={() => setLayout(layout === "grid" ? "list" : "grid")}
              layout={layout}
            />
          </div>
          {filterOpen ? (
            <StatusMessage>
              Showing all videos · {sortAsc === null || sortAsc ? "Newest first" : "Oldest first"}
            </StatusMessage>
          ) : null}
          <section className="workspace-ref-feature workspace-ref-feature-video workspace-ref-transition">
            <DemoThumb tone="interactive" large image={collectionFeatureArtwork.videos} />
            <div>
              <h2>No videos yet</h2>
              <p>
                Upload and manage your video content here. Share video demos and tutorials with your
                team.
              </p>
              <button
                type="button"
                className="workspace-ref-primary"
                onClick={() => openCreate("video")}
              >
                Upload video
              </button>
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="workspace-ref-collection-bar">
            <span className="sr-only">{tab === "Shared with Team" ? "Team library" : tab}</span>
            <Toolbar
              onFilter={() => setFilterOpen(!filterOpen)}
              onSort={() => setSortAsc(!sortAsc)}
              onFolder={() => choose("New folder ready")}
              onLayout={() => setLayout(layout === "grid" ? "list" : "grid")}
              layout={layout}
            />
          </div>
          {filterOpen ? (
            <StatusMessage>Filter applied to {tab.toLowerCase()} demos</StatusMessage>
          ) : null}
          {status ? <StatusMessage>{status}</StatusMessage> : null}
          <div className={`workspace-ref-card-row ${layout === "list" ? "is-list" : ""}`}>
            {sortedItems.map((item) => (
              <div className="workspace-ref-demo-card-wrap" key={item.name}>
                <a className="workspace-ref-demo-card" href={`/demos/${item.id}/edit?sample=1`}>
                  <DemoThumb tone={item.tone} image={item.image} />
                  <strong>{item.name}</strong>
                  <small>
                    {item.owner} <b>•</b> {item.date}
                  </small>
                </a>
                <button
                  type="button"
                  className="workspace-ref-card-menu"
                  aria-label={`More actions for ${item.name}`}
                  onClick={() => setMenu(menu === item.name ? null : item.name)}
                >
                  <MoreIcon />
                </button>
                {menu === item.name ? (
                  <div className="workspace-ref-card-popover" role="menu">
                    <a href={`/demos/${item.id}/edit?sample=1`} role="menuitem">
                      Open editor
                    </a>
                    <button type="button" onClick={() => choose(`Renamed ${item.name}`)}>
                      Rename
                    </button>
                    <button type="button" onClick={() => choose(`Archived ${item.name}`)}>
                      Archive
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}
      <CreateDemoDialog
        open={createOpen}
        defaultMode={defaultCreateMode}
        onClose={closeCreate}
        onStart={startCreate}
      />
    </Frame>
  );
}

function ShowcaseSurface({ kind }: { kind: "showcases" | "hubs" }) {
  const showcase = kind === "showcases";
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [status, setStatus] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [tab, setTab] = useState("Shared with Team");
  const choose = (message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 2200);
  };
  return (
    <Frame kind={kind}>
      <section className="workspace-ref-heading">
        <div className="workspace-ref-breadcrumb">
          <HomeIcon />
          <span>›</span>
          <span>{showcase ? "Share" : "Share"}</span>
          <span>›</span>
          <strong>{showcase ? "Showcases" : "Demo hubs"}</strong>
        </div>
        <div className="workspace-ref-title-row">
          <div>
            <div className="workspace-ref-title-with-help">
              <h1>{showcase ? "Team Showcases" : "Demo Hub"}</h1>
              <span title="About this space">
                <HelpCircleIcon />
              </span>
            </div>
            {!showcase ? (
              <p>
                Group Supademos and Showcases into a searchable hub. <u>Learn more</u>
              </p>
            ) : null}
          </div>
          {showcase ? (
            <button
              type="button"
              className="workspace-ref-primary"
              onClick={() => setEditorOpen(true)}
            >
              Create
            </button>
          ) : (
            <a className="workspace-ref-primary" href="/demo-hub">
              Create
            </a>
          )}
        </div>
        <div
          className="workspace-ref-tabs"
          role="tablist"
          aria-label={`${showcase ? "Showcases" : "Hubs"} ownership`}
        >
          {["Shared with Team", "Personal"].map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
          <span className="workspace-ref-tab-spacer" />
          <Toolbar
            onFilter={() => choose("Filter opened")}
            onSort={() => choose("Sort opened")}
            onFolder={() => choose("New folder ready")}
            onLayout={() => choose("Layout changed")}
            layout="grid"
          />
        </div>
      </section>
      {status ? <StatusMessage>{status}</StatusMessage> : null}
      {showcase ? (
        <>
          {welcomeVisible ? (
            <section className="workspace-ref-welcome workspace-ref-welcome-showcase workspace-ref-transition">
              <button
                type="button"
                className="workspace-ref-close"
                aria-label="Dismiss showcase introduction"
                onClick={() => setWelcomeVisible(false)}
              >
                <CloseIcon />
              </button>
              <h2>Welcome to Showcases!</h2>
              <p>
                Showcases allows you to group together multiple Supademos into a single, shareable
                URL or embed.
              </p>
              <div className="workspace-ref-mini-grid">
                <article>
                  <span className="workspace-ref-mini-logo supademo">S</span>
                  <strong>Customer Onboarding</strong>
                  <small>Supademo</small>
                </article>
                <article>
                  <span className="workspace-ref-mini-logo strava">A</span>
                  <strong>Sales Showcase</strong>
                  <small>Strava</small>
                </article>
                <article>
                  <span className="workspace-ref-mini-logo freshline">F</span>
                  <strong>Feature Overview</strong>
                  <small>Freshline</small>
                </article>
              </div>
            </section>
          ) : null}
          <section className="workspace-ref-feature workspace-ref-feature-showcase workspace-ref-transition">
            <DemoThumb tone="strava" large image={collectionFeatureArtwork.showcases} />
            <div>
              <h2>Share multiple Supademos in one Showcase</h2>
              <p>
                Bundle and share multiple Supademos as a single link or embed. Great for follow-ups
                and user onboarding!
              </p>
              <button
                type="button"
                className="workspace-ref-primary"
                onClick={() => setEditorOpen(true)}
              >
                Create
              </button>
              <button
                type="button"
                className="workspace-ref-feature-link"
                onClick={() => choose("Opening example showcase")}
              >
                ◇ Explore an example
              </button>
            </div>
          </section>
        </>
      ) : (
        <section className="workspace-ref-hub-panel workspace-ref-transition">
          <div className="workspace-ref-hub-panel-head">
            <span className="workspace-ref-script">Try live examples ↓</span>
            <div>
              <button
                type="button"
                className="workspace-ref-secondary"
                onClick={() => choose("Tutorial dismissed")}
              >
                Dismiss
              </button>
              <button
                type="button"
                className="workspace-ref-primary"
                onClick={() => choose("Hub tutorial opened")}
              >
                Watch Tutorial
              </button>
            </div>
          </div>
          <div className="workspace-ref-mini-grid">
            <article>
              <strong className="brand-strava">STRAVA</strong>
              <p>Drive adoption by highlighting new features and updates</p>
              <button
                type="button"
                className="workspace-ref-round-arrow"
                onClick={() => choose("Opening Strava example")}
              >
                →
              </button>
            </article>
            <article>
              <strong className="brand-freshworks">freshworks</strong>
              <p>Consolidate common support tickets into self-paced tutorials</p>
              <button
                type="button"
                className="workspace-ref-round-arrow"
                onClick={() => choose("Opening Freshworks example")}
              >
                →
              </button>
            </article>
            <article>
              <strong className="brand-typeform">▮ Typeform</strong>
              <p>Build an engaging learning academy for first-time users</p>
              <button
                type="button"
                className="workspace-ref-round-arrow"
                onClick={() => choose("Opening Typeform example")}
              >
                →
              </button>
            </article>
          </div>
        </section>
      )}
      {showcase ? (
        <ShowcaseEditorDialog
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSaved={(message) => {
            choose(message);
          }}
        />
      ) : null}
    </Frame>
  );
}

function RouteSurface() {
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState("");
  const choose = (message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 2200);
  };
  return (
    <Frame kind="routes">
      <div className="workspace-ref-route">
        <h1>Welcome to Route Hub</h1>
        <p>
          Route Hub helps you deliver the right demos, resources, and next steps to each viewer
          automatically. Collect info, understand intent, and automatically route them to the right
          experience using one smart link.
        </p>
        <div className="workspace-ref-route-canvas" aria-label="Route Hub workflow preview">
          <div className="route-edge edge-one" />
          <div className="route-edge edge-two" />
          <div className="route-edge edge-three" />
          <div className="route-node node-interest">
            <small>INTERESTS</small>
            <strong>Get a curated walkthrough</strong>
            <span>Guided HTML demos</span>
            <span>Product tours</span>
          </div>
          <div className="route-node node-form">
            <small>FORM</small>
            <strong>Just one more step!</strong>
            <span>Email</span>
            <span>Company size</span>
          </div>
          <div className="route-node node-route">
            <small>ROUTE</small>
            <strong>Not qualified lead</strong>
            <span>Large scale customer</span>
            <span>Growth customers</span>
          </div>
          <div className="route-node node-showcase">
            <small>SHOWCASE</small>
            <strong>Non-qualified leads</strong>
            <span>Introduction</span>
            <span>Create & edit</span>
            <span>Share & embed</span>
          </div>
          <button type="button" className="route-demo-cta" onClick={() => setPreview(true)}>
            <span>▷</span> Try product demo
          </button>
          <span className="route-canvas-toolbar">− &nbsp; 65% &nbsp; +</span>
        </div>
        {preview ? (
          <div
            className="workspace-ref-route-preview"
            role="dialog"
            aria-label="Route Hub product demo"
          >
            <button type="button" aria-label="Close preview" onClick={() => setPreview(false)}>
              <CloseIcon />
            </button>
            <strong>Route preview</strong>
            <p>Choose an interest to see the experience that will be delivered.</p>
            <div>
              <button type="button" onClick={() => choose("Guided demo selected")}>
                Guided demo
              </button>
              <button type="button" onClick={() => choose("Sales showcase selected")}>
                Sales showcase
              </button>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          className="workspace-ref-primary"
          onClick={() => choose("Route Hub creator opened")}
        >
          Create
        </button>
        <button
          type="button"
          className="workspace-ref-secondary"
          onClick={() => choose("Route Hub docs opened")}
        >
          Read docs
        </button>
        {status ? <StatusMessage>{status}</StatusMessage> : null}
      </div>
    </Frame>
  );
}

const viewerRows = [
  ["Sarah Chen", "sarah.chen@techcorp.com", "6/15/2025", "5"],
  ["Alex Martinez", "alex.martinez@acme.io", "6/14/2025", "3"],
  ["Kim Min-jun", "kim.minjun@koreatec.kr", "6/14/2025", "4"],
  ["Windows User", "maya.patel@startup.in", "6/13/2025", "2"],
  ["Hiroshi Tanaka", "hiroshi.tanaka@jpn-corp.jp", "6/12/2025", "6"]
] as const;

const accountRows = [
  ["Techcorp", "sarah.chen@techcorp.com", "6/15/2025", "12"],
  ["Acme.io", "alex.martinez@acme.io", "6/14/2025", "8"],
  ["Koreatec", "kim.minjun@koreatec.kr", "6/14/2025", "7"],
  ["Startup.in", "maya.patel@startup.in", "6/13/2025", "4"],
  ["JPN Corp", "hiroshi.tanaka@jpn-corp.jp", "6/12/2025", "9"]
] as const;

const mostViewedRows = [
  [
    "How to set up your CRM in 5 minutes",
    "Sarah Chen",
    "22.3K",
    "19.5K",
    "24.27%",
    "+40%",
    "+39%",
    "+8%"
  ],
  [
    "Homepage demo - Product features",
    "Alex Martinez",
    "1.1K",
    "1.0K",
    "13.79%",
    "+15%",
    "+18%",
    "+12%"
  ],
  ["Onboarding flow for new users", "Kim Min-jun", "945", "938", "6.56%", "+8%", "+6%", "+12%"],
  ["How to create your first report", "Maya Patel", "737", "726", "78.97%", "+40%", "+41%", "+2%"],
  ["Product walkthrough demo", "Hiroshi Tanaka", "665", "661", "3.16%", "+19%", "+22%", "+48%"]
] as const;

function PreviewNotice({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="workspace-ref-notice">
      <InfoIcon />
      <span>
        You&apos;re viewing <strong>preview analytics data.</strong> Upgrade to see your actual demo
        data.
      </span>
      <button type="button" onClick={onUpgrade}>
        Upgrade Now
      </button>
    </div>
  );
}

function AnalyticsSurface() {
  const [activeTab, setActiveTab] = useState("Supademo Analytics");
  const [filterOpen, setFilterOpen] = useState(false);
  const [recentTab, setRecentTab] = useState<"Recent Viewers" | "Recent Accounts">(
    "Recent Viewers"
  );
  const [status, setStatus] = useState("");
  const choose = (message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 2200);
  };
  return (
    <Frame kind="analytics">
      <div className="workspace-ref-analytics">
        <div className="workspace-ref-analytics-tabs" role="tablist" aria-label="Analytics views">
          <button
            className={activeTab === "Supademo Analytics" ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={activeTab === "Supademo Analytics"}
            onClick={() => setActiveTab("Supademo Analytics")}
          >
            Supademo Analytics
          </button>
          <button
            className={activeTab === "Showcase Analytics" ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={activeTab === "Showcase Analytics"}
            onClick={() => setActiveTab("Showcase Analytics")}
          >
            Showcase Analytics
          </button>
          <span />
          <button type="button" onClick={() => setFilterOpen(!filterOpen)}>
            <FilterIcon /> Filters
          </button>
          <button type="button" onClick={() => choose("Date range picker opened")}>
            <span className="calendar-glyph" /> Jul 1-30, 26
          </button>
        </div>
        {filterOpen ? (
          <div className="workspace-ref-filter-popover">
            <strong>Filter analytics</strong>
            <label>
              <input type="checkbox" defaultChecked /> All Supademos
            </label>
            <label>
              <input type="checkbox" /> Shared with team
            </label>
            <button
              type="button"
              onClick={() => {
                setFilterOpen(false);
                choose("Filters applied");
              }}
            >
              Apply
            </button>
          </div>
        ) : null}
        {status ? <StatusMessage>{status}</StatusMessage> : null}
        <PreviewNotice onUpgrade={() => choose("Upgrade flow opened")} />
        <section className="workspace-ref-chart workspace-ref-transition">
          <h2>Supademo Views</h2>
          <div className="workspace-ref-metric-grid">
            <div>
              <span>
                Total Viewers <i>ⓘ</i>
              </span>
              <strong>
                43.3K <small>↑ 1.18%</small>
              </strong>
            </div>
            <div>
              <span>
                Average Engagement <i>ⓘ</i>
              </span>
              <strong>
                26.66% <small className="down">↓ -0.81%</small>
              </strong>
            </div>
            <div className="workspace-ref-legend">
              <span>
                <i className="dot purple" /> Viewers
              </span>
              <span>
                <i className="dot green" /> Engagement
              </span>
            </div>
          </div>
          <div
            className="workspace-ref-line-chart"
            role="img"
            aria-label="Views and engagement chart"
          >
            <div className="workspace-ref-chart-y-axis" aria-hidden="true">
              <span>2.2K</span>
              <span>1.6K</span>
              <span>1.1K</span>
              <span>550</span>
              <span>0</span>
            </div>
            <svg viewBox="0 0 1000 260" preserveAspectRatio="none" aria-hidden="true">
              <path
                className="workspace-ref-chart-viewers-area"
                d="M0 188 C28 130 42 35 85 25 C126 15 149 57 196 51 C240 45 257 62 295 86 C326 105 315 179 353 184 C391 188 406 176 438 106 C472 28 511 36 546 48 C579 59 608 37 637 34 C672 31 697 61 716 115 C739 182 766 192 801 187 C833 182 840 105 877 69 C914 31 947 51 975 84 C991 102 996 125 1000 134 L1000 260 L0 260 Z"
              />
              <path
                className="workspace-ref-chart-viewers-line"
                d="M0 188 C28 130 42 35 85 25 C126 15 149 57 196 51 C240 45 257 62 295 86 C326 105 315 179 353 184 C391 188 406 176 438 106 C472 28 511 36 546 48 C579 59 608 37 637 34 C672 31 697 61 716 115 C739 182 766 192 801 187 C833 182 840 105 877 69 C914 31 947 51 975 84 C991 102 996 125 1000 134"
              />
              <path
                className="workspace-ref-chart-engagement-area"
                d="M0 237 C29 217 57 202 92 201 C128 201 164 201 198 211 C231 221 261 252 293 241 C327 230 348 226 382 207 C415 188 435 202 465 204 C494 207 521 195 551 201 C581 207 606 230 634 237 C669 246 693 225 719 213 C748 200 775 207 805 215 C837 223 856 207 885 210 C916 213 932 234 959 238 C974 240 988 235 1000 224 L1000 260 L0 260 Z"
              />
              <path
                className="workspace-ref-chart-engagement-line"
                d="M0 237 C29 217 57 202 92 201 C128 201 164 201 198 211 C231 221 261 252 293 241 C327 230 348 226 382 207 C415 188 435 202 465 204 C494 207 521 195 551 201 C581 207 606 230 634 237 C669 246 693 225 719 213 C748 200 775 207 805 215 C837 223 856 207 885 210 C916 213 932 234 959 238 C974 240 988 235 1000 224"
              />
            </svg>
          </div>
          <div className="workspace-ref-chart-labels">
            <span>Jun 1</span>
            <span>Jun 8</span>
            <span>Jun 15</span>
            <span>Jun 22</span>
            <span>Jun 30</span>
          </div>
        </section>
        <PreviewNotice onUpgrade={() => choose("Upgrade flow opened")} />
        <section className="workspace-ref-analytics-card workspace-ref-transition">
          <div className="workspace-ref-section-head">
            <div className="workspace-ref-inner-segment">
              <button
                type="button"
                className={recentTab === "Recent Viewers" ? "active" : ""}
                aria-pressed={recentTab === "Recent Viewers"}
                onClick={() => setRecentTab("Recent Viewers")}
              >
                Recent Viewers
              </button>
              <button
                type="button"
                className={recentTab === "Recent Accounts" ? "active" : ""}
                aria-pressed={recentTab === "Recent Accounts"}
                onClick={() => setRecentTab("Recent Accounts")}
              >
                Recent Accounts
              </button>
            </div>
            <button
              type="button"
              className="workspace-ref-secondary"
              onClick={() => choose("Recent viewers opened")}
            >
              View all →
            </button>
          </div>
          <div className="workspace-ref-table-head">
            <span>{recentTab === "Recent Viewers" ? "CONTACT" : "ACCOUNT"}</span>
            <span>LAST VIEWED</span>
            <span>DEMOS VIEWED</span>
            <span />
          </div>
          {(recentTab === "Recent Viewers" ? viewerRows : accountRows).map(
            ([name, email, date, demos]) => (
              <div className="workspace-ref-viewer-row" key={email}>
                <span>
                  <strong>{name}</strong>
                  <small>{email}</small>
                </span>
                <span>{date}</span>
                <span>{demos}</span>
                <span>→</span>
              </div>
            )
          )}
        </section>
        <PreviewNotice onUpgrade={() => choose("Upgrade flow opened")} />
        <section className="workspace-ref-analytics-card workspace-ref-transition">
          <div className="workspace-ref-section-head">
            <h2>Most Viewed</h2>
            <button
              type="button"
              className="workspace-ref-secondary"
              onClick={() => choose("Most viewed opened")}
            >
              View all →
            </button>
          </div>
          <div className="workspace-ref-most-head">
            <span>SUPADEMO</span>
            <span>VIEWS</span>
            <span>UNIQUE VIEWERS</span>
            <span>ENGAGEMENT</span>
            <span />
          </div>
          {mostViewedRows.map(
            ([
              demo,
              owner,
              views,
              unique,
              engagement,
              viewsDelta,
              uniqueDelta,
              engagementDelta
            ]) => (
              <div className="workspace-ref-most-row" key={demo}>
                <span>
                  <strong>{demo}</strong>
                  <small>{owner}</small>
                </span>
                <span>
                  {views} <em>↑ {viewsDelta}</em>
                </span>
                <span>
                  {unique} <em>↑ {uniqueDelta}</em>
                </span>
                <span>
                  {engagement} <em>↑ {engagementDelta}</em>
                </span>
                <span>→</span>
              </div>
            )
          )}
        </section>
        <PreviewNotice onUpgrade={() => choose("Upgrade flow opened")} />
        <section className="workspace-ref-device-card workspace-ref-transition">
          <h2>Device &amp; Location</h2>
          <div className="workspace-ref-device-grid">
            <BarChart
              title="Viewers by OS"
              items={[
                ["Windows", 44],
                ["Mac", 41],
                ["Android", 7],
                ["iOS", 6],
                ["Linux", 2]
              ]}
            />
            <BarChart
              title="Viewers by Browser"
              items={[
                ["Chrome", 76],
                ["Edge", 8],
                ["Mobile Chr...", 8],
                ["Mobile Saf...", 5],
                ["Safari", 4]
              ]}
            />
          </div>
          <div className="workspace-ref-map-card">
            <div className="workspace-ref-map-heading">
              <h3>Viewers by Country</h3>
              <span>
                Views: 1 <b>━━━━━━</b> 11.6K
              </span>
            </div>
            <div className="workspace-ref-map" aria-label="Viewers by country map">
              <i className="map-na" />
              <i className="map-eu" />
              <i className="map-as" />
              <i className="map-au" />
              <i className="map-in" />
            </div>
          </div>
        </section>
      </div>
    </Frame>
  );
}

function BarChart({ title, items }: { title: string; items: readonly [string, number][] }) {
  return (
    <div className="workspace-ref-bar-chart">
      <h3>{title}</h3>
      {items.map(([label, value]) => (
        <div className="workspace-ref-bar-row" key={label}>
          <span>{label}</span>
          <i style={{ "--bar": `${value}%` } as CSSProperties}>
            <b>{value > 40 ? `${value}%` : ""}</b>
          </i>
        </div>
      ))}
    </div>
  );
}

export function WorkspaceReferenceSurface({ kind }: { kind: WorkspaceReferenceKind }) {
  if (kind === "demos" || kind === "screenshots" || kind === "videos")
    return <DemosSurface mode={kind} />;
  if (kind === "showcases" || kind === "hubs") return <ShowcaseSurface kind={kind} />;
  if (kind === "routes") return <RouteSurface />;
  return <AnalyticsSurface />;
}
