export type Seniority = "junior" | "mid" | "senior" | "lead" | "unknown";

function detectFromTitle(title: string): Seniority {
  const lower = title.toLowerCase();

  if (
    lower.includes("lead") ||
    lower.includes("principal") ||
    lower.includes("head")
  ) {
    return "lead";
  }

  if (
    lower.includes("senior") ||
    lower.includes("sr.")
  ) {
    return "senior";
  }

  if (
    lower.includes("junior") ||
    lower.includes("jr.") ||
    lower.includes("intern") ||
    lower.includes("graduate")
  ) {
    return "junior";
  }

  return "unknown";
}

function detectFromDescription(text: string): Seniority {
  const lower = text.toLowerCase();

  if (lower.includes("senior")) return "senior";
  if (lower.includes("junior")) return "junior";

  return "unknown";
}

export function detectSeniority(title: string, text: string): Seniority {
  // 1️⃣ PRIORITÀ: titolo
  const titleResult = detectFromTitle(title);
  if (titleResult !== "unknown") return titleResult;

  // 2️⃣ fallback leggero su description
  const descResult = detectFromDescription(text);
  if (descResult !== "unknown") return descResult;

  // 3️⃣ fallback logico
  if (
    title.toLowerCase().includes("engineer") ||
    title.toLowerCase().includes("technician") ||
    title.toLowerCase().includes("specialist")
  ) {
    return "mid";
  }

  return "unknown";
}