/**
 * Showcase 2.0 authoring model for multi-content destinations.
 */

export type ShowcaseLayout = "section" | "checklist" | "gallery";
export type ShowcaseContentType = "demo" | "video" | "pdf" | "embed";

export interface ShowcaseItem {
  readonly id: string;
  readonly title: string;
  readonly type: ShowcaseContentType;
  readonly url: string | null;
  readonly description: string;
}

export interface ShowcaseSection {
  readonly id: string;
  readonly title: string;
  readonly items: readonly ShowcaseItem[];
}

export interface ShowcaseDocument {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly layout: ShowcaseLayout;
  readonly autoplayNext: boolean;
  readonly sections: readonly ShowcaseSection[];
  readonly isPublished: boolean;
}

const MAX_ID_LENGTH = 96;
const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 600;

function text(value: string, fallback: string, max: number): string {
  const normalized = value.trim().slice(0, max);
  return normalized || fallback;
}

function safeId(value: string, fallback: string): string {
  const normalized = value.replace(/[^a-zA-Z0-9_-]/gu, "-").slice(0, MAX_ID_LENGTH);
  return normalized || fallback;
}

/** Only public HTTPS resources can be placed in a showcase. */
export function sanitizeShowcaseUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    const host = parsed.hostname.toLowerCase().replaceAll("[", "").replaceAll("]", "");
    if (isPrivateHost(host)) return null;
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

function isPrivateHost(host: string): boolean {
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.startsWith("fc") ||
    host.startsWith("fd") ||
    host.startsWith("fe80:")
  ) {
    return true;
  }
  const octets = host.split(".").map((part) => Number(part));
  if (
    octets.length !== 4 ||
    !octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
  ) {
    return false;
  }
  const first = octets[0] ?? -1;
  const second = octets[1] ?? -1;
  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

export function createShowcaseDocument(id: string, title = "Untitled Showcase"): ShowcaseDocument {
  const safeDocumentId = safeId(id, "showcase-draft");
  return Object.freeze({
    id: safeDocumentId,
    title: text(title, "Untitled Showcase", MAX_TITLE_LENGTH),
    description: "",
    layout: "section",
    autoplayNext: false,
    sections: Object.freeze([
      Object.freeze({
        id: `${safeDocumentId}-section-1`,
        title: "Getting started",
        items: Object.freeze([])
      })
    ]),
    isPublished: false
  });
}

export function parseShowcaseDocument(input: unknown): ShowcaseDocument {
  if (!input || typeof input !== "object") throw new Error("Showcase document must be an object.");
  const raw = input as Record<string, unknown>;
  const base = createShowcaseDocument(
    typeof raw["id"] === "string" ? raw["id"] : "showcase-draft",
    typeof raw["title"] === "string" ? raw["title"] : "Untitled Showcase"
  );
  const rawSections = Array.isArray(raw["sections"]) ? raw["sections"] : [];
  const sections = rawSections.slice(0, 50).flatMap((section, index) => {
    if (!section || typeof section !== "object") return [];
    const candidate = section as Record<string, unknown>;
    const rawItems = Array.isArray(candidate["items"]) ? candidate["items"] : [];
    const items = rawItems.slice(0, 100).flatMap((item, itemIndex) => {
      if (!item || typeof item !== "object") return [];
      const value = item as Record<string, unknown>;
      const itemType = value["type"];
      const type: ShowcaseContentType =
        itemType === "video" || itemType === "pdf" || itemType === "embed" ? itemType : "demo";
      return [
        Object.freeze({
          id: safeId(
            typeof value["id"] === "string" ? value["id"] : `${base.id}-item-${itemIndex}`,
            `${base.id}-item-${itemIndex}`
          ),
          title: text(
            typeof value["title"] === "string" ? value["title"] : "Untitled resource",
            "Untitled resource",
            MAX_TITLE_LENGTH
          ),
          type,
          url: sanitizeShowcaseUrl(typeof value["url"] === "string" ? value["url"] : null),
          description: text(
            typeof value["description"] === "string" ? value["description"] : "",
            "",
            MAX_DESCRIPTION_LENGTH
          )
        })
      ];
    });
    return [
      Object.freeze({
        id: safeId(
          typeof candidate["id"] === "string" ? candidate["id"] : `${base.id}-section-${index}`,
          `${base.id}-section-${index}`
        ),
        title: text(
          typeof candidate["title"] === "string" ? candidate["title"] : "Untitled section",
          "Untitled section",
          MAX_TITLE_LENGTH
        ),
        items: Object.freeze(items)
      })
    ];
  });
  return Object.freeze({
    ...base,
    description: text(
      typeof raw["description"] === "string" ? raw["description"] : "",
      "",
      MAX_DESCRIPTION_LENGTH
    ),
    layout:
      raw["layout"] === "checklist" || raw["layout"] === "gallery" ? raw["layout"] : "section",
    autoplayNext: raw["autoplayNext"] === true,
    sections: Object.freeze(sections.length > 0 ? sections : base.sections),
    isPublished: raw["isPublished"] === true
  });
}

