const USER_PROFILE = {
  maxYears: 5,
};

export function detectRedFlags(
  text: string,
  workMode: string,
  experience: string
): string[] {
  const flags: string[] = [];
  const lower = text.toLowerCase();

  // ❌ ON-SITE
  if (workMode === "onsite") {
    flags.push("On-site only");
  }

  // ❌ EXPERIENCE TOO HIGH
  if (experience !== "unknown") {
    const match = experience.match(/(\d+)/);
    if (match) {
      const years = parseInt(match[1], 10);

      if (years > USER_PROFILE.maxYears) {
        flags.push(`${years}+ years`);
      }
    }
  }

  // ⚠️ RELOCATION
  if (
    lower.includes("relocation") ||
    lower.includes("must relocate")
  ) {
    flags.push("Relocation");
  }

  // ⚠️ NO SALARY
  if (
    !lower.includes("salary") &&
    !lower.includes("€") &&
    !lower.includes("$")
  ) {
    flags.push("No salary");
  }

  // ⚠️ PRESSURE
  if (
    lower.includes("fast-paced") ||
    lower.includes("high pressure") ||
    lower.includes("tight deadlines")
  ) {
    flags.push("High pressure");
  }

  return [...new Set(flags)];
}