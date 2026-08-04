"use client";

import {
  Badge,
  Button,
  EmptyState,
  InlineAlert,
  Modal,
  Pagination,
  Select,
  Skeleton,
  Textarea,
  Input
} from "@supademo/ui";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  createDemoClient,
  type CreateDemoInput,
  type Demo,
  type DemoClient,
  type DemoStatus,
  type DemoType,
  type TrashItem
} from "../src/lib/demo-client";
import { createFolderClient, type Folder, type FolderClient } from "../src/lib/folder-client";
import { createTagClient, type Tag, type TagClient } from "../src/lib/tag-client";
import {
  createWorkspaceClient,
  type WorkspaceClient,
  type WorkspaceSummary
} from "../src/lib/workspace-client";

const pageSize = 20;
const viewValues = ["grid", "list"] as const;
const sortValues = ["updated", "title", "status"] as const;
const demoTypeValues = ["guided_html", "screenshot", "video", "sandbox"] as const;
const demoStatusValues = [
  "draft",
  "processing",
  "published",
  "failed",
  "needs_update",
  "archived"
] as const;

type DashboardStatus = "loading" | "ready" | "error" | "denied";
type DashboardSort = (typeof sortValues)[number];

const demoOnlyWorkspace: WorkspaceSummary = {
  organizationId: "demo-organization",
  organizationName: "Supademo example organization",
  workspaceId: "demo-workspace",
  workspaceName: "Demo workspace",
  slug: "demo-workspace",
  role: "viewer",
  capabilities: ["demo:read"],
  createdAt: "2026-07-30T00:00:00.000Z"
};

const demoOnlyFolders: readonly Folder[] = [
  {
    id: "demo-folder-onboarding",
    workspaceId: "demo-workspace",
    parentId: null,
    name: "Onboarding",
    version: 1,
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-29T10:15:00.000Z"
  },
  {
    id: "demo-folder-sales",
    workspaceId: "demo-workspace",
    parentId: null,
    name: "Sales enablement",
    version: 1,
    createdAt: "2026-07-19T00:00:00.000Z",
    updatedAt: "2026-07-28T15:45:00.000Z"
  }
];

const demoOnlyTags: readonly Tag[] = [
  {
    id: "demo-tag-product",
    workspaceId: "demo-workspace",
    name: "Product",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z"
  },
  {
    id: "demo-tag-sales",
    workspaceId: "demo-workspace",
    name: "Sales",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z"
  }
];

const demoOnlyDemos: readonly Demo[] = [
  {
    id: "demo-product-tour",
    workspaceId: "demo-workspace",
    folderId: "demo-folder-onboarding",
    ownerUserId: "demo-creator",
    title: "Product tour for new teams",
    description: "A guided introduction to the workspace.",
    type: "guided_html",
    status: "published",
    isTemplate: false,
    publishedAt: "2026-07-29T10:15:00.000Z",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-29T10:15:00.000Z",
    deletedAt: null
  },
  {
    id: "demo-campaign-launch",
    workspaceId: "demo-workspace",
    folderId: "demo-folder-sales",
    ownerUserId: "demo-creator",
    title: "How to launch a campaign",
    description: "A walkthrough for campaign setup.",
    type: "screenshot",
    status: "draft",
    isTemplate: false,
    publishedAt: null,
    createdAt: "2026-07-21T00:00:00.000Z",
    updatedAt: "2026-07-28T15:45:00.000Z",
    deletedAt: null
  },
  {
    id: "demo-support-handoff",
    workspaceId: "demo-workspace",
    folderId: null,
    ownerUserId: "demo-creator",
    title: "Support handoff walkthrough",
    description: "A reusable customer handoff flow.",
    type: "video",
    status: "needs_update",
    isTemplate: true,
    publishedAt: "2026-07-18T08:30:00.000Z",
    createdAt: "2026-07-18T00:00:00.000Z",
    updatedAt: "2026-07-27T09:00:00.000Z",
    deletedAt: null
  }
];

export interface DemoDashboardScreenProps {
  readonly demoOnly?: boolean;
  readonly demoClient?: DemoClient;
  readonly workspaceClient?: WorkspaceClient;
  readonly folderClient?: FolderClient;
  readonly tagClient?: TagClient;
}

