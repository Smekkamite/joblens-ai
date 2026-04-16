export type WorkMode = "remote" | "hybrid" | "onsite" | "unknown";

export type WorkModeAnalysis = {
  mode: WorkMode;
  label: string;
};

const EXT_ROOT_ID = "joblens-ai-extension-root";

function isInsideExtension(el: Element | null): boolean {
  if (!el) return false;
  return !!el.closest(`#${EXT_ROOT_ID}`);
}

function getActiveJobRoot(): Element | null {
  const selectors = [
    ".jobs-search__job-details--container",
    ".job-view-layout",
    ".scaffold-layout__detail",
    ".jobs-details",
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

function collectScopedTexts(root: Element | null): string[] {
  if (!root) return [];

  const selectors = ["button", "span", "div", "li"];
  const texts: string[] = [];

  for (const selector of selectors) {
    const elements = Array.from(root.querySelectorAll(selector));

    for (const el of elements) {
      if (isInsideExtension(el)) continue;

      const text = el.textContent?.replace(/\s+/g, " ").trim();
      if (!text) continue;
      if (text.length > 120) continue;
      texts.push(text.toLowerCase());
    }
  }

  return texts;
}

function detectFromScopedUI(): { mode: WorkMode; officeNote?: string } {
  const root = getActiveJobRoot();
  const texts = collectScopedTexts(root);

  for (const text of texts) {
    if (text === "on-site" || text === "onsite" || text === "on site") {
      return { mode: "onsite" };
    }

    if (text === "hybrid") {
      return { mode: "hybrid" };
    }

    if (text === "remote") {
      return { mode: "remote" };
    }

    const officeMatch =
      text.match(/(\d+)\s*day[s]?\s*(per|\/)?\s*(week)?\s*(in office|onsite)/) ||
      text.match(/(\d+)\s*day[s]?\s*(onsite|in office)/);

    if (officeMatch) {
      return {
        mode: "hybrid",
        officeNote: `${officeMatch[1]} day/week`,
      };
    }

    if (
      text.includes("occasionally onsite") ||
      text.includes("occasional office presence") ||
      text.includes("office attendance required")
    ) {
      return {
        mode: "hybrid",
        officeNote: "office attendance",
      };
    }
  }

  return { mode: "unknown" };
}

export function analyzeWorkMode(text: string): WorkModeAnalysis {
  const lower = text.toLowerCase();

  let regionNote = "";
  let travelNote = "";

  const restrictionPatterns: Array<{ label: string; patterns: string[] }> = [
    {
      label: "EU only",
      patterns: ["eu only", "europe only", "within eu", "across eu"],
    },
    {
      label: "UK only",
      patterns: ["uk only", "united kingdom only", "within uk"],
    },
    {
      label: "Germany only",
      patterns: ["germany only", "based in germany", "within germany"],
    },
    {
      label: "Italy only",
      patterns: ["italy only", "based in italy", "within italy"],
    },
    {
      label: "Spain only",
      patterns: ["spain only", "based in spain", "within spain"],
    },
    {
      label: "France only",
      patterns: ["france only", "based in france", "within france"],
    },
    {
      label: "US only",
      patterns: ["usa only", "us only", "united states only", "within the us"],
    },
  ];

  for (const item of restrictionPatterns) {
    if (item.patterns.some((pattern) => lower.includes(pattern))) {
      regionNote = item.label;
      break;
    }
  }

  if (
    lower.includes("travel required") ||
    lower.includes("occasional travel") ||
    lower.includes("business travel") ||
    /\b\d+%\s*travel\b/.test(lower)
  ) {
    travelNote = "travel required";
  }

  // 1. UI FIRST, BUT ONLY INSIDE ACTIVE JOB DETAIL
  const uiResult = detectFromScopedUI();

  if (uiResult.mode !== "unknown") {
    if (uiResult.mode === "onsite") {
      return { mode: "onsite", label: "onsite" };
    }

    if (uiResult.mode === "hybrid") {
      return {
        mode: "hybrid",
        label: uiResult.officeNote
          ? `hybrid (${uiResult.officeNote})`
          : "hybrid",
      };
    }

    if (uiResult.mode === "remote") {
      const notes = [regionNote, travelNote].filter(Boolean);
      return {
        mode: "remote",
        label: notes.length > 0 ? `remote (${notes.join(", ")})` : "remote",
      };
    }
  }

  // 2. TEXT FALLBACK
  const hasRemote = lower.includes("remote");
  const hasHybrid = lower.includes("hybrid");
  const hasOnsite =
    lower.includes("on-site") ||
    lower.includes("onsite") ||
    lower.includes("on site");

  const officeMatch =
    lower.match(/(\d+)\s*day[s]?\s*(per|\/)?\s*(week)?\s*(in office|onsite)/) ||
    lower.match(/(\d+)\s*day[s]?\s*(onsite|in office)/);

  if (hasOnsite) {
    return { mode: "onsite", label: "onsite" };
  }

  if (hasHybrid || officeMatch) {
    const officeNote = officeMatch ? `${officeMatch[1]} day/week` : "";
    return {
      mode: "hybrid",
      label: officeNote ? `hybrid (${officeNote})` : "hybrid",
    };
  }

  if (hasRemote) {
    const notes = [regionNote, travelNote].filter(Boolean);
    return {
      mode: "remote",
      label: notes.length > 0 ? `remote (${notes.join(", ")})` : "remote",
    };
  }

  return {
    mode: "unknown",
    label: "unknown",
  };
}