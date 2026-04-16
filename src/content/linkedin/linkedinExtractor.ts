export type RawJobData = {
  title: string;
  company: string;
  location: string;
  description: string;
};

const EXT_ROOT_ID = "joblens-ai-extension-root";

function isInsideExtension(el: Element | null): boolean {
  if (!el) return false;
  return !!el.closest(`#${EXT_ROOT_ID}`);
}

function cleanText(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function getFirstText(selectors: string[]): string {
  for (const selector of selectors) {
    const elements = Array.from(document.querySelectorAll(selector));

    for (const el of elements) {
      if (isInsideExtension(el)) continue;

      const text = cleanText(el.textContent);
      if (text) return text;
    }
  }

  return "";
}

function getDescriptionText(): string {
  const selectors = [
    ".jobs-description__content",
    ".jobs-box__html-content",
    ".jobs-description-content__text",
    ".jobs-search__right-rail",
    ".job-details-module",
    "main"
  ];

  for (const selector of selectors) {
    const elements = Array.from(document.querySelectorAll(selector));

    for (const el of elements) {
      if (isInsideExtension(el)) continue;

      const text = cleanText(el.textContent);
      if (!text) continue;

      if (
        text.includes("About the job") ||
        text.includes("Description") ||
        text.includes("Key job responsibilities") ||
        text.includes("Minimum qualifications")
      ) {
        return text;
      }
    }
  }

  return "";
}

function getTitle(): string {
  return getFirstText([
    ".job-details-jobs-unified-top-card__job-title h1",
    ".jobs-unified-top-card__job-title h1",
    ".jobs-search__right-rail h1",
    ".jobs-details h1",
    "main h1"
  ]);
}

function getCompany(): string {
  return getFirstText([
    ".job-details-jobs-unified-top-card__company-name a",
    ".jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name",
    ".jobs-search__right-rail a[href*='/company/']",
    "main a[href*='/company/']"
  ]);
}

function getLocation(): string {
  const selectors = [
    ".job-details-jobs-unified-top-card__primary-description-container",
    ".jobs-unified-top-card__primary-description-container",
    ".job-details-jobs-unified-top-card__bullet",
    ".jobs-unified-top-card__bullet",
    ".jobs-search__right-rail",
    "main"
  ];

  for (const selector of selectors) {
    const elements = Array.from(document.querySelectorAll(selector));

    for (const el of elements) {
      if (isInsideExtension(el)) continue;

      const text = cleanText(el.textContent);
      if (!text) continue;

      const locationMatch = text.match(
        /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s?[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s?[A-Z][a-z]+)\b/
      );

      if (locationMatch?.[1]) {
        return locationMatch[1];
      }

      const shortMatch = text.match(
        /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s?[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/
      );

      if (shortMatch?.[1]) {
        return shortMatch[1];
      }
    }
  }

  return "";
}

export function extractLinkedInJob(): RawJobData | null {
  const isJobsPage =
    window.location.href.includes("/jobs/") ||
    window.location.href.includes("currentJobId=");

  if (!isJobsPage) {
    return null;
  }

  const title = getTitle();
  const company = getCompany();
  const location = getLocation();
  const description = getDescriptionText();

  const looksLikeJob =
    !!title ||
    !!description ||
    document.body.innerText.includes("About the job") ||
    document.body.innerText.includes("Apply") ||
    document.body.innerText.includes("Save");

  if (!looksLikeJob) {
    return null;
  }

  return {
    title,
    company,
    location,
    description,
  };
}