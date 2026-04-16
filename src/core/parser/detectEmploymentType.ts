export function detectEmploymentType(text: string): string {
  const lower = text.toLowerCase();

  if (
    lower.includes("full-time") ||
    lower.includes("full time")
  ) {
    return "full-time";
  }

  if (
    lower.includes("part-time") ||
    lower.includes("part time")
  ) {
    return "part-time";
  }

  if (
    lower.includes("contract") ||
    lower.includes("contractor")
  ) {
    return "contract";
  }

  if (
    lower.includes("freelance")
  ) {
    return "freelance";
  }

  if (
    lower.includes("internship") ||
    lower.includes("intern")
  ) {
    return "internship";
  }

  if (
    lower.includes("temporary") ||
    lower.includes("temp role")
  ) {
    return "temporary";
  }

  return "unknown";
}