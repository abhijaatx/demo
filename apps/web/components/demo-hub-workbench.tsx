"use client";

import {
  addCategoryToHub,
  createDemoHubConfig,
  createHubSdkOptions,
  parseAndSanitizeBrandingTheme,
  publishDemoHub,
  toggleHubWidget,
  validateSafeUrl,
  type DemoHubCategory,
  type DemoHubConfig,
  type HubSdkMountOptions
} from "@supademo/domain";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type HubTab = "content" | "appearance" | "install";
type HeaderDisplay = "title" | "logo";
type HeaderBackground = "gradient" | "solid";
type Alignment = "left" | "center" | "right";

type HubAppearance = {
  readonly headerDisplay: HeaderDisplay;
  readonly background: HeaderBackground;
  readonly headerTextColor: string;
  readonly headerAlignment: Alignment;
  readonly showCloseButton: boolean;
  readonly theme: "light" | "dark";
  readonly showLauncher: boolean;
  readonly launcherPosition: "left" | "right";
  readonly footerLabel: string;
  readonly footerUrl: string;
  readonly headerLogoUrl: string;
  readonly launcherIconUrl: string;
};

type HubCatalogItem = {
  readonly id: string;
  readonly type: "Supademo" | "Showcase";
  readonly title: string;
  readonly description: string;
};

const catalog: readonly HubCatalogItem[] = [
  {
    id: "demo-onboarding",
    type: "Supademo",
    title: "Customer onboarding",
    description: "Help new users get started in minutes."
  },
  {
    id: "demo-product",
    type: "Supademo",
    title: "Product walkthrough",
    description: "Explore the product's core workflows."
  },
  {
    id: "demo-analytics",
    type: "Supademo",
    title: "Analytics overview",
    description: "Turn usage signals into clear next steps."
  },
  {
    id: "showcase-sales",
    type: "Showcase",
    title: "Sales showcase",
    description: "A collection of high-intent sales stories."
  },
  {
    id: "showcase-support",
    type: "Showcase",
    title: "Support academy",
    description: "Self-paced tutorials for common questions."
  },
  {
    id: "demo-release",
    type: "Supademo",
    title: "Feature release highlights",
    description: "A quick tour of the latest product updates."
  }
];

const starterCategories: readonly DemoHubCategory[] = [
  { categoryId: "category-start-here", title: "Getting started", demoIds: ["demo-onboarding"] },
  {
    categoryId: "category-features",
    title: "Key features",
    demoIds: ["demo-product", "demo-analytics"]
  },
  { categoryId: "category-resources", title: "Resources", demoIds: ["showcase-support"] }
];

const defaultAppearance: HubAppearance = {
  headerDisplay: "title",
  background: "gradient",
  headerTextColor: "#ffffff",
  headerAlignment: "left",
  showCloseButton: true,
  theme: "light",
  showLauncher: true,
  launcherPosition: "right",
  footerLabel: "Need more help? Visit our knowledge base.",
  footerUrl: "https://supademo.com/help",
  headerLogoUrl: "",
  launcherIconUrl: ""
};

function createInitialHub(): DemoHubConfig {
  return createDemoHubConfig(
    "hub-product-guides",
    "workspace-local",
    "Product Guides",
    starterCategories
  );
}

function updateCategory(
  hub: DemoHubConfig,
  categoryId: string,
  updater: (category: DemoHubCategory) => DemoHubCategory
): DemoHubConfig {
  return {
    ...hub,
    categories: hub.categories.map((category) =>
      category.categoryId === categoryId ? updater(category) : category
    )
  };
}

function safeDomainList(value: string): readonly string[] {
  return value
    .split(/[,\n]/u)
    .map((domain) => domain.trim().toLowerCase())
    .filter((domain) => /^[a-z0-9*.-]{1,253}$/u.test(domain))
    .slice(0, 10);
}

function makeCategoryId(existing: readonly DemoHubCategory[]): string {
  let index = existing.length + 1;
  while (existing.some((category) => category.categoryId === `category-custom-${index}`))
    index += 1;
  return `category-custom-${index}`;
}

