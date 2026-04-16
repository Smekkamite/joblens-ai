export function detectExperienceFocus(text: string): string[] {
  const lower = text.toLowerCase();

  const tags: string[] = [];

  // DOMAIN
  if (lower.includes("devops")) tags.push("DevOps");
  if (lower.includes("cloud")) tags.push("Cloud");
  if (lower.includes("azure")) tags.push("Azure");
  if (lower.includes("aws")) tags.push("AWS");
  if (lower.includes("kubernetes") || lower.includes("aks"))
    tags.push("Kubernetes");

  // TECH / INFRA
  if (lower.includes("infrastructure")) tags.push("Infrastructure");
  if (lower.includes("network")) tags.push("Networking");

  // MINDSET
  if (lower.includes("automation")) tags.push("Automation");

  // CAPABILITIES
  if (lower.includes("troubleshooting"))
    tags.push("Troubleshooting");
  if (lower.includes("problem solving"))
    tags.push("Problem Solving");

  // ENVIRONMENT
  if (
    lower.includes("distributed") ||
    lower.includes("structured environment")
  ) {
    tags.push("Distributed Systems");
  }

  // 👉 rimuovi duplicati + limita a max 4
  return [...new Set(tags)].slice(0, 4);
}