export function updateShowcaseDocument(
  document: ShowcaseDocument,
  changes: Partial<Pick<ShowcaseDocument, "title" | "description" | "layout" | "autoplayNext">>
): ShowcaseDocument {
  return Object.freeze({
    ...document,
    title:
      changes.title === undefined
        ? document.title
        : text(changes.title, document.title, MAX_TITLE_LENGTH),
    description:
      changes.description === undefined
        ? document.description
        : text(changes.description, "", MAX_DESCRIPTION_LENGTH),
    layout: changes.layout ?? document.layout,
    autoplayNext: changes.autoplayNext ?? document.autoplayNext
  });
}

export function addShowcaseSection(
  document: ShowcaseDocument,
  title = "New section"
): ShowcaseDocument {
  if (document.sections.length >= 50)
    throw new Error("A showcase can contain at most 50 sections.");
  const id = `${document.id}-section-${document.sections.length + 1}`;
  return Object.freeze({
    ...document,
    sections: Object.freeze([
      ...document.sections,
      Object.freeze({
        id,
        title: text(title, "New section", MAX_TITLE_LENGTH),
        items: Object.freeze([])
      })
    ])
  });
}

export function addShowcaseItem(
  document: ShowcaseDocument,
  sectionId: string,
  item: Omit<ShowcaseItem, "id" | "url"> & { readonly id?: string; readonly url?: string | null }
): ShowcaseDocument {
  const sectionIndex = document.sections.findIndex((section) => section.id === sectionId);
  if (sectionIndex < 0) throw new Error("Showcase section was not found.");
  const section = document.sections[sectionIndex];
  if (!section) throw new Error("Showcase section was not found.");
  if (section.items.length >= 100) throw new Error("A section can contain at most 100 items.");
  const nextItem: ShowcaseItem = Object.freeze({
    id: safeId(item.id ?? `${sectionId}-item-${section.items.length + 1}`, `${sectionId}-item`),
    title: text(item.title, "Untitled resource", MAX_TITLE_LENGTH),
    type: item.type,
    url: sanitizeShowcaseUrl(item.url),
    description: text(item.description, "", MAX_DESCRIPTION_LENGTH)
  });
  const sections = [...document.sections];
  sections[sectionIndex] = Object.freeze({
    ...section,
    items: Object.freeze([...section.items, nextItem])
  });
  return Object.freeze({ ...document, sections: Object.freeze(sections) });
}

export function removeShowcaseItem(
  document: ShowcaseDocument,
  sectionId: string,
  itemId: string
): ShowcaseDocument {
  return Object.freeze({
    ...document,
    sections: Object.freeze(
      document.sections.map((section) =>
        section.id === sectionId
          ? Object.freeze({
              ...section,
              items: Object.freeze(section.items.filter((item) => item.id !== itemId))
            })
          : section
      )
    )
  });
}

export function publishShowcase(document: ShowcaseDocument): ShowcaseDocument {
  if (!document.title.trim()) throw new Error("A showcase title is required.");
  if (document.sections.length === 0) throw new Error("Add at least one showcase section.");
  return Object.freeze({ ...document, isPublished: true });
}
