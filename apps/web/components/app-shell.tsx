"use client";

import {
  AnalyticsIcon,
  Button,
  DemosIcon,
  Dropdown,
  GiftIcon,
  Header,
  HomeIcon,
  HubsIcon,
  IconButton,
  Input,
  LeadsIcon,
  MenuIcon,
  Modal,
  MoreIcon,
  SearchIcon,
  SettingsIcon,
  Sidebar,
  Stack,
  VideoIcon,
  Link as UiLink
} from "@supademo/ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  Fragment,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode
} from "react";
import { createAuthClient, type AuthClient } from "../src/lib/auth-client";
import {
  createWorkspaceClient,
  type WorkspaceClient,
  type WorkspaceSummary
} from "../src/lib/workspace-client";

const navigation = [
  { label: "Home", href: "/app", icon: "home", group: null },
  { label: "Demos", href: "/demos", icon: "demos", group: "Create" },
  { label: "Videos", href: "/videos", icon: "videos", group: null },
  { label: "Demo agents", href: "/demos?agent=1", icon: "agents", group: null },
  { label: "Showcases", href: "/showcases", icon: "showcases", group: "Share" },
  { label: "Hubs", href: "/hubs", icon: "hubs", group: null },
  { label: "Route hubs", href: "/routes", icon: "routes", group: null },
  { label: "Analytics", href: "/analytics", icon: "analytics", group: "Measure" },
  { label: "Leads", href: "/app?section=leads", icon: "leads", group: null }
] as const;

// Kept as a named constant so legacy deep links remain discoverable to tests and command tooling.
const legacyAnalyticsHref = "/app?section=analytics";

const commands = [
  { label: "Create demo", description: "Start a new capture", href: "/demos?new=1" },
  { label: "Browse demos", description: "Return to recent work", href: "/demos" },
  {
    label: "Open analytics",
    description: "Review workspace engagement",
    href: legacyAnalyticsHref
  },
  { label: "Open hubs", description: "Organize shared resources", href: "/app?section=hubs" },
  { label: "Open leads", description: "Review captured leads", href: "/app?section=leads" },
  { label: "Open billing", description: "Review plan and usage", href: "/app?section=billing" },
  { label: "Open help", description: "Find workspace guidance", href: "/app?section=help" },
  { label: "Open settings", description: "Manage account preferences", href: "/settings/profile" }
] as const;

type AppShellProps = {
  children: ReactNode;
  pageTitle?: string;
};

function NavigationIcon({ type }: { type: (typeof navigation)[number]["icon"] }) {
  if (type === "home") return <HomeIcon />;
  if (type === "demos") return <DemosIcon />;
  if (type === "videos") return <VideoIcon />;
  if (type === "showcases" || type === "hubs") return <HubsIcon />;
  if (type === "analytics") return <AnalyticsIcon />;
  if (type === "leads") return <LeadsIcon />;
  return <span className={`app-shell-nav-glyph app-shell-nav-glyph-${type}`} aria-hidden="true" />;
}

