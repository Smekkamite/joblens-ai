export function detectLanguages(text: string): string[] {
  const lower = text.toLowerCase();
  const languages: string[] = [];

  const languageMap: Array<{ label: string; patterns: string[] }> = [
    {
      label: "English",
      patterns: [
        "english",
        "fluent english",
        "professional english",
        "written and spoken english",
      ],
    },
    {
      label: "Italian",
      patterns: [
        "italian",
        "fluent italian",
        "written and spoken italian",
      ],
    },
    {
      label: "Spanish",
      patterns: [
        "spanish",
        "fluent spanish",
        "written and spoken spanish",
      ],
    },
    {
      label: "French",
      patterns: [
        "french",
        "fluent french",
        "written and spoken french",
      ],
    },
    {
      label: "German",
      patterns: [
        "german",
        "fluent german",
        "written and spoken german",
      ],
    },
    {
      label: "Dutch",
      patterns: [
        "dutch",
        "fluent dutch",
        "written and spoken dutch",
      ],
    },
    {
      label: "Portuguese",
      patterns: [
        "portuguese",
        "fluent portuguese",
        "written and spoken portuguese",
      ],
    },
  ];

  for (const lang of languageMap) {
    const found = lang.patterns.some((pattern) => lower.includes(pattern));
    if (found) {
      languages.push(lang.label);
    }
  }

  return [...new Set(languages)].slice(0, 4);
}