function safeAssetFromFile(
  file: File | undefined,
  setError: (message: string) => void,
  setAsset: (url: string) => void
): void {
  if (!file) return;
  if (!file.type.startsWith("image/") || file.size > 2_000_000) {
    setError("Choose an image file under 2 MB.");
    return;
  }
  setError("");
  setAsset(URL.createObjectURL(file));
}

export function DemoHubWorkbench() {
  const [hub, setHub] = useState<DemoHubConfig>(() => createInitialHub());
  const [tab, setTab] = useState<HubTab>("content");
  const [appearance, setAppearance] = useState<HubAppearance>(defaultAppearance);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(starterCategories[0]!.categoryId);
  const [allowedDomains, setAllowedDomains] = useState("app.example.com\n*.example.com");
  const [defaultCategoryIndex, setDefaultCategoryIndex] = useState("1");
  const [sdkOptions, setSdkOptions] = useState<HubSdkMountOptions>(() =>
    createHubSdkOptions("hub-product-guides")
  );
  const [status, setStatus] = useState("Build a searchable hub from your Supademos and Showcases.");
  const [error, setError] = useState("");
  const [widgetOpen, setWidgetOpen] = useState(false);

  const selectedCategory =
    hub.categories.find((category) => category.categoryId === selectedCategoryId) ??
    hub.categories[0] ??
    null;
  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase().slice(0, 120);
    return catalog.filter(
      (item) =>
        !query || `${item.title} ${item.type} ${item.description}`.toLowerCase().includes(query)
    );
  }, [search]);
  const theme = parseAndSanitizeBrandingTheme({
    primaryColor: "#635bff",
    backgroundColor: appearance.theme === "dark" ? "#172033" : "#ffffff",
    textColor: appearance.theme === "dark" ? "#ffffff" : "#172033",
    borderRadiusPx: 14,
    fontFamily: "Inter"
  });
  const previewStyle = {
    "--hub-primary": theme.primaryColor,
    "--hub-background": theme.backgroundColor,
    "--hub-text": theme.textColor,
    "--hub-header-text": appearance.headerTextColor,
    "--hub-radius": `${theme.borderRadiusPx}px`
  } as CSSProperties;

  useEffect(
    () => () => {
      if (appearance.headerLogoUrl.startsWith("blob:"))
        URL.revokeObjectURL(appearance.headerLogoUrl);
      if (appearance.launcherIconUrl.startsWith("blob:"))
        URL.revokeObjectURL(appearance.launcherIconUrl);
    },
    [appearance.headerLogoUrl, appearance.launcherIconUrl]
  );

  const saveHub = (): void => {
    setError("");
    setStatus("Hub changes saved to this local preview.");
  };

  const addCategory = (): void => {
    try {
      const category: DemoHubCategory = {
        categoryId: makeCategoryId(hub.categories),
        title: "New category",
        demoIds: []
      };
      const next = addCategoryToHub(hub, category);
      setHub(next);
      setSelectedCategoryId(category.categoryId);
      setStatus("Category added. Rename it and add demos to make it useful.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Category could not be added.");
    }
  };

  const publishHub = (): void => {
    try {
      const published = publishDemoHub(hub);
      setHub(published);
      setStatus("Demo Hub published. Copy the install snippet to place it in your app.");
      setTab("install");
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Add at least one category before publishing."
      );
    }
  };

  const moveCategory = (categoryId: string, direction: -1 | 1): void => {
    setHub((current) => {
      const index = current.categories.findIndex((category) => category.categoryId === categoryId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.categories.length) return current;
      const categories = [...current.categories];
      [categories[index], categories[target]] = [categories[target]!, categories[index]!];
      return { ...current, categories };
    });
    setStatus("Category order updated.");
  };

  const removeCategory = (categoryId: string): void => {
    setHub((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.categoryId !== categoryId)
    }));
    setSelectedCategoryId(
      hub.categories.find((category) => category.categoryId !== categoryId)?.categoryId ?? ""
    );
    setStatus("Category removed. Publish is disabled until the hub has content categories.");
  };

  const toggleCatalogItem = (itemId: string): void => {
    if (!selectedCategory) return;
    setHub((current) =>
      updateCategory(current, selectedCategory.categoryId, (category) => ({
        ...category,
        demoIds: category.demoIds.includes(itemId)
          ? category.demoIds.filter((id) => id !== itemId)
          : [...category.demoIds, itemId]
      }))
    );
  };

  const installSnippet = useMemo(() => {
    const options = createHubSdkOptions(hub.hubId);
    const domains = safeDomainList(allowedDomains);
    const categoryIndex = Math.max(
      1,
      Math.min(hub.categories.length || 1, Number(defaultCategoryIndex) || 1)
    );
    const domainConfig = domains.length ? `\n  allowedDomains: ${JSON.stringify(domains)},` : "";
    return `<script src="https://cdn.supademo.com/hub-sdk.js" defer></script>\n<script>\n  window.addEventListener("supademo:ready", function () {\n    SupademoHub.init({\n      hubId: ${JSON.stringify(options.hubId)},\n      containerId: ${JSON.stringify(options.containerId)},\n      defaultCategoryIndex: ${String(categoryIndex)},${domainConfig}\n    });\n  });\n</script>`;
  }, [allowedDomains, defaultCategoryIndex, hub.categories.length, hub.hubId]);

  const copySnippet = async (): Promise<void> => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(installSnippet);
      setStatus("Install snippet copied to the clipboard.");
    } catch {
      setStatus("Clipboard access was unavailable; select the snippet and copy it manually.");
    }
  };

  const togglePreviewWidget = (): void => {
    setSdkOptions((current) => {
      const next = toggleHubWidget(current);
      setWidgetOpen(next.isOpen);
      return next;
    });
  };

  const updateAppearance = <K extends keyof HubAppearance>(
    key: K,
    value: HubAppearance[K]
  ): void => {
    setAppearance((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="motion-workbench-page demo-hub-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/hubs">
          ← Back to Demo Hubs
        </a>
        <span className="motion-workbench-kicker">Share · Demo Hub</span>
        <h1>Build a searchable Demo Hub</h1>
        <p>
          Group Supademos and Showcases into a contextual, searchable widget that users can open
          inside your application, website, or document.
        </p>
      </header>
      <div className="motion-workbench-feedback" role="status">
        <span>{status}</span>
        <span className="demo-hub-workbench-local-badge">Local preview</span>
      </div>
      {error ? (
        <p className="demo-hub-workbench-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="motion-workbench-panel demo-hub-workbench-shell">
        <div className="demo-hub-workbench-title-row">
          <label className="motion-workbench-field">
            <span>Demo Hub name</span>
            <input
              value={hub.title}
              maxLength={120}
              onChange={(event) =>
                setHub((current) => ({ ...current, title: event.currentTarget.value }))
              }
            />
          </label>
          <div className="demo-hub-workbench-publish-state">
            <span className={hub.isPublished ? "is-published" : ""}>
              {hub.isPublished ? "Published" : "Draft"}
            </span>
            <button type="button" className="motion-workbench-button" onClick={saveHub}>
              Save changes
            </button>
            <button
              type="button"
              className="motion-workbench-button motion-workbench-button-primary"
              onClick={publishHub}
            >
              {hub.isPublished ? "Republish" : "Publish Hub"}
            </button>
          </div>
        </div>
        <div className="demo-hub-workbench-tabs" role="tablist" aria-label="Demo Hub setup">
          {(
            [
              ["content", "Content", "Categories and demos"],
              ["appearance", "Appearance", "Theme and launcher"],
              ["install", "Install", "SDK and triggers"]
            ] as const
          ).map(([value, label, description]) => (
            <button
              type="button"
              role="tab"
              aria-selected={tab === value}
              className={tab === value ? "is-active" : ""}
              key={value}
              onClick={() => setTab(value)}
            >
              <strong>{label}</strong>
              <small>{description}</small>
            </button>
          ))}
        </div>

        {tab === "content" ? (
          <div className="demo-hub-workbench-content-layout">
            <div className="demo-hub-workbench-categories">
              <div className="demo-hub-workbench-section-heading">
                <div>
                  <span className="motion-workbench-label">Organize content</span>
                  <h2>Categories</h2>
                </div>
                <button type="button" className="motion-workbench-button" onClick={addCategory}>
                  + Add category
                </button>
              </div>
              <div className="demo-hub-workbench-category-list">
                {hub.categories.map((category, index) => (
                  <button
                    type="button"
                    className={`demo-hub-workbench-category ${selectedCategory?.categoryId === category.categoryId ? "is-selected" : ""}`}
                    key={category.categoryId}
                    onClick={() => setSelectedCategoryId(category.categoryId)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{category.title}</strong>
                    <small>{category.demoIds.length} items</small>
                  </button>
                ))}
                {!hub.categories.length ? (
                  <p className="demo-hub-workbench-empty">
                    Add a category to start building your hub.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="demo-hub-workbench-category-editor">
              {selectedCategory ? (
                <>
                  <div className="demo-hub-workbench-section-heading">
                    <div>
                      <span className="motion-workbench-label">Selected category</span>
                      <h2>{selectedCategory.title}</h2>
                    </div>
                    <div className="demo-hub-workbench-icon-actions">
                      <button
                        type="button"
                        aria-label="Move category up"
                        onClick={() => moveCategory(selectedCategory.categoryId, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label="Move category down"
                        onClick={() => moveCategory(selectedCategory.categoryId, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label="Delete category"
                        onClick={() => removeCategory(selectedCategory.categoryId)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <label className="motion-workbench-field">
                    <span>Category name</span>
                    <input
                      value={selectedCategory.title}
                      maxLength={80}
                      onChange={(event) =>
                        setHub((current) =>
                          updateCategory(current, selectedCategory.categoryId, (category) => ({
                            ...category,
                            title: event.currentTarget.value
                          }))
                        )
                      }
                    />
                  </label>
                  <label className="motion-workbench-field demo-hub-workbench-search">
                    <span>Search existing Supademos or Showcases</span>
                    <input
                      type="search"
                      maxLength={120}
                      value={search}
                      placeholder="Search by title or type"
                      onChange={(event) => setSearch(event.currentTarget.value)}
                    />
                  </label>
                  <div className="demo-hub-workbench-catalog" aria-label="Demo Hub content catalog">
                    {filteredCatalog.map((item) => {
                      const checked = selectedCategory.demoIds.includes(item.id);
                      return (
                        <label
                          className={`demo-hub-workbench-catalog-item ${checked ? "is-added" : ""}`}
                          key={item.id}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCatalogItem(item.id)}
                          />
                          <span className="demo-hub-workbench-catalog-mark">
                            {item.type === "Showcase" ? "▦" : "S"}
                          </span>
                          <span>
                            <strong>{item.title}</strong>
                            <small>
                              {item.type} · {item.description}
                            </small>
                          </span>
                          <em>{checked ? "Added" : "Add"}</em>
                        </label>
                      );
                    })}
                  </div>
                  <p className="demo-hub-workbench-helper">
                    Drag-and-drop reordering is represented by the move controls in this preview;
                    production ordering is persisted by the workspace API.
                  </p>
                </>
              ) : (
                <p className="demo-hub-workbench-empty">
                  Select or add a category to edit content.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {tab === "appearance" ? (
          <div className="demo-hub-workbench-appearance-layout">
            <div className="demo-hub-workbench-appearance-controls">
              <div className="demo-hub-workbench-section-heading">
                <div>
                  <span className="motion-workbench-label">Match your product</span>
                  <h2>Appearance</h2>
                </div>
              </div>
              <fieldset className="demo-hub-workbench-fieldset">
                <legend>Header display</legend>
                {(["title", "logo"] as const).map((value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="hub-header-display"
                      checked={appearance.headerDisplay === value}
                      onChange={() => updateAppearance("headerDisplay", value)}
                    />
                    {value === "title" ? "Title" : "Logo"}
                  </label>
                ))}
              </fieldset>
              {appearance.headerDisplay === "logo" ? (
                <label className="motion-workbench-field">
                  <span>Upload header logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      safeAssetFromFile(event.currentTarget.files?.[0], setError, (url) =>
                        updateAppearance("headerLogoUrl", url)
                      )
                    }
                  />
                </label>
              ) : null}
              <div className="demo-hub-workbench-two-column">
                <label className="motion-workbench-field">
                  <span>Background</span>
                  <select
                    value={appearance.background}
                    onChange={(event) =>
                      updateAppearance("background", event.currentTarget.value as HeaderBackground)
                    }
                  >
                    <option value="gradient">Gradient</option>
                    <option value="solid">Solid color</option>
                  </select>
                </label>
                <label className="motion-workbench-field">
                  <span>Header alignment</span>
                  <select
                    value={appearance.headerAlignment}
                    onChange={(event) =>
                      updateAppearance("headerAlignment", event.currentTarget.value as Alignment)
                    }
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
              </div>
              <label className="motion-workbench-color-field">
                <span>Header text color</span>
                <input
                  type="color"
                  value={appearance.headerTextColor}
                  onChange={(event) =>
                    updateAppearance("headerTextColor", event.currentTarget.value)
                  }
                />
              </label>
              <label className="demo-hub-workbench-check">
                <input
                  type="checkbox"
                  checked={appearance.showCloseButton}
                  onChange={(event) =>
                    updateAppearance("showCloseButton", event.currentTarget.checked)
                  }
                />
                Show close button
              </label>
              <label className="motion-workbench-field">
                <span>Theme</span>
                <select
                  value={appearance.theme}
                  onChange={(event) =>
                    updateAppearance("theme", event.currentTarget.value as "light" | "dark")
                  }
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <div className="demo-hub-workbench-divider" />
              <label className="demo-hub-workbench-check">
                <input
                  type="checkbox"
                  checked={appearance.showLauncher}
                  onChange={(event) =>
                    updateAppearance("showLauncher", event.currentTarget.checked)
                  }
                />
                Show floating launcher
              </label>
              <label className="motion-workbench-field">
                <span>Launcher position</span>
                <select
                  value={appearance.launcherPosition}
                  onChange={(event) =>
                    updateAppearance(
                      "launcherPosition",
                      event.currentTarget.value as "left" | "right"
                    )
                  }
                >
                  <option value="left">Left side</option>
                  <option value="right">Right side</option>
                </select>
              </label>
              <label className="motion-workbench-field">
                <span>Launcher icon (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    safeAssetFromFile(event.currentTarget.files?.[0], setError, (url) =>
                      updateAppearance("launcherIconUrl", url)
                    )
                  }
                />
              </label>
              <label className="motion-workbench-field">
                <span>Footer label</span>
                <input
                  value={appearance.footerLabel}
                  maxLength={120}
                  onChange={(event) => updateAppearance("footerLabel", event.currentTarget.value)}
                />
              </label>
              <label className="motion-workbench-field">
                <span>Footer link</span>
                <input
                  value={appearance.footerUrl}
                  maxLength={500}
                  onChange={(event) => updateAppearance("footerUrl", event.currentTarget.value)}
                />
              </label>
            </div>
            <div className="demo-hub-workbench-appearance-preview" style={previewStyle}>
              <span className="motion-workbench-label">Live preview</span>
              <div
                className={`demo-hub-workbench-widget demo-hub-workbench-theme-${appearance.theme}`}
              >
                <header
                  className={`demo-hub-workbench-widget-header is-${appearance.background}`}
                  style={{ textAlign: appearance.headerAlignment }}
                >
                  {appearance.headerDisplay === "logo" && appearance.headerLogoUrl ? (
                    <img src={appearance.headerLogoUrl} alt="Demo Hub logo preview" />
                  ) : (
                    <strong>{hub.title || "Product Guides"}</strong>
                  )}
                  {appearance.showCloseButton ? (
                    <button
                      type="button"
                      onClick={() => setStatus("Preview close button clicked.")}
                    >
                      ×
                    </button>
                  ) : null}
                </header>
                <div className="demo-hub-workbench-widget-body">
                  <input aria-label="Preview hub search" readOnly placeholder="Search demos..." />
                  {hub.categories.slice(0, 3).map((category) => (
                    <div className="demo-hub-workbench-widget-category" key={category.categoryId}>
                      <strong>{category.title}</strong>
                      <small>{category.demoIds.length} resources</small>
                    </div>
                  ))}
                </div>
                <footer>
                  {appearance.footerUrl && validateSafeUrl(appearance.footerUrl) ? (
                    <a
                      href={validateSafeUrl(appearance.footerUrl) ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {appearance.footerLabel}
                    </a>
                  ) : (
                    <span>{appearance.footerLabel}</span>
                  )}
                </footer>
              </div>
              {appearance.showLauncher ? (
                <button
                  type="button"
                  className={`demo-hub-workbench-launcher is-${appearance.launcherPosition}`}
                  onClick={togglePreviewWidget}
                >
                  {appearance.launcherIconUrl ? (
                    <img src={appearance.launcherIconUrl} alt="" />
                  ) : (
                    "S"
                  )}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === "install" ? (
          <div className="demo-hub-workbench-install-layout">
            <div>
              <div className="demo-hub-workbench-section-heading">
                <div>
                  <span className="motion-workbench-label">Place it in your app</span>
                  <h2>Install the Demo Hub SDK</h2>
                </div>
              </div>
              <p className="demo-hub-workbench-helper">
                Add the asynchronous SDK script, initialize after your app loads, and use a custom
                trigger when the floating launcher is hidden.
              </p>
              <label className="motion-workbench-field">
                <span>Default category index</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, hub.categories.length)}
                  value={defaultCategoryIndex}
                  onChange={(event) => setDefaultCategoryIndex(event.currentTarget.value)}
                />
              </label>
              <label className="motion-workbench-field">
                <span>Allowed domains (optional)</span>
                <textarea
                  maxLength={1_000}
                  rows={3}
                  value={allowedDomains}
                  onChange={(event) => setAllowedDomains(event.currentTarget.value)}
                />
                <small>One hostname per line. Wildcards such as *.example.com are supported.</small>
              </label>
              <button
                type="button"
                className="motion-workbench-button motion-workbench-button-primary"
                onClick={() => void copySnippet()}
              >
                Copy install snippet
              </button>
              <button
                type="button"
                className="motion-workbench-button demo-hub-workbench-trigger-button"
                onClick={togglePreviewWidget}
              >
                {widgetOpen ? "Close custom trigger preview" : "Open custom trigger preview"}
              </button>
            </div>
            <div className="demo-hub-workbench-install-preview">
              <label className="motion-workbench-field">
                <span>SDK snippet</span>
                <textarea
                  className="demo-hub-workbench-code"
                  readOnly
                  rows={16}
                  value={installSnippet}
                  aria-label="Demo Hub install snippet"
                />
              </label>
              <div className="demo-hub-workbench-sdk-status">
                <span className={sdkOptions.isOpen ? "is-open" : ""}>
                  {sdkOptions.isOpen ? "Widget open" : "Widget closed"}
                </span>
                <small>
                  Hub ID: {sdkOptions.hubId} · Container: {sdkOptions.containerId}
                </small>
              </div>
              {widgetOpen ? (
                <div
                  className="demo-hub-workbench-sdk-widget"
                  role="dialog"
                  aria-label="Demo Hub widget preview"
                >
                  <div>
                    <strong>{hub.title}</strong>
                    <button
                      type="button"
                      onClick={togglePreviewWidget}
                      aria-label="Close Demo Hub preview"
                    >
                      ×
                    </button>
                  </div>
                  {hub.categories.map((category, index) => (
                    <button
                      type="button"
                      key={category.categoryId}
                      onClick={() => setStatus(`Opened ${category.title} in the widget.`)}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{category.title}</strong>
                      <small>{category.demoIds.length} resources</small>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
      <p className="demo-hub-workbench-disclaimer">
        Local preview only: production SDK delivery, workspace authorization, allowed-domain checks,
        asset storage, and analytics events must be enforced by Supademo services.
      </p>
    </main>
  );
}