export function DemoDashboardScreen({
  demoOnly = false,
  demoClient,
  workspaceClient,
  folderClient,
  tagClient
}: DemoDashboardScreenProps) {
  const isLocalPreviewHost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "10.2.13.175"].includes(window.location.hostname);
  const localDemoOnly =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEMO_ONLY === "true" &&
    isLocalPreviewHost;
  const useDemoOnlyData = demoOnly || localDemoOnly;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const demoRef = useRef<DemoClient>(demoClient ?? createDemoClient());
  const workspaceRef = useRef<WorkspaceClient>(workspaceClient ?? createWorkspaceClient());
  const folderRef = useRef<FolderClient>(folderClient ?? createFolderClient());
  const tagRef = useRef<TagClient>(tagClient ?? createTagClient());
  const requestSequence = useRef(0);
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [demos, setDemos] = useState<readonly Demo[]>([]);
  const [folders, setFolders] = useState<readonly Folder[]>([]);
  const [tags, setTags] = useState<readonly Tag[]>([]);
  const [trashItems, setTrashItems] = useState<readonly TrashItem[]>([]);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<TrashItem | null>(null);
  const [deletingPermanently, setDeletingPermanently] = useState(false);
  const [status, setStatus] = useState<DashboardStatus>("loading");
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<DemoType>("guided_html");
  const [folderOpen, setFolderOpen] = useState(false);
  const [editFolderOpen, setEditFolderOpen] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [savingFolder, setSavingFolder] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [savingTag, setSavingTag] = useState(false);
  const [taggingDemo, setTaggingDemo] = useState<Demo | null>(null);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [savingTagAssignment, setSavingTagAssignment] = useState(false);
  const [dragged, setDragged] = useState<{
    readonly kind: "demo" | "folder";
    readonly id: string;
  }>();

  const view = parseValue(searchParams.get("view"), viewValues, "grid");
  const sort = parseValue(searchParams.get("sort"), sortValues, "updated");
  const currentPage = parsePage(searchParams.get("page"));
  const query = (searchParams.get("q") ?? "").slice(0, 200);
  const ownerUserId = searchParams.get("owner") ?? "";
  const typeFilter = parseOptionalValue(searchParams.get("type"), demoTypeValues);
  const statusFilter = parseOptionalValue(searchParams.get("status"), demoStatusValues);
  const tagParam = searchParams.get("tag") ?? "";
  const tagIds = useMemo(() => parseTagIds(tagParam), [tagParam]);
  const updatedAfter = parseDate(searchParams.get("updatedAfter"));
  const updatedBefore = parseDate(searchParams.get("updatedBefore"));
  const selectedFolderParam = searchParams.get("folder");
  const [searchDraft, setSearchDraft] = useState(query);

  const serverFilters = useMemo(
    () => ({
      ...(query ? { query } : {}),
      ...(ownerUserId ? { ownerUserId } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(tagIds.length ? { tagIds } : {}),
      ...(updatedAfter ? { updatedAfter } : {}),
      ...(updatedBefore ? { updatedBefore } : {})
    }),
    [ownerUserId, query, statusFilter, tagIds, typeFilter, updatedAfter, updatedBefore]
  );
  const filterKey = JSON.stringify(serverFilters);

  const setUrlState = useCallback(
    (changes: Readonly<Record<string, string | undefined>>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === undefined) next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setStatus("loading");
    setError(undefined);
    setMessage(undefined);
    setDemos([]);
    setTags([]);
    setTrashItems([]);
    if (useDemoOnlyData) {
      setWorkspace(demoOnlyWorkspace);
      setDemos(demoOnlyDemos);
      setFolders(demoOnlyFolders);
      setTags(demoOnlyTags);
      setStatus("ready");
      return;
    }
    try {
      const current = await workspaceRef.current.getCurrent();
      const [loaded, loadedFolders, loadedTags, loadedTrash] = await Promise.all([
        demoRef.current.list(current.workspaceId, serverFilters),
        folderRef.current.list(current.workspaceId),
        tagRef.current.list(current.workspaceId),
        demoRef.current.listTrash(current.workspaceId)
      ]);
      if (sequence !== requestSequence.current) return;
      setWorkspace(current);
      setDemos(loaded);
      setFolders(loadedFolders);
      setTags(loadedTags);
      setTrashItems(loadedTrash);
      setStatus("ready");
    } catch (caught) {
      if (sequence !== requestSequence.current) return;
      const clientError = caught instanceof Error && "status" in caught ? caught : undefined;
      setWorkspace(null);
      setStatus(clientError?.status === 401 || clientError?.status === 403 ? "denied" : "error");
      setError(
        clientError?.status === 401
          ? "Sign in to view your demos."
          : clientError?.status === 403
            ? "You don’t have permission to view demos in this workspace."
            : "Demos could not be loaded. Your existing work was not changed. Try again."
      );
    }
  }, [filterKey, serverFilters, useDemoOnlyData]);

  useEffect(() => {
    void load();
    const onWorkspaceChanged = () => void load();
    window.addEventListener("supademo:workspace-changed", onWorkspaceChanged);
    return () => window.removeEventListener("supademo:workspace-changed", onWorkspaceChanged);
  }, [load]);

  useEffect(() => {
    if (searchParams.get("new") === "1") setCreateOpen(true);
  }, [searchParams]);

  useEffect(() => {
    setSearchDraft(query);
  }, [query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchDraft !== query) {
        setUrlState({ q: searchDraft.trim() || undefined, page: undefined });
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query, searchDraft, setUrlState]);

  const isTrashView = selectedFolderParam === "trash";
  const isTemplatesView = selectedFolderParam === "templates";
  const selectedFolderId = isTrashView
    ? "trash"
    : isTemplatesView
      ? "templates"
      : folders.some((folder) => folder.id === selectedFolderParam)
        ? selectedFolderParam
        : null;
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId);
  const scopedDemos = useMemo(
    () =>
      demos.filter((demo) => {
        if (isTrashView) return false;
        if (isTemplatesView) return demo.isTemplate;
        return demo.folderId === selectedFolderId;
      }),
    [demos, isTemplatesView, isTrashView, selectedFolderId]
  );
  const sortedDemos = useMemo(() => sortDemos(scopedDemos, sort), [scopedDemos, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedDemos.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const pageDemos = sortedDemos.slice((page - 1) * pageSize, page * pageSize);
  const canCreate = workspace?.capabilities.includes("demo:create") ?? false;
  const canManageFolders = workspace?.capabilities.includes("demo:update") ?? false;
  const canDelete = workspace?.capabilities.includes("demo:delete") ?? false;
  const activeFilterCount = [
    ownerUserId,
    typeFilter,
    statusFilter,
    ...tagIds,
    updatedAfter,
    updatedBefore
  ].filter(Boolean).length;
  const hasSearchOrFilters = Boolean(query) || activeFilterCount > 0;

  const archiveDemo = async (demoToArchive: Demo): Promise<void> => {
    if (!workspace || !canManageFolders) return;
    setError(undefined);
    try {
      const updated = await demoRef.current.archive(workspace.workspaceId, demoToArchive.id);
      setDemos((current) => current.map((item) => (item.id === demoToArchive.id ? updated : item)));
      setMessage(`“${demoToArchive.title}” was archived.`);
    } catch {
      setError("The demo could not be archived.");
    }
  };

  const unarchiveDemo = async (demoToUnarchive: Demo): Promise<void> => {
    if (!workspace || !canManageFolders) return;
    setError(undefined);
    try {
      const updated = await demoRef.current.unarchive(workspace.workspaceId, demoToUnarchive.id);
      setDemos((current) =>
        current.map((item) => (item.id === demoToUnarchive.id ? updated : item))
      );
      setMessage(`“${demoToUnarchive.title}” was unarchived.`);
    } catch {
      setError("The demo could not be unarchived.");
    }
  };

  const softDeleteDemo = async (demoToDelete: Demo): Promise<void> => {
    if (!workspace || !canDelete) return;
    setError(undefined);
    try {
      await demoRef.current.softDelete(workspace.workspaceId, demoToDelete.id);
      setDemos((current) => current.filter((item) => item.id !== demoToDelete.id));
      const loadedTrash = await demoRef.current.listTrash(workspace.workspaceId);
      setTrashItems(loadedTrash);
      setMessage(`“${demoToDelete.title}” was moved to trash.`);
    } catch {
      setError("The demo could not be moved to trash.");
    }
  };

  const restoreDemo = async (itemToRestore: TrashItem): Promise<void> => {
    if (!workspace || !canDelete) return;
    setError(undefined);
    try {
      const restored = await demoRef.current.restore(workspace.workspaceId, itemToRestore.demo.id);
      setTrashItems((current) => current.filter((item) => item.demo.id !== itemToRestore.demo.id));
      if (restored) {
        setDemos((current) => [restored, ...current.filter((item) => item.id !== restored.id)]);
      }
      setMessage(`“${itemToRestore.demo.title}” was restored.`);
    } catch {
      setError("The demo could not be restored.");
    }
  };

  const confirmPermanentDelete = async (): Promise<void> => {
    if (!workspace || !permanentDeleteTarget || !canDelete) return;
    setDeletingPermanently(true);
    setError(undefined);
    try {
      await demoRef.current.permanentDelete(workspace.workspaceId, permanentDeleteTarget.demo.id);
      setTrashItems((current) =>
        current.filter((item) => item.demo.id !== permanentDeleteTarget.demo.id)
      );
      setMessage(`“${permanentDeleteTarget.demo.title}” was permanently deleted.`);
      setPermanentDeleteTarget(null);
    } catch {
      setError("The demo could not be permanently deleted.");
    } finally {
      setDeletingPermanently(false);
    }
  };

  const duplicateDemo = async (demoToDuplicate: Demo): Promise<void> => {
    if (!workspace || !canCreate) return;
    setError(undefined);
    try {
      const duplicated = await demoRef.current.duplicate(workspace.workspaceId, demoToDuplicate.id);
      setDemos((current) => [duplicated, ...current]);
      setMessage(`“${demoToDuplicate.title}” was duplicated successfully.`);
    } catch {
      setError("The demo could not be duplicated.");
    }
  };

  const toggleDemoTemplate = async (targetDemo: Demo): Promise<void> => {
    if (!workspace || !canManageFolders) return;
    setError(undefined);
    try {
      const updated = await demoRef.current.setTemplate(
        workspace.workspaceId,
        targetDemo.id,
        !targetDemo.isTemplate
      );
      setDemos((current) => current.map((item) => (item.id === targetDemo.id ? updated : item)));
      setMessage(
        updated.isTemplate
          ? `“${targetDemo.title}” was set as a template.`
          : `“${targetDemo.title}” is no longer a template.`
      );
    } catch {
      setError("Template status could not be updated.");
    }
  };

  const instantiateTemplate = async (templateDemo: Demo): Promise<void> => {
    if (!workspace || !canCreate) return;
    setError(undefined);
    try {
      const newDemo = await demoRef.current.createFromTemplate(
        workspace.workspaceId,
        templateDemo.id
      );
      setDemos((current) => [newDemo, ...current]);
      setMessage(`Created new demo from template “${templateDemo.title}”.`);
    } catch {
      setError("Could not create demo from template.");
    }
  };

  const closeCreate = (): void => {
    setCreateOpen(false);
    setTitle("");
    setDescription("");
    setType("guided_html");
    if (searchParams.get("new") === "1") setUrlState({ new: undefined });
  };

  const createDemo = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!workspace || !canCreate) return;
    const input: CreateDemoInput = {
      title: title.trim(),
      description: description.trim() || null,
      type
    };
    if (!input.title) {
      setError("Enter a title before creating the demo.");
      return;
    }
    setCreating(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const created = await demoRef.current.create(workspace.workspaceId, input);
      setDemos((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setMessage(`“${created.title}” is ready to edit.`);
      closeCreate();
      setUrlState({ page: undefined });
    } catch (caught) {
      const clientError = caught instanceof Error && "status" in caught ? caught : undefined;
      setError(
        clientError?.status === 403
          ? "You don’t have permission to create demos in this workspace."
          : "The demo could not be created. Check the details and try again."
      );
    } finally {
      setCreating(false);
    }
  };

  const closeFolder = (): void => {
    setFolderOpen(false);
    setFolderName("");
  };

  const createFolder = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!workspace || !canManageFolders || !folderName.trim()) return;
    setSavingFolder(true);
    setError(undefined);
    try {
      const folder = await folderRef.current.create(workspace.workspaceId, {
        name: folderName.trim(),
        parentId: selectedFolderId
      });
      setFolders((current) => [...current, folder]);
      setMessage(`“${folder.name}” was created.`);
      closeFolder();
    } catch (caught) {
      setError(
        caught instanceof Error && "status" in caught && caught.status === 409
          ? "That folder changed elsewhere. Refresh and try again."
          : "The folder could not be created. Check the details and try again."
      );
    } finally {
      setSavingFolder(false);
    }
  };

  const createTag = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!workspace || !canManageFolders || !tagName.trim()) return;
    setSavingTag(true);
    setError(undefined);
    try {
      const tag = await tagRef.current.create(workspace.workspaceId, tagName.trim());
      setTags((current) =>
        [...current, tag].sort((left, right) => left.name.localeCompare(right.name))
      );
      setTagName("");
      setMessage(`“${tag.name}” is ready to use as a filter.`);
    } catch (caught) {
      setError(
        caught instanceof Error && "status" in caught && caught.status === 409
          ? "A tag with that name already exists."
          : "The tag could not be created. Check the name and try again."
      );
    } finally {
      setSavingTag(false);
    }
  };

  const assignTag = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!workspace || !taggingDemo || !selectedTagId || !canManageFolders) return;
    setSavingTagAssignment(true);
    setError(undefined);
    try {
      await tagRef.current.assignToDemo(workspace.workspaceId, selectedTagId, taggingDemo.id);
      setMessage(`A tag was added to “${taggingDemo.title}”.`);
      setTaggingDemo(null);
      setSelectedTagId("");
    } catch {
      setError("The tag could not be added. Your demo was not changed.");
    } finally {
      setSavingTagAssignment(false);
    }
  };

  const openFolderEditor = (): void => {
    if (!selectedFolder) return;
    setFolderName(selectedFolder.name);
    setEditFolderOpen(true);
  };

  const updateFolder = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!workspace || !selectedFolder || !canManageFolders || !folderName.trim()) return;
    setSavingFolder(true);
    setError(undefined);
    try {
      const updated = await folderRef.current.update(
        workspace.workspaceId,
        selectedFolder.id,
        folderName.trim(),
        selectedFolder.version
      );
      setFolders((current) =>
        current.map((folder) => (folder.id === updated.id ? updated : folder))
      );
      setMessage("The folder was renamed.");
      setEditFolderOpen(false);
      setFolderName("");
    } catch (caught) {
      setError(
        caught instanceof Error && "status" in caught && caught.status === 409
          ? "This folder changed elsewhere. Refresh and try again."
          : "The folder could not be renamed. Your existing organization was not changed."
      );
    } finally {
      setSavingFolder(false);
    }
  };

  const deleteFolder = async (): Promise<void> => {
    if (!workspace || !selectedFolder || !canManageFolders) return;
    setSavingFolder(true);
    setError(undefined);
    try {
      await folderRef.current.delete(
        workspace.workspaceId,
        selectedFolder.id,
        selectedFolder.version
      );
      setFolders((current) =>
        current
          .filter((folder) => folder.id !== selectedFolder.id)
          .map((folder) =>
            folder.parentId === selectedFolder.id
              ? { ...folder, parentId: selectedFolder.parentId, version: folder.version + 1 }
              : folder
          )
      );
      setDemos((current) =>
        current.map((demo) =>
          demo.folderId === selectedFolder.id
            ? { ...demo, folderId: selectedFolder.parentId }
            : demo
        )
      );
      setUrlState({ folder: selectedFolder.parentId ?? undefined, page: undefined });
      setMessage("The folder was deleted. Its contents were preserved.");
      setDeleteFolderOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error && "status" in caught && caught.status === 409
          ? "This folder changed elsewhere. Refresh and try again."
          : "The folder could not be deleted. Your existing organization was not changed."
      );
    } finally {
      setSavingFolder(false);
    }
  };

  const moveItem = async (targetFolderId: string | null): Promise<void> => {
    if (!workspace || !dragged || !canManageFolders) return;
    try {
      if (dragged.kind === "demo") {
        const demo = demos.find((item) => item.id === dragged.id);
        if (!demo || demo.folderId === targetFolderId) return;
        await folderRef.current.assignDemo(workspace.workspaceId, demo.id, targetFolderId);
        setDemos((current) =>
          current.map((item) =>
            item.id === demo.id ? { ...item, folderId: targetFolderId } : item
          )
        );
      } else {
        const folder = folders.find((item) => item.id === dragged.id);
        if (!folder || folder.parentId === targetFolderId) return;
        const moved = await folderRef.current.move(
          workspace.workspaceId,
          folder.id,
          targetFolderId,
          folder.version
        );
        setFolders((current) => current.map((item) => (item.id === moved.id ? moved : item)));
      }
      setMessage("The item was moved.");
    } catch (caught) {
      setError(
        caught instanceof Error && "status" in caught && caught.status === 409
          ? "This folder changed elsewhere. Refresh and try again."
          : "The item could not be moved. Your existing organization was not changed."
      );
    } finally {
      setDragged(undefined);
    }
  };

  if (status === "loading") return <DashboardSkeleton />;

  if (status === "denied") {
    return (
      <div className="content-wrap demo-dashboard" role="alert">
        <InlineAlert title="Demos unavailable">{error}</InlineAlert>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="content-wrap demo-dashboard" role="alert">
        <InlineAlert title="Could not load demos">{error}</InlineAlert>
        <div className="demo-dashboard-recovery">
          <Button variant="secondary" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrap demo-dashboard">
      <header className="demo-dashboard-heading">
        <div>
          <p className="eyebrow">Workspace demos</p>
          <h1>Demos</h1>
          <p>Pick up a draft or create a new walkthrough for {workspace?.workspaceName}.</p>
        </div>
        <div className="demo-dashboard-primary-action">
          <Button onClick={() => setCreateOpen(true)} disabled={!canCreate}>
            Create demo
          </Button>
          {!canCreate ? <span>You need create-demo permission.</span> : null}
        </div>
      </header>

      {message ? (
        <p className="demo-dashboard-message" role="status">
          {message}
        </p>
      ) : null}
      {useDemoOnlyData ? (
        <InlineAlert title="Demo-only workspace">
          Sample demos are shown locally. Creating, editing, and sharing are unavailable until the
          API is connected.
        </InlineAlert>
      ) : null}
      {error ? <InlineAlert title="Could not create demo">{error}</InlineAlert> : null}

      <div className="demo-dashboard-layout">
        <FolderSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          templatesCount={demos.filter((demo) => demo.isTemplate).length}
          trashCount={trashItems.length}
          canManage={canManageFolders}
          dragged={dragged}
          onSelect={(folderId) => setUrlState({ folder: folderId ?? undefined, page: undefined })}
          onCreate={() => setFolderOpen(true)}
          onDragStart={setDragged}
          onDragEnd={() => setDragged(undefined)}
          onDrop={(folderId) => void moveItem(folderId)}
        />
        <div className="demo-dashboard-main">
          <div className="demo-folder-context">
            <p aria-label="Current folder">
              {isTrashView
                ? "Demos / Trash"
                : isTemplatesView
                  ? "Demos / Templates"
                  : folderBreadcrumbs(folders, selectedFolderId).join(" / ")}
            </p>
            {isTrashView ? (
              <span>Trashed items are retained for 30 days before permanent deletion.</span>
            ) : selectedFolder ? (
              <div className="demo-folder-actions">
                <span>Drag demos or folders here to organize them.</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={openFolderEditor}
                  disabled={!canManageFolders}
                >
                  Rename
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteFolderOpen(true)}
                  disabled={!canManageFolders}
                >
                  Delete
                </Button>
              </div>
            ) : (
              <span>Unfiled demos</span>
            )}
          </div>
          {isTrashView ? (
            trashItems.length === 0 ? (
              <EmptyState
                title="Trash is empty"
                description="Soft-deleted demos stay here for up to 30 days before being automatically purged."
              />
            ) : (
              <div
                className={view === "grid" ? "demo-card-grid" : "demo-list-view"}
                aria-label="Trashed Demos"
                role="list"
              >
                {trashItems.map((item) => (
                  <TrashCard
                    key={item.demo.id}
                    item={item}
                    canDelete={canDelete}
                    onRestore={() => void restoreDemo(item)}
                    onPermanentDelete={() => setPermanentDeleteTarget(item)}
                  />
                ))}
              </div>
            )
          ) : demos.length === 0 ? (
            <EmptyState
              title="Create your first demo"
              description="Start with a capture type, then add screens and guidance in the editor."
              action={
                <Button onClick={() => setCreateOpen(true)} disabled={!canCreate}>
                  Create demo
                </Button>
              }
            />
          ) : scopedDemos.length === 0 ? (
            <EmptyState
              title={
                query
                  ? "No demos match that search"
                  : hasSearchOrFilters
                    ? "No demos match these filters"
                    : "No demos in this folder"
              }
              description={
                hasSearchOrFilters
                  ? "Try another title, description, or filter combination."
                  : "Drag a demo here, or create a new demo for this folder."
              }
              action={
                <Button
                  variant="secondary"
                  onClick={() =>
                    setUrlState({
                      q: undefined,
                      owner: undefined,
                      type: undefined,
                      status: undefined,
                      tag: undefined,
                      updatedAfter: undefined,
                      updatedBefore: undefined,
                      page: undefined
                    })
                  }
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="demo-dashboard-toolbar" aria-label="Demo display controls">
                <p>
                  {scopedDemos.length} of {demos.length} demo{demos.length === 1 ? "" : "s"}
                </p>
                <div>
                  <Input
                    label="Search demos"
                    hideLabel
                    type="search"
                    placeholder="Search demos"
                    value={searchDraft}
                    maxLength={200}
                    onChange={(event) => setSearchDraft(event.currentTarget.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setFiltersOpen(true)}
                  >
                    Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
                  </Button>
                  <Select
                    label="Sort demos"
                    hideLabel
                    value={sort}
                    onChange={(event) =>
                      setUrlState({ sort: event.currentTarget.value, page: undefined })
                    }
                  >
                    <option value="updated">Last updated</option>
                    <option value="title">Title</option>
                    <option value="status">Status</option>
                  </Select>
                  <div className="demo-view-toggle" role="group" aria-label="Choose demo view">
                    {viewValues.map((value) => (
                      <Button
                        key={value}
                        variant={view === value ? "secondary" : "ghost"}
                        size="sm"
                        aria-pressed={view === value}
                        onClick={() => setUrlState({ view: value, page: undefined })}
                      >
                        {value === "grid" ? "Grid" : "List"}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {view === "grid" ? (
                <div className="demo-card-grid" aria-label="Demos" role="list">
                  {pageDemos.map((demo) => (
                    <DemoCard
                      demo={demo}
                      key={demo.id}
                      draggable={canManageFolders}
                      onDragStart={() => setDragged({ kind: "demo", id: demo.id })}
                      onDragEnd={() => setDragged(undefined)}
                      canManageTags={canManageFolders}
                      onManageTags={() => setTaggingDemo(demo)}
                      canCreateDemos={canCreate}
                      onDuplicate={() => void duplicateDemo(demo)}
                      canManageDemos={canManageFolders}
                      onToggleTemplate={() => void toggleDemoTemplate(demo)}
                      onInstantiateTemplate={() => void instantiateTemplate(demo)}
                      canDeleteDemos={canDelete}
                      openHref={`/demos/${encodeURIComponent(demo.id)}/edit`}
                      onArchive={() => void archiveDemo(demo)}
                      onUnarchive={() => void unarchiveDemo(demo)}
                      onSoftDelete={() => void softDeleteDemo(demo)}
                    />
                  ))}
                </div>
              ) : (
                <div className="demo-list-view" aria-label="Demos" role="list">
                  {pageDemos.map((demo) => (
                    <DemoListRow
                      demo={demo}
                      key={demo.id}
                      draggable={canManageFolders}
                      onDragStart={() => setDragged({ kind: "demo", id: demo.id })}
                      onDragEnd={() => setDragged(undefined)}
                      canManageTags={canManageFolders}
                      onManageTags={() => setTaggingDemo(demo)}
                      canCreateDemos={canCreate}
                      onDuplicate={() => void duplicateDemo(demo)}
                      canManageDemos={canManageFolders}
                      onToggleTemplate={() => void toggleDemoTemplate(demo)}
                      onInstantiateTemplate={() => void instantiateTemplate(demo)}
                      canDeleteDemos={canDelete}
                      openHref={`/demos/${encodeURIComponent(demo.id)}/edit`}
                      onArchive={() => void archiveDemo(demo)}
                      onUnarchive={() => void unarchiveDemo(demo)}
                      onSoftDelete={() => void softDeleteDemo(demo)}
                    />
                  ))}
                </div>
              )}

              <Pagination
                className="demo-dashboard-pagination"
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(nextPage) =>
                  setUrlState({ page: nextPage === 1 ? undefined : String(nextPage) })
                }
                label="Demo pages"
              />
            </>
          )}
        </div>
      </div>

      <Modal
        open={permanentDeleteTarget !== null}
        onClose={() => setPermanentDeleteTarget(null)}
        title={`Permanently delete “${permanentDeleteTarget?.demo.title ?? ""}”?`}
      >
        <p className="demo-dashboard-modal-description">
          This action is permanent and cannot be undone. “{permanentDeleteTarget?.demo.title}” and
          all associated assets will be permanently removed.
        </p>
        <div className="demo-dashboard-modal-actions">
          <Button variant="ghost" onClick={() => setPermanentDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => void confirmPermanentDelete()}
            loading={deletingPermanently}
            loadingLabel="Deleting demo"
            disabled={!canDelete}
          >
            Delete permanently
          </Button>
        </div>
      </Modal>

      <Modal
        open={taggingDemo !== null}
        onClose={() => {
          setTaggingDemo(null);
          setSelectedTagId("");
        }}
        title="Add a tag"
        description={
          taggingDemo
            ? `Choose a workspace tag for “${taggingDemo.title}”. Adding an existing tag is harmless.`
            : "Choose a workspace tag."
        }
      >
        <form className="demo-create-form" onSubmit={(event) => void assignTag(event)} noValidate>
          <Select
            label="Tag"
            value={selectedTagId}
            onChange={(event) => setSelectedTagId(event.currentTarget.value)}
          >
            <option value="">Choose a tag</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </Select>
          {!tags.length ? (
            <p className="demo-filter-help">Create a workspace tag from Filters first.</p>
          ) : null}
          <div className="demo-create-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTaggingDemo(null)}
              disabled={savingTagAssignment}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={savingTagAssignment}
              loadingLabel="Adding tag"
              disabled={!selectedTagId || !canManageFolders}
            >
              Add tag
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter demos"
        description="Filters are saved in this page’s link, so you can share the exact view."
      >
        <div className="demo-filter-form">
          <Input
            label="Owner ID"
            description="Use a workspace member’s ID when you need to narrow by owner."
            value={ownerUserId}
            onChange={(event) =>
              setUrlState({ owner: event.currentTarget.value.trim() || undefined, page: undefined })
            }
            maxLength={36}
          />
          <Select
            label="Demo type"
            value={typeFilter ?? ""}
            onChange={(event) =>
              setUrlState({ type: event.currentTarget.value || undefined, page: undefined })
            }
          >
            <option value="">Any type</option>
            <option value="guided_html">HTML capture</option>
            <option value="screenshot">Screenshot</option>
            <option value="video">Video</option>
            <option value="sandbox">Sandbox</option>
          </Select>
          <Select
            label="Status"
            value={statusFilter ?? ""}
            onChange={(event) =>
              setUrlState({ status: event.currentTarget.value || undefined, page: undefined })
            }
          >
            <option value="">Any status</option>
            {demoStatusValues.map((statusValue) => (
              <option key={statusValue} value={statusValue}>
                {statusLabel(statusValue)}
              </option>
            ))}
          </Select>
          <fieldset className="demo-tag-filter">
            <legend>Tags</legend>
            {tags.length ? (
              <div className="demo-tag-options">
                {tags.map((tag) => (
                  <label key={tag.id}>
                    <input
                      type="checkbox"
                      checked={tagIds.includes(tag.id)}
                      onChange={(event) => {
                        const next = event.currentTarget.checked
                          ? [...tagIds, tag.id]
                          : tagIds.filter((id) => id !== tag.id);
                        setUrlState({
                          tag: next.length ? next.join(",") : undefined,
                          page: undefined
                        });
                      }}
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="demo-filter-help">Create a tag below to start grouping demos.</p>
            )}
          </fieldset>
          <div className="demo-filter-dates">
            <Input
              label="Updated after"
              type="date"
              value={updatedAfter ?? ""}
              onChange={(event) =>
                setUrlState({
                  updatedAfter: event.currentTarget.value || undefined,
                  page: undefined
                })
              }
            />
            <Input
              label="Updated before"
              type="date"
              value={updatedBefore ?? ""}
              onChange={(event) =>
                setUrlState({
                  updatedBefore: event.currentTarget.value || undefined,
                  page: undefined
                })
              }
            />
          </div>
          <form className="demo-tag-create" onSubmit={(event) => void createTag(event)} noValidate>
            <Input
              label="New tag"
              value={tagName}
              onChange={(event) => setTagName(event.currentTarget.value)}
              maxLength={80}
              placeholder="e.g. Onboarding"
            />
            <Button
              type="submit"
              variant="secondary"
              loading={savingTag}
              loadingLabel="Creating tag"
              disabled={!canManageFolders || !tagName.trim()}
            >
              Create tag
            </Button>
          </form>
          <div className="demo-create-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setUrlState({
                  owner: undefined,
                  type: undefined,
                  status: undefined,
                  tag: undefined,
                  updatedAfter: undefined,
                  updatedBefore: undefined,
                  page: undefined
                })
              }
            >
              Clear filters
            </Button>
            <Button type="button" onClick={() => setFiltersOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Create demo"
        description="Choose the capture type now. You can add screens and guidance next."
      >
        <form className="demo-create-form" onSubmit={(event) => void createDemo(event)} noValidate>
          <Input
            label="Demo title"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            maxLength={200}
            autoFocus
            required
          />
          <Textarea
            label="Description"
            description="Optional context for your team."
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            maxLength={4_000}
            rows={3}
          />
          <Select
            label="Capture type"
            description="This stays explicit until you choose to change it."
            value={type}
            onChange={(event) => setType(event.currentTarget.value as DemoType)}
          >
            <option value="guided_html">HTML capture</option>
            <option value="screenshot">Screenshot</option>
            <option value="video">Video</option>
            <option value="sandbox">Sandbox</option>
          </Select>
          <div className="demo-create-actions">
            <Button type="button" variant="ghost" onClick={closeCreate} disabled={creating}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={creating}
              loadingLabel="Creating demo"
              disabled={!canCreate}
            >
              Create demo
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={folderOpen}
        onClose={closeFolder}
        title="New folder"
        description={
          selectedFolderId
            ? "Create a subfolder in the current folder."
            : "Keep related demos together."
        }
      >
        <form
          className="demo-create-form"
          onSubmit={(event) => void createFolder(event)}
          noValidate
        >
          <Input
            label="Folder name"
            value={folderName}
            onChange={(event) => setFolderName(event.currentTarget.value)}
            maxLength={120}
            autoFocus
            required
          />
          <div className="demo-create-actions">
            <Button type="button" variant="ghost" onClick={closeFolder} disabled={savingFolder}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={savingFolder}
              loadingLabel="Creating folder"
              disabled={!canManageFolders || !folderName.trim()}
            >
              Create folder
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={editFolderOpen}
        onClose={() => {
          setEditFolderOpen(false);
          setFolderName("");
        }}
        title="Rename folder"
        description="This does not move the demos inside it."
      >
        <form
          className="demo-create-form"
          onSubmit={(event) => void updateFolder(event)}
          noValidate
        >
          <Input
            label="Folder name"
            value={folderName}
            onChange={(event) => setFolderName(event.currentTarget.value)}
            maxLength={120}
            autoFocus
            required
          />
          <div className="demo-create-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditFolderOpen(false)}
              disabled={savingFolder}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={savingFolder}
              loadingLabel="Renaming folder"
              disabled={!canManageFolders || !folderName.trim()}
            >
              Rename folder
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={deleteFolderOpen}
        onClose={() => setDeleteFolderOpen(false)}
        title="Delete folder?"
        description="The folder itself will be removed. Its direct demos and nested folders will move to its parent, or to Unfiled when it has no parent."
      >
        <div className="demo-create-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeleteFolderOpen(false)}
            disabled={savingFolder}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => void deleteFolder()}
            loading={savingFolder}
            loadingLabel="Deleting folder"
            disabled={!canManageFolders}
          >
            Delete folder
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function DemoCard({
  demo,
  draggable = false,
  onDragStart,
  onDragEnd,
  canManageTags = false,
  onManageTags,
  canCreateDemos = false,
  onDuplicate,
  canManageDemos = false,
  onToggleTemplate,
  onInstantiateTemplate,
  canDeleteDemos = false,
  openHref,
  onArchive,
  onUnarchive,
  onSoftDelete
}: {
  readonly demo: Demo;
  readonly draggable?: boolean;
  readonly onDragStart?: () => void;
  readonly onDragEnd?: () => void;
  readonly canManageTags?: boolean;
  readonly onManageTags?: () => void;
  readonly canCreateDemos?: boolean;
  readonly onDuplicate?: () => void;
  readonly canManageDemos?: boolean;
  readonly onToggleTemplate?: () => void;
  readonly onInstantiateTemplate?: () => void;
  readonly canDeleteDemos?: boolean;
  readonly openHref?: string;
  readonly onArchive?: () => void;
  readonly onUnarchive?: () => void;
  readonly onSoftDelete?: () => void;
}) {
  return (
    <article
      className="demo-card"
      role="listitem"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <DemoThumbnail type={demo.type} />
      <div className="demo-card-content">
        <div>
          <Badge variant={statusVariant(demo.status)}>{statusLabel(demo.status)}</Badge>
          {demo.isTemplate ? <Badge variant="warning">Template</Badge> : null}
          <h2>{demo.title}</h2>
          <p>{demo.description || "No description yet."}</p>
        </div>
        <footer>
          <span>{typeLabel(demo.type)}</span>
          {openHref ? (
            <Link className="ui-button ui-button-secondary ui-button-sm" href={openHref}>
              Open demo
            </Link>
          ) : null}
          {canManageTags ? (
            <Button type="button" size="sm" variant="ghost" onClick={onManageTags}>
              Tags
            </Button>
          ) : null}
          {canCreateDemos ? (
            <Button type="button" size="sm" variant="ghost" onClick={onDuplicate}>
              Duplicate
            </Button>
          ) : null}
          {canManageDemos ? (
            <Button type="button" size="sm" variant="ghost" onClick={onToggleTemplate}>
              {demo.isTemplate ? "Remove template" : "Save as template"}
            </Button>
          ) : null}
          {demo.isTemplate && canCreateDemos ? (
            <Button type="button" size="sm" variant="secondary" onClick={onInstantiateTemplate}>
              Use template
            </Button>
          ) : null}
          {canManageDemos ? (
            demo.status === "archived" ? (
              <Button type="button" size="sm" variant="ghost" onClick={onUnarchive}>
                Unarchive
              </Button>
            ) : (
              <Button type="button" size="sm" variant="ghost" onClick={onArchive}>
                Archive
              </Button>
            )
          ) : null}
          {canDeleteDemos ? (
            <Button type="button" size="sm" variant="ghost" onClick={onSoftDelete}>
              Trash
            </Button>
          ) : null}
          <time dateTime={demo.updatedAt}>{relativeTime(demo.updatedAt)}</time>
        </footer>
      </div>
    </article>
  );
}

function DemoListRow({
  demo,
  draggable = false,
  onDragStart,
  onDragEnd,
  canManageTags = false,
  onManageTags,
  canCreateDemos = false,
  onDuplicate,
  canManageDemos = false,
  onToggleTemplate,
  onInstantiateTemplate,
  canDeleteDemos = false,
  openHref,
  onArchive,
  onUnarchive,
  onSoftDelete
}: {
  readonly demo: Demo;
  readonly draggable?: boolean;
  readonly onDragStart?: () => void;
  readonly onDragEnd?: () => void;
  readonly canManageTags?: boolean;
  readonly onManageTags?: () => void;
  readonly canCreateDemos?: boolean;
  readonly onDuplicate?: () => void;
  readonly canManageDemos?: boolean;
  readonly onToggleTemplate?: () => void;
  readonly onInstantiateTemplate?: () => void;
  readonly canDeleteDemos?: boolean;
  readonly openHref?: string;
  readonly onArchive?: () => void;
  readonly onUnarchive?: () => void;
  readonly onSoftDelete?: () => void;
}) {
  return (
    <article
      className="demo-list-row"
      role="listitem"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <DemoThumbnail type={demo.type} compact />
      <div>
        <h2>{demo.title}</h2>
        <p>{demo.description || "No description yet."}</p>
      </div>
      <span>{typeLabel(demo.type)}</span>
      <Badge variant={statusVariant(demo.status)}>{statusLabel(demo.status)}</Badge>
      {demo.isTemplate ? <Badge variant="warning">Template</Badge> : null}
      {openHref ? (
        <Link className="ui-button ui-button-secondary ui-button-sm" href={openHref}>
          Open demo
        </Link>
      ) : null}
      {canManageTags ? (
        <Button type="button" size="sm" variant="ghost" onClick={onManageTags}>
          Tags
        </Button>
      ) : null}
      {canCreateDemos ? (
        <Button type="button" size="sm" variant="ghost" onClick={onDuplicate}>
          Duplicate
        </Button>
      ) : null}
      {canManageDemos ? (
        <Button type="button" size="sm" variant="ghost" onClick={onToggleTemplate}>
          {demo.isTemplate ? "Remove template" : "Save as template"}
        </Button>
      ) : null}
      {demo.isTemplate && canCreateDemos ? (
        <Button type="button" size="sm" variant="secondary" onClick={onInstantiateTemplate}>
          Use template
        </Button>
      ) : null}
      {canManageDemos ? (
        demo.status === "archived" ? (
          <Button type="button" size="sm" variant="ghost" onClick={onUnarchive}>
            Unarchive
          </Button>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={onArchive}>
            Archive
          </Button>
        )
      ) : null}
      {canDeleteDemos ? (
        <Button type="button" size="sm" variant="ghost" onClick={onSoftDelete}>
          Trash
        </Button>
      ) : null}
      <time dateTime={demo.updatedAt}>{relativeTime(demo.updatedAt)}</time>
    </article>
  );
}

function TrashCard({
  item,
  canDelete = false,
  onRestore,
  onPermanentDelete
}: {
  readonly item: TrashItem;
  readonly canDelete?: boolean;
  readonly onRestore: () => void;
  readonly onPermanentDelete: () => void;
}) {
  return (
    <article className="demo-card demo-trash-card" role="listitem">
      <DemoThumbnail type={item.demo.type} />
      <div className="demo-card-content">
        <div>
          <Badge variant="danger">In Trash</Badge>
          <h2>{item.demo.title}</h2>
          <p>{item.demo.description || "No description yet."}</p>
          <p className="trash-retention-notice">
            Permanently deletes in {item.daysRemaining} day{item.daysRemaining === 1 ? "" : "s"}{" "}
            (30-day retention)
          </p>
        </div>
        <footer>
          <span>{typeLabel(item.demo.type)}</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onRestore}
            disabled={!canDelete}
          >
            Restore
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            onClick={onPermanentDelete}
            disabled={!canDelete}
          >
            Delete permanently
          </Button>
        </footer>
      </div>
    </article>
  );
}

function FolderSidebar({
  folders,
  selectedFolderId,
  templatesCount = 0,
  trashCount = 0,
  canManage,
  dragged,
  onSelect,
  onCreate,
  onDragStart,
  onDragEnd,
  onDrop
}: {
  readonly folders: readonly Folder[];
  readonly selectedFolderId: string | null;
  readonly templatesCount?: number;
  readonly trashCount?: number;
  readonly canManage: boolean;
  readonly dragged: { readonly kind: "demo" | "folder"; readonly id: string } | undefined;
  readonly onSelect: (folderId: string | null) => void;
  readonly onCreate: () => void;
  readonly onDragStart: (value: { readonly kind: "folder"; readonly id: string }) => void;
  readonly onDragEnd: () => void;
  readonly onDrop: (folderId: string | null) => void;
}) {
  const children = folderTree(folders);
  const canDrop = Boolean(dragged);
  return (
    <aside className="folder-sidebar" aria-label="Folders">
      <div className="folder-sidebar-heading">
        <span>Folders</span>
        <Button size="sm" variant="ghost" onClick={onCreate} disabled={!canManage}>
          New folder
        </Button>
      </div>
      <div role="tree" className="folder-tree">
        <button
          type="button"
          className={selectedFolderId === null ? "folder-tree-item is-active" : "folder-tree-item"}
          role="treeitem"
          aria-selected={selectedFolderId === null}
          onClick={() => onSelect(null)}
          onDragOver={(event) => {
            if (canDrop) event.preventDefault();
          }}
          onDrop={() => onDrop(null)}
        >
          Unfiled
        </button>
        {children.map((folder) => (
          <FolderTreeItem
            folder={folder}
            key={folder.id}
            selectedFolderId={selectedFolderId}
            canManage={canManage}
            canDrop={canDrop}
            onSelect={onSelect}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
          />
        ))}
        <button
          type="button"
          className={
            selectedFolderId === "templates" ? "folder-tree-item is-active" : "folder-tree-item"
          }
          role="treeitem"
          aria-selected={selectedFolderId === "templates"}
          onClick={() => onSelect("templates")}
        >
          Templates ({templatesCount})
        </button>
        <button
          type="button"
          className={
            selectedFolderId === "trash" ? "folder-tree-item is-active" : "folder-tree-item"
          }
          role="treeitem"
          aria-selected={selectedFolderId === "trash"}
          onClick={() => onSelect("trash")}
        >
          Trash ({trashCount})
        </button>
      </div>
    </aside>
  );
}

function FolderTreeItem({
  folder,
  selectedFolderId,
  canManage,
  canDrop,
  onSelect,
  onDragStart,
  onDragEnd,
  onDrop
}: {
  readonly folder: FolderTreeNode;
  readonly selectedFolderId: string | null;
  readonly canManage: boolean;
  readonly canDrop: boolean;
  readonly onSelect: (folderId: string) => void;
  readonly onDragStart: (value: { readonly kind: "folder"; readonly id: string }) => void;
  readonly onDragEnd: () => void;
  readonly onDrop: (folderId: string) => void;
}) {
  return (
    <div role="group">
      <button
        type="button"
        className={
          selectedFolderId === folder.id ? "folder-tree-item is-active" : "folder-tree-item"
        }
        role="treeitem"
        aria-selected={selectedFolderId === folder.id}
        draggable={canManage}
        onClick={() => onSelect(folder.id)}
        onDragStart={() => onDragStart({ kind: "folder", id: folder.id })}
        onDragEnd={onDragEnd}
        onDragOver={(event) => {
          if (canDrop) event.preventDefault();
        }}
        onDrop={() => onDrop(folder.id)}
      >
        {folder.name}
      </button>
      {folder.children.length > 0 ? (
        <div className="folder-tree-children">
          {folder.children.map((child) => (
            <FolderTreeItem
              folder={child}
              key={child.id}
              selectedFolderId={selectedFolderId}
              canManage={canManage}
              canDrop={canDrop}
              onSelect={onSelect}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DemoThumbnail({
  type,
  compact = false
}: {
  readonly type: DemoType;
  readonly compact?: boolean;
}) {
  return (
    <div
      className={`demo-card-thumbnail ${compact ? "demo-card-thumbnail-compact" : ""}`}
      aria-hidden="true"
    >
      <span className="demo-card-thumbnail-bar" />
      <span className="demo-card-thumbnail-stage" />
      <span className="demo-card-thumbnail-copy" />
      <small>{typeLabel(type)}</small>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="content-wrap demo-dashboard" aria-busy="true" aria-label="Loading demos">
      <Skeleton variant="text" lines={2} />
      <div className="demo-card-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton variant="rect" key={index} />
        ))}
      </div>
    </div>
  );
}

type FolderTreeNode = Folder & { readonly children: readonly FolderTreeNode[] };

function folderTree(folders: readonly Folder[]): readonly FolderTreeNode[] {
  const nodes = new Map<string, FolderTreeNode>();
  const roots: FolderTreeNode[] = [];
  for (const folder of folders) nodes.set(folder.id, { ...folder, children: [] });
  for (const folder of folders) {
    const node = nodes.get(folder.id);
    if (!node) continue;
    const parent = folder.parentId ? nodes.get(folder.parentId) : undefined;
    if (!parent) roots.push(node);
    else (parent.children as FolderTreeNode[]).push(node);
  }
  const sort = (items: readonly FolderTreeNode[]): readonly FolderTreeNode[] =>
    [...items]
      .sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: "base" })
      )
      .map((item) => ({ ...item, children: sort(item.children) }));
  return sort(roots);
}

function folderBreadcrumbs(folders: readonly Folder[], folderId: string | null): readonly string[] {
  if (!folderId) return ["Demos", "Unfiled"];
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const names: string[] = [];
  let current = byId.get(folderId);
  let steps = 0;
  while (current && steps < 10) {
    names.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
    steps += 1;
  }
  return ["Demos", ...names];
}

function parseValue<const Values extends readonly string[]>(
  value: string | null,
  values: Values,
  fallback: Values[number]
): Values[number] {
  return value && values.includes(value) ? (value as Values[number]) : fallback;
}

function parseOptionalValue<const Values extends readonly string[]>(
  value: string | null,
  values: Values
): Values[number] | undefined {
  return value && values.includes(value) ? (value as Values[number]) : undefined;
}

function parseTagIds(value: string): readonly string[] {
  const ids = value.split(",").filter((id) => /^[0-9a-f-]{36}$/iu.test(id));
  return Array.from(new Set(ids)).slice(0, 10);
}

function parseDate(value: string | null): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? value
    : undefined;
}

function parsePage(value: string | null): number {
  return value && /^\d{1,5}$/u.test(value) ? Math.max(1, Number(value)) : 1;
}

function sortDemos(demos: readonly Demo[], sort: DashboardSort): readonly Demo[] {
  return [...demos].sort((left, right) => {
    if (sort === "title")
      return left.title.localeCompare(right.title, undefined, { sensitivity: "base" });
    if (sort === "status") return statusLabel(left.status).localeCompare(statusLabel(right.status));
    return (
      Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || right.id.localeCompare(left.id)
    );
  });
}

function statusLabel(status: DemoStatus): string {
  return {
    draft: "Draft",
    processing: "Processing",
    published: "Published",
    failed: "Failed",
    needs_update: "Needs update",
    archived: "Archived"
  }[status];
}

function statusVariant(status: DemoStatus): "neutral" | "success" | "warning" | "danger" {
  if (status === "published") return "success";
  if (status === "failed") return "danger";
  if (status === "processing" || status === "needs_update") return "warning";
  return "neutral";
}

function typeLabel(type: DemoType): string {
  return {
    guided_html: "HTML capture",
    screenshot: "Screenshot",
    video: "Video",
    sandbox: "Sandbox"
  }[type];
}

function relativeTime(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Updated recently";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  return `Updated ${Math.floor(hours / 24)}d ago`;
}