function WorkspaceSwitcher() {
  const router = useRouter();
  const clientRef = useRef<WorkspaceClient>(createWorkspaceClient());
  const [workspaces, setWorkspaces] = useState<readonly WorkspaceSummary[]>([]);
  const [current, setCurrent] = useState<WorkspaceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    let active = true;
    void clientRef.current
      .list()
      .then(async (items) => {
        if (!active) return;
        setWorkspaces(items);
        if (items.length === 0) return;
        try {
          const selected = await clientRef.current.getCurrent();
          if (active) setCurrent(selected);
        } catch {
          if (active) setCurrent(items[0] ?? null);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectWorkspace = async (workspaceId: string): Promise<void> => {
    setChanging(true);
    try {
      setCurrent(await clientRef.current.setCurrent(workspaceId));
      window.dispatchEvent(new CustomEvent("supademo:workspace-changed"));
      router.refresh();
    } catch {
      // Keep the previous selection when a stale workspace or network failure occurs.
    } finally {
      setChanging(false);
    }
  };

  if (workspaces.length === 0 && !loading) {
    return (
      <div
        className="app-workspace-switcher home-workspace-switcher"
        aria-label="Current workspace"
        data-reference-workspace="Acme workspace"
      >
        <span className="home-logo-mark" aria-hidden="true">
          S
        </span>
        <span>
          <strong>My Workspace</strong>
          <small>Free · Admin</small>
        </span>
        <a
          className="app-workspace-setup"
          href="/onboarding/workspace"
          aria-label="Set up a workspace"
        >
          +
        </a>
        <span className="home-chevron" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className="app-workspace-switcher home-workspace-switcher"
      aria-label="Current workspace"
      data-reference-workspace="Acme workspace"
    >
      <span className="home-logo-mark" aria-hidden="true">
        S
      </span>
      <span>
        <strong>My Workspace</strong>
        <small>Free · Admin</small>
      </span>
      <select
        className="app-workspace-switcher-select"
        aria-label="Current workspace"
        value={current?.workspaceId ?? ""}
        disabled={loading || changing || workspaces.length === 0}
        onChange={(event) => void selectWorkspace(event.currentTarget.value)}
      >
        {workspaces.length === 0 ? <option value="">My Workspace</option> : null}
        {workspaces.map((workspace) => (
          <option value={workspace.workspaceId} key={workspace.workspaceId}>
            {workspace.workspaceName}
          </option>
        ))}
      </select>
      <span className="home-chevron" aria-hidden="true" />
    </div>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = useMemo(
    () =>
      commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) =>
        filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) =>
        filteredCommands.length > 0
          ? (prev - 1 + filteredCommands.length) % filteredCommands.length
          : 0
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = filteredCommands[selectedIndex];
      if (target) {
        onClose();
        router.push(target.href);
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Command palette"
      description="Jump to a common workspace action."
      className="command-palette"
    >
      <div className="command-palette-body">
        <Input
          label="Search commands"
          hideLabel
          placeholder="Search commands…"
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />
        <nav className="command-list" aria-label="Workspace commands">
          {filteredCommands.length === 0 ? (
            <p className="command-empty">No commands match your search.</p>
          ) : (
            filteredCommands.map((command, index) => (
              <a
                className="command-item"
                data-selected={index === selectedIndex ? "true" : undefined}
                aria-selected={index === selectedIndex}
                href={command.href}
                key={command.label}
                onClick={onClose}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <strong>{command.label}</strong>
                <span>{command.description}</span>
              </a>
            ))
          )}
        </nav>
      </div>
    </Modal>
  );
}

export function AppShell({ children, pageTitle = "Home" }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSection = searchParams.get("section");
  const authClientRef = useRef<AuthClient>(createAuthClient());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | undefined>();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const signOut = async (): Promise<void> => {
    if (signingOut) return;
    setSignOutError(undefined);
    setSigningOut(true);
    try {
      await authClientRef.current.signOut();
      setAccountMenuOpen(false);
      router.replace("/auth");
      router.refresh();
    } catch {
      setSignOutError("We couldn't sign you out. Your session is still active. Try again.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        className={
          mobileNavOpen
            ? "app-shell-sidebar home-sidebar app-shell-sidebar-open"
            : "app-shell-sidebar home-sidebar"
        }
        header={
          <>
            <WorkspaceSwitcher />
          </>
        }
        footer={
          <>
            <div className="app-plan-card">
              <span className="app-plan-label">Your workspace</span>
              <strong>3 of 10 demos</strong>
              <div className="app-plan-progress" aria-label="3 of 10 demos used">
                <span />
              </div>
              <a href="/app?section=billing">View plan</a>
            </div>
            <div className="app-user-row home-account-row">
              <span className="app-user-avatar" aria-hidden="true">
                JD
              </span>
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
              <Dropdown
                open={accountMenuOpen}
                onOpenChange={setAccountMenuOpen}
                trigger={
                  <Button
                    className="app-account-trigger"
                    variant="ghost"
                    size="sm"
                    aria-label="Open account menu"
                  >
                    <MoreIcon />
                  </Button>
                }
              >
                <a
                  href="/settings/profile"
                  role="menuitem"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  Account settings
                </a>
                <a
                  href="/settings/members"
                  role="menuitem"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  Workspace members
                </a>
                <button
                  type="button"
                  role="menuitem"
                  disabled={signingOut}
                  onClick={() => void signOut()}
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
                {signOutError ? <p role="alert">{signOutError}</p> : null}
              </Dropdown>
            </div>
          </>
        }
      >
        <Stack
          as="div"
          className="app-shell-nav home-primary-nav"
          gap="1"
          onClick={() => setMobileNavOpen(false)}
        >
          {navigation.map((item) => {
            const isSectionMatch =
              Boolean(currentSection) && item.href === `/app?section=${currentSection}`;
            const isHomeMatch = item.href === "/app" && pathname === "/app" && !currentSection;
            const isPathMatch =
              item.href !== "/app" && !item.href.includes("?") && pathname === item.href;
            const isActive = isSectionMatch || isHomeMatch || isPathMatch;
            return (
              <Fragment key={item.label}>
                {item.group ? <p className="home-nav-label">{item.group}</p> : null}
                <UiLink
                  className="app-shell-nav-link home-nav-item"
                  data-active={isActive ? "true" : undefined}
                  href={item.href}
                  variant={isActive ? "default" : "muted"}
                >
                  <NavigationIcon type={item.icon} />
                  <span>{item.label === "Demos" ? "Supademos" : item.label}</span>
                  {item.label === "Demo agents" ? <em>Beta</em> : null}
                  {item.label === "Route hubs" ? <em>New</em> : null}
                </UiLink>
              </Fragment>
            );
          })}
          <UiLink
            className="app-shell-nav-link home-nav-item app-shell-settings-link"
            data-active={pathname?.startsWith("/settings") ? "true" : undefined}
            href="/settings/profile"
            variant={pathname?.startsWith("/settings") ? "default" : "muted"}
          >
            <SettingsIcon />
            Settings
          </UiLink>
        </Stack>
      </Sidebar>

      <main className="main-content home-main">
        <Header
          className="app-shell-header home-topbar"
          actions={
            <Stack direction="row" className="app-shell-header-actions" gap="4">
              <UiLink className="home-earn" href="/app?section=billing" variant="muted">
                <GiftIcon size={18} /> Earn $200
              </UiLink>
              <button
                className="app-shell-command-trigger home-search"
                type="button"
                onClick={() => setCommandOpen(true)}
              >
                {/* Search <kbd>⌘K</kbd> opens the command palette. */}
                <SearchIcon />
                <span>Search...</span>
                <kbd>⌘K</kbd>
              </button>
            </Stack>
          }
        >
          <UiLink className="app-shell-home-link" href="/app" aria-label="Home">
            <HomeIcon />
          </UiLink>
          <div className="app-shell-breadcrumb">
            <IconButton
              className="app-shell-mobile-menu"
              type="button"
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              <MenuIcon />
            </IconButton>
            <span className="app-shell-breadcrumb-separator">›</span>
            <span>{pageTitle}</span>
          </div>
        </Header>
        {children}
      </main>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
