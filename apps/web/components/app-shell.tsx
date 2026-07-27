"use client";

import {
  Button,
  Dropdown,
  Header,
  IconButton,
  Input,
  MenuIcon,
  Modal,
  MoreIcon,
  Sidebar,
  Stack,
  Link as UiLink
} from "@supademo/ui";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  createWorkspaceClient,
  type WorkspaceClient,
  type WorkspaceSummary
} from "../src/lib/workspace-client";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Demos", href: "/demos" },
  { label: "Hubs", href: "/?section=hubs" },
  { label: "Analytics", href: "/?section=analytics" },
  { label: "Leads", href: "/?section=leads" }
] as const;

const commands = [
  { label: "Create demo", description: "Start a new capture", href: "/demos?new=1" },
  { label: "Browse demos", description: "Return to recent work", href: "/demos" },
  { label: "Open settings", description: "Manage account preferences", href: "/settings/profile" }
] as const;

type AppShellProps = {
  children: ReactNode;
  pageTitle?: string;
};

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
      <div className="app-workspace-switcher" aria-label="Current workspace">
        <span className="app-workspace-avatar" aria-hidden="true">
          +
        </span>
        <a href="/onboarding/workspace">Set up a workspace</a>
      </div>
    );
  }

  return (
    <div className="app-workspace-switcher" aria-label="Current workspace">
      <span className="app-workspace-avatar" aria-hidden="true">
        {(current?.workspaceName ?? "Acme workspace").slice(0, 1).toUpperCase()}
      </span>
      <select
        className="app-workspace-switcher-select"
        aria-label="Current workspace"
        value={current?.workspaceId ?? ""}
        disabled={loading || changing || workspaces.length === 0}
        onChange={(event) => void selectWorkspace(event.currentTarget.value)}
      >
        {workspaces.length === 0 ? <option value="">Acme workspace</option> : null}
        {workspaces.map((workspace) => (
          <option value={workspace.workspaceId} key={workspace.workspaceId}>
            {workspace.workspaceName}
          </option>
        ))}
      </select>
    </div>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Command palette"
      description="Jump to a common workspace action."
      className="command-palette"
    >
      <div className="command-palette-body">
        <Input label="Search commands" hideLabel placeholder="Search commands…" autoFocus />
        <nav className="command-list" aria-label="Workspace commands">
          {commands.map((command) => (
            <a className="command-item" href={command.href} key={command.label} onClick={onClose}>
              <strong>{command.label}</strong>
              <span>{command.description}</span>
            </a>
          ))}
        </nav>
      </div>
    </Modal>
  );
}

export function AppShell({ children, pageTitle = "Home" }: AppShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

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

  return (
    <div className="app-shell">
      <Sidebar
        className={mobileNavOpen ? "app-shell-sidebar app-shell-sidebar-open" : "app-shell-sidebar"}
        header={
          <>
            <a
              className="app-brand"
              href="/"
              aria-label="Supademo home"
              onClick={() => setMobileNavOpen(false)}
            >
              <span className="app-brand-mark" aria-hidden="true">
                S
              </span>
              <span>supademo</span>
            </a>
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
              <a href="/?section=billing">View plan</a>
            </div>
            <div className="app-user-row">
              <span className="app-user-avatar" aria-hidden="true">
                JD
              </span>
              <span>
                <strong>Jordan Davis</strong>
                <small>Creator</small>
              </span>
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
                <button type="button" role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                  Sign out
                </button>
              </Dropdown>
            </div>
          </>
        }
      >
        <Stack as="div" className="app-shell-nav" gap="1" onClick={() => setMobileNavOpen(false)}>
          {navigation.map((item) => (
            <UiLink
              className="app-shell-nav-link"
              data-active={pathname === item.href ? "true" : undefined}
              href={item.href}
              key={item.label}
              variant={pathname === item.href ? "default" : "muted"}
            >
              <span className="app-shell-nav-dot" aria-hidden="true" />
              {item.label}
            </UiLink>
          ))}
          <UiLink className="app-shell-nav-link" href="/settings/profile" variant="muted">
            <span className="app-shell-nav-dot" aria-hidden="true" />
            Settings
          </UiLink>
        </Stack>
      </Sidebar>

      <main className="main-content">
        <Header
          className="app-shell-header"
          actions={
            <Stack direction="row" className="app-shell-header-actions" gap="4">
              <span className="app-shell-saved-state">
                <span className="app-shell-saved-dot" />
                All changes saved
              </span>
              <Button
                className="app-shell-command-trigger"
                variant="secondary"
                size="sm"
                onClick={() => setCommandOpen(true)}
              >
                Search <kbd>⌘K</kbd>
              </Button>
              <UiLink className="app-shell-header-link" href="/?section=help" variant="muted">
                Help
              </UiLink>
            </Stack>
          }
        >
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
            <span className="app-shell-mobile-brand">supademo</span>
            <span className="app-shell-breadcrumb-separator">/</span>
            <span>{pageTitle}</span>
          </div>
        </Header>
        {children}
      </main>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
