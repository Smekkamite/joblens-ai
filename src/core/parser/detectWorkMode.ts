export type WorkMode = "remote" | "hybrid" | "onsite" | "unknown";

function getWorkModeFromDOM(): WorkMode {
  const badges = Array.from(
    document.querySelectorAll("button, span, div")
  );

  for (const el of badges) {
    const text = el.textContent?.toLowerCase().trim();

    if (!text) continue;

    if (text === "on-site" || text === "onsite") {
      return "onsite";
    }

    if (text === "remote") {
      return "remote";
    }

    if (text === "hybrid") {
      return "hybrid";
    }
  }

  return "unknown";
}

export function detectWorkMode(text: string): WorkMode {
  // 1. prova dal DOM (più affidabile)
  const domResult = getWorkModeFromDOM();
  if (domResult !== "unknown") return domResult;

  // 2. fallback testo
  const lower = text.toLowerCase();

  if (lower.includes("remote")) return "remote";
  if (lower.includes("hybrid")) return "hybrid";
  if (
    lower.includes("on-site") ||
    lower.includes("onsite") ||
    lower.includes("on site")
  ) {
    return "onsite";
  }

  return "unknown";
}