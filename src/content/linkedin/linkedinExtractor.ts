export type RawJobData = {
  title: string;
  company: string;
  location: string;
  description: string;
  metadata: string[];
};

const EXT_ROOT_ID = "joblens-ai-extension-root";

function isInsideExtension(el: Element | null): boolean {
  if (!el) return false;
  return !!el.closest(`#${EXT_ROOT_ID}`);
}

function cleanText(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function getCurrentJobPanel(): Element | null {
  const selectors = [
    ".jobs-search__job-details--container",
    ".jobs-details",
    ".job-view-layout",
    ".scaffold-layout__detail",
    ".jobs-unified-top-card",
    "main",
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && !isInsideExtension(el)) {
      return el;
    }
  }

  return null;
}

function getTextFromWithin(root: ParentNode, selectors: string[]): string {
  for (const selector of selectors) {
    const el = root.querySelector(selector);
    if (el && !isInsideExtension(el)) {
      const text = cleanText(el.textContent);
      if (text) return text;
    }
  }
  return "";
}

function getAllTextsFromWithin(root: ParentNode, selectors: string[]): string[] {
  const out: string[] = [];

  for (const selector of selectors) {
    const elements = Array.from(root.querySelectorAll(selector));
    for (const el of elements) {
      if (isInsideExtension(el)) continue;
      const text = cleanText(el.textContent);
      if (!text) continue;
      out.push(text);
    }
  }

  return Array.from(new Set(out));
}

function getTitle(root: ParentNode): string {
  return getTextFromWithin(root, [
    ".job-details-jobs-unified-top-card__job-title h1",
    ".jobs-unified-top-card__job-title h1",
    "h1",
  ]);
}

function getCompany(root: ParentNode): string {
  return getTextFromWithin(root, [
    ".job-details-jobs-unified-top-card__company-name a",
    ".jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name",
  ]);
}

function getLocation(root: ParentNode): string {
  const candidates = getAllTextsFromWithin(root, [
    ".job-details-jobs-unified-top-card__primary-description-container",
    ".jobs-unified-top-card__primary-description-container",
    ".job-details-jobs-unified-top-card__bullet",
    ".jobs-unified-top-card__bullet",
  ]);

  for (const text of candidates) {
    const parts = text.split("·").map((x) => cleanText(x));
    for (const part of parts) {
      if (
        /remote|hybrid|on-site|onsite|in sede|presenza/i.test(part) ||
        /applicants|responses|reviewing|promoted|save|easy apply/i.test(part)
      ) {
        continue;
      }

      if (part.includes(",")) return part;
    }
  }

  return "";
}

function getMetadata(root: ParentNode): string[] {
  const raw = getAllTextsFromWithin(root, [
    ".job-details-jobs-unified-top-card__job-insight",
    ".jobs-unified-top-card__job-insight",
    ".job-details-jobs-unified-top-card__workplace-type",
    ".jobs-unified-top-card__workplace-type",
    ".artdeco-pill",
    ".job-details-preferences-and-skills__pill",
  ]);

  return raw.filter((text) => {
    const lower = text.toLowerCase();
    return !(
      lower.includes("easy apply") ||
      lower.includes("save") ||
      lower.includes("message") ||
      lower.includes("premium") ||
      lower.includes("try premium")
    );
  });
}

function getDescriptionText(root: ParentNode): string {
  const selectors = [
    ".jobs-description__content",
    ".jobs-box__html-content",
    ".jobs-description-content__text",
    ".job-details-module",
    ".jobs-description",
  ];

  for (const selector of selectors) {
    const el = root.querySelector(selector);
    if (!el || isInsideExtension(el)) continue;

    const text = cleanText(el.textContent);
    if (!text) continue;

    if (
      text.includes("About the job") ||
      text.includes("Descrizione") ||
      text.includes("Description") ||
      text.includes("Responsabilità") ||
      text.includes("Requirements") ||
      text.includes("Competenze Richieste") ||
      text.includes("Cosa offriamo")
    ) {
      return text;
    }
  }

  return "";
}

export function extractLinkedInJob(): RawJobData | null {
  const isJobsPage =
    window.location.href.includes("/jobs/") ||
    window.location.href.includes("currentJobId=");

  if (!isJobsPage) return null;

  const root = getCurrentJobPanel();
  if (!root) return null;

  const title = getTitle(root);
  const company = getCompany(root);
  const location = getLocation(root);
  const metadata = getMetadata(root);
  const description = getDescriptionText(root);

  const looksLikeJob =
    !!title ||
    !!description ||
    root.textContent?.includes("About the job") ||
    root.textContent?.includes("Descrizione") ||
    root.textContent?.includes("Requirements") ||
    root.textContent?.includes("Competenze Richieste");

  if (!looksLikeJob) return null;

  return {
    title,
    company,
    location,
    description,
    metadata,
  };
}