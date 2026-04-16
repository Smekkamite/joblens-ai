export function detectExperience(text: string): string {
  const lower = text.toLowerCase();

  const patterns: RegExp[] = [
    /\b(?:at least|min(?:imum)?\.?)\s*(\d+)\+?\s*years?\s+of\s+experience\b/g,
    /\b(\d+)\+?\s*years?\s+of\s+experience\b/g,
    /\b(\d+)\+?\s*years?\s+experience\b/g,
    /\bminimum\s+of\s+(\d+)\+?\s*years?\b/g,
    /\brequires?\s+(\d+)\+?\s*years?\b/g,
    /\b(\d+)\+?\s*years?\s+in\b/g,
  ];

  const matches: number[] = [];

  for (const regex of patterns) {
    for (const match of lower.matchAll(regex)) {
      const years = parseInt(match[1], 10);
      if (!Number.isNaN(years)) {
        matches.push(years);
      }
    }
  }

  if (matches.length === 0) {
    return "unknown";
  }

  const maxYears = Math.max(...matches);

  // safety cap contro robe assurde tipo 100 years of company history
  if (maxYears > 40) {
    return "unknown";
  }

  return `${maxYears}+ years`;
}