/// <reference types="chrome" />

// @ts-ignore
import { buildPrompt } from "../core/prompt.js";
// @ts-ignore
import { getJobLensSettings } from "../core/settingsStorage";

chrome.runtime.onMessage.addListener(
  (
    message: any,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    if (message?.type !== "ANALYZE_JOB") return;

    const jobText = String(message.jobText || "");

    const run = async () => {
      try {
        const prompt = buildPrompt(jobText);

        const res = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            model: "llama3.1:8b",
            prompt,
            stream: false,
            options: {
              temperature: 0,
            },
          }),
        });

        console.log("[JobLens Background] status:", res.status, res.statusText);
        console.log("[JobLens Background] ok:", res.ok);
        console.log(
          "[JobLens Background] content-type:",
          res.headers.get("content-type")
        );

        const rawText = await res.text();
        console.log("[JobLens Background] raw HTTP body:", rawText);

        if (!res.ok) {
          sendResponse({
            ok: false,
            error: `HTTP ${res.status} ${res.statusText}`,
            raw: rawText,
          });
          return;
        }

        if (!rawText.trim()) {
          sendResponse({
            ok: false,
            error: "Empty HTTP response from Ollama",
          });
          return;
        }

        let data: any;
        try {
          data = JSON.parse(rawText);
        } catch {
          console.error(
            "[JobLens Background] HTTP body is not valid JSON:",
            rawText
          );
          sendResponse({
            ok: false,
            error: "Ollama returned invalid HTTP JSON",
            raw: rawText,
          });
          return;
        }

        const cleaned = String(data.response || "")
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        console.log("[JobLens Background] cleaned response:", cleaned);

        if (!cleaned) {
          sendResponse({
            ok: false,
            error: "Empty model response inside Ollama JSON",
          });
          return;
        }

        let parsed: any;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          console.error(
            "[JobLens Background] Model response is not valid JSON:",
            cleaned
          );
          sendResponse({
            ok: false,
            error: "Invalid JSON returned by model",
            raw: cleaned,
          });
          return;
        }

        const extracted = normalizeAnalysis(parsed);
        const settings = await getJobLensSettings();
        const enriched = enrichAnalysis(extracted, settings);

        sendResponse({ ok: true, data: enriched });
      } catch (error) {
        console.error("[JobLens Background] analyze error:", error);
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    void run();
    return true;
  }
);

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEnum(
  value: unknown,
  allowed: string[],
  fallback: string
): string {
  const normalized = normalizeString(value).toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function normalizeBool(value: unknown): boolean {
  return value === true;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeConfidence(value: unknown): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : 0;

  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

function normalizeExperience(value: string): string {
  const v = value.trim();
  if (!v) return "";
  return v.replace(/\s+/g, " ").trim();
}

function normalizeAnalysis(parsed: any) {
  return {
    normalized_role: normalizeString(parsed?.normalized_role),
    work_mode: normalizeEnum(
      parsed?.work_mode,
      ["remote", "hybrid", "onsite", "unknown"],
      "unknown"
    ),
    seniority: normalizeEnum(
      parsed?.seniority,
      ["junior", "mid", "senior", "unknown"],
      "unknown"
    ),
    experience_required: normalizeExperience(
      normalizeString(parsed?.experience_required)
    ),
    salary: normalizeString(parsed?.salary),
    travel_required: normalizeBool(parsed?.travel_required),
    on_call: normalizeBool(parsed?.on_call),
    languages_required: dedupe(normalizeStringArray(parsed?.languages_required)),
    must_have: dedupe(normalizeStringArray(parsed?.must_have)),
    nice_to_have: dedupe(normalizeStringArray(parsed?.nice_to_have)),
    tech_stack: dedupe(normalizeStringArray(parsed?.tech_stack)),
    raw_risks: dedupe(normalizeStringArray(parsed?.raw_risks)).slice(0, 8),
    confidence: normalizeConfidence(parsed?.confidence),
  };
}

function parseYears(exp: string): number {
  if (!exp) return 0;
  const match = exp.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function hasAny(texts: string[], keywords: string[]): boolean {
  const joined = texts.join(" ").toLowerCase();
  return keywords.some((k) => joined.includes(k.toLowerCase()));
}

function enrichAnalysis(data: any, settings: any) {
  const why_fit: string[] = [];
  const why_not_fit: string[] = [];
  const red_flags: string[] = [...data.raw_risks];

  const years = parseYears(data.experience_required);
  const must = data.must_have as string[];
  const nice = data.nice_to_have as string[];
  const tech = data.tech_stack as string[];

  const preferredRoles = (settings?.preferredRoles || []).map((x: string) =>
  x.toLowerCase()
);
const preferredTechnologies = (settings?.preferredTechnologies || []).map((x: string) =>
  x.toLowerCase()
);
const requiredLanguages = (settings?.requiredLanguages || []).map((x: string) =>
  x.toLowerCase()
);

const normalizedRole = String(data.normalized_role || "").toLowerCase();
const techLower = tech.map((x: string) => x.toLowerCase());
const languagesLower = (data.languages_required || []).map((x: string) =>
  String(x).toLowerCase()
);

  let experience = data.experience_required;
  if (!experience) {
    if (data.seniority === "junior") experience = "0-2 years";
    else if (data.seniority === "mid") experience = "2-5 years";
    else if (data.seniority === "senior") experience = "5+ years";
    else experience = "N/A";
  }

  if (data.work_mode === "remote") {
    why_fit.push("Remote role");
  } else if (data.work_mode === "hybrid") {
    red_flags.push("Hybrid role");
    why_not_fit.push("Hybrid work arrangement");
  } else if (data.work_mode === "onsite") {
    red_flags.push("Onsite role");
    why_not_fit.push("Onsite presence required");
  }

  if (settings?.remoteOnly && data.work_mode !== "remote") {
  red_flags.push("Does not match remote-only preference");
  why_not_fit.push("Does not match remote-only preference");
}

if (!settings?.allowHybrid && data.work_mode === "hybrid") {
  red_flags.push("Hybrid not allowed by your settings");
  why_not_fit.push("Hybrid not allowed by your settings");
}

if (!settings?.allowOnsite && data.work_mode === "onsite") {
  red_flags.push("Onsite not allowed by your settings");
  why_not_fit.push("Onsite not allowed by your settings");
}

  if (data.travel_required) {
    red_flags.push("Travel required");
    why_not_fit.push("Travel required");
  }
  
if (settings?.avoidTravel && data.travel_required) {
  red_flags.push("Travel conflicts with your settings");
  why_not_fit.push("Travel conflicts with your settings");
}

  if (data.on_call) {
    red_flags.push("On-call or shift work");
    why_not_fit.push("On-call or shift work");
  }

if (settings?.avoidOnCall && data.on_call) {
  red_flags.push("On-call conflicts with your settings");
  why_not_fit.push("On-call conflicts with your settings");
}

  if (years >= 3) {
    red_flags.push(`${years}+ years required`);
    why_not_fit.push(`${years}+ years of experience required`);
  } else if (years > 0 && years <= 2) {
    why_fit.push(`Experience requirement is manageable (${data.experience_required})`);
  }

if (
  typeof settings?.maxYearsRequired === "number" &&
  settings.maxYearsRequired > 0 &&
  years > settings.maxYearsRequired
) {
  red_flags.push(`Exceeds your max experience preference (${settings.maxYearsRequired})`);
  why_not_fit.push(`Exceeds your max experience preference (${settings.maxYearsRequired})`);
}

  if (data.seniority === "junior") {
    why_fit.push("Explicitly junior / entry-level");
  } else if (data.seniority === "mid") {
    if (years >= 3) {
      why_not_fit.push("Role appears mid-level");
    }
  } else if (data.seniority === "senior") {
    red_flags.push("Senior role");
    why_not_fit.push("Role appears senior-level");
  }

  if (data.salary) {
    why_fit.push("Salary is explicitly stated");
  } else {
    red_flags.push("No salary provided");
  }

  if (
    hasAny(must, [
      "saas",
      "proven saas",
      "client-facing technical",
      "technical project delivery",
      "trusted technical advisor",
      "solution design",
      "integrations",
      "stakeholder",
      "ownership",
    ])
  ) {
    red_flags.push("High ownership / client-facing technical scope");
    why_not_fit.push("Strong client-facing technical ownership expected");
  }

  if (
    hasAny(must, [
      "troubleshooting",
      "technical support",
      "customer support",
      "incident",
      "support",
    ])
  ) {
    why_fit.push("Support / troubleshooting overlap");
  }

  if (
    hasAny(must.concat(nice), [
      "english",
      "italian",
      "french",
      "spanish",
      "communication",
    ])
  ) {
    why_fit.push("Communication skills matter");
  }

  if (
    hasAny(tech, [
      "azure",
      "aws",
      "linux",
      "windows server",
      "sql",
      "powershell",
      "bash",
      "networking",
      "apis",
    ])
  ) {
    why_fit.push("Relevant infrastructure / technical overlap");
  }

if (
  preferredRoles.length > 0 &&
  preferredRoles.some((role: string) => normalizedRole.includes(role))
) {
  why_fit.push("Matches your preferred role direction");
}

if (
  preferredTechnologies.length > 0 &&
  preferredTechnologies.some((pref: string) =>
    techLower.some((item: string) => item.includes(pref))
  )
) {
  why_fit.push("Matches your preferred technology stack");
}

if (
  requiredLanguages.length > 0 &&
  languagesLower.length > 0 &&
  requiredLanguages.every((lang: string) => languagesLower.includes(lang))
) {
  why_fit.push("Matches your language preferences");
}

  if (data.seniority === "mid" || data.seniority === "senior") {
    why_not_fit.push("Experience level higher than entry");
  }

  if (must.length > 5) {
    why_not_fit.push("High requirement density");
  }

  if (
    data.must_have?.some((x: string) => {
      const lower = x.toLowerCase();
      return (
        lower.includes("kubernetes") ||
        lower.includes("aws") ||
        lower.includes("azure")
      );
    })
  ) {
    why_not_fit.push("Strong cloud experience expected");
  }

  let apply_recommendation: "apply" | "borderline" | "skip" = "borderline";

  const strongBlockers = red_flags.filter((x) =>
    [
      "Onsite role",
      "Travel required",
      "Senior role",
      "High ownership / client-facing technical scope",
    ].includes(x)
  ).length;

   const personalBlockers = red_flags.filter((x) =>
    [
      "Does not match remote-only preference",
      "Hybrid not allowed by your settings",
      "Onsite not allowed by your settings",
      "Travel conflicts with your settings",
      "On-call conflicts with your settings",
    ].includes(x)
  ).length;

    const hardGapSignals =
    (data.seniority === "mid" ? 1 : 0) +
    (years > (settings?.maxYearsRequired ?? 2) ? 1 : 0) +
    (hasAny(tech, ["kubernetes", "aks", "azure devops", "ci/cd"]) ? 1 : 0) +
    (data.work_mode === "hybrid" ? 1 : 0) +
    (data.work_mode === "onsite" ? 2 : 0);

  if (
    data.seniority === "senior" ||
    years >= 4 ||
    strongBlockers >= 2 ||
    personalBlockers >= 1 ||
    hardGapSignals >= 4
  ) {
    apply_recommendation = "skip";
  } else if (
    why_fit.length >= 3 &&
    years > 0 &&
    years <= (settings?.maxYearsRequired ?? 2) &&
    strongBlockers === 0 &&
    personalBlockers === 0 &&
    hardGapSignals <= 1 &&
    (data.work_mode === "remote" || data.work_mode === "unknown")
  ) {
    apply_recommendation = "apply";
  } else {
    apply_recommendation = "borderline";
  }

  return {
    ...data,
    experience_required: experience,
    why_fit: dedupe(why_fit).slice(0, 4),
    why_not_fit: dedupe(why_not_fit).slice(0, 4),
    red_flags: dedupe(red_flags).slice(0, 6),
    apply_recommendation,
  };
}