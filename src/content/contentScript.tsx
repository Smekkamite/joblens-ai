import { extractLinkedInJob } from "./linkedin/linkedinExtractor";
import { detectSeniority } from "../core/parser/detectSeniority";
import { detectExperience } from "../core/parser/detectExperience";
import { detectRedFlags } from "../core/parser/detectRedFlags";
import { analyzeWorkMode } from "../core/parser/analyzeWorkMode";
import { detectExperienceFocus } from "../core/parser/detectExperienceFocus";
import { detectSkills } from "../core/parser/detectSkills";
import { detectLanguages } from "../core/parser/detectLanguages";
import { detectEmploymentType } from "../core/parser/detectEmploymentType";

const ROOT_ID = "joblens-ai-extension-root";
const STYLE_ID = "joblens-ai-extension-style";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID} {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      width: 360px;
      font-family: Arial, Helvetica, sans-serif;
    }

    #${ROOT_ID} .joblens-card {
      background: #0f172a;
      color: #e5e7eb;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
    }

    #${ROOT_ID} .joblens-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    #${ROOT_ID} .joblens-header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
    }

    #${ROOT_ID} .joblens-badge {
      font-size: 12px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 999px;
      background: #1d4ed8;
      color: white;
    }

    #${ROOT_ID} .joblens-section {
      margin-top: 12px;
      padding: 12px;
      border-radius: 12px;
      background: #111827;
      border: 1px solid #1f2937;
    }

    #${ROOT_ID} .joblens-label {
      margin: 0 0 6px 0;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #93c5fd;
    }

    #${ROOT_ID} .joblens-value {
      margin: 0;
      font-size: 14px;
      line-height: 1.45;
      color: #e5e7eb;
      white-space: pre-wrap;
      word-break: break-word;
    }
  `;

  document.head.appendChild(style);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function injectPanel() {
  if (document.getElementById(ROOT_ID)) {
    return;
  }

  injectStyles();

  const root = document.createElement("div");
  root.id = ROOT_ID;
  document.body.appendChild(root);

  function render() {
    const job = extractLinkedInJob();
    const combinedText = `
  ${job?.title || ""}
  ${job?.company || ""}
  ${job?.location || ""}
  ${job?.description || ""}
`;

const workAnalysis = job
  ? analyzeWorkMode(combinedText)
  : { mode: "unknown", label: "unknown" };

const workMode = workAnalysis.mode;
const workModeLabel = workAnalysis.label;

const seniority = job
  ? detectSeniority(job.title || "", combinedText)
  : "unknown";

const employmentType = job ? detectEmploymentType(combinedText) : "unknown";
const experience = job ? detectExperience(combinedText) : "unknown";
const experienceFocus = job
  ? detectExperienceFocus(combinedText)
  : [];
const redFlags = job
  ? detectRedFlags(combinedText, workMode, experience)
  : [];

const skills = job ? detectSkills(combinedText) : [];
const languages = job ? detectLanguages(combinedText) : [];

    console.log("[JobLens DEBUG]", {
      url: window.location.href,
      jobResult: job,
    });

    if (!job) {
      root.innerHTML = `
        <div class="joblens-card">
          <div class="joblens-header">
            <h1>JobLens AI</h1>
            <span class="joblens-badge">MVP</span>
          </div>

          <div class="joblens-section">
  <p class="joblens-label">Employment Type</p>
  <p class="joblens-value">${employmentType}</p>
</div>
        </div>
      `;
      return;
    }

    root.innerHTML = `
  <div class="joblens-card">
    <div class="joblens-header">
      <h1>JobLens AI</h1>
      <span class="joblens-badge">LIVE</span>
    </div>

    <div class="joblens-section">
      <p class="joblens-label">Title</p>
      <p class="joblens-value">${escapeHtml(job.title || "N/A")}</p>
    </div>

    <div class="joblens-section">
      <p class="joblens-label">Company</p>
      <p class="joblens-value">${escapeHtml(job.company || "N/A")}</p>
    </div>

    <div class="joblens-section">
      <p class="joblens-label">Location</p>
      <p class="joblens-value">${escapeHtml(job.location || "N/A")}</p>
    </div>

    <div class="joblens-section">
  <p class="joblens-label">Work Mode</p>
  <p class="joblens-value">${workModeLabel}</p>
</div>

    <div class="joblens-section">
      <p class="joblens-label">Seniority</p>
      <p class="joblens-value">${seniority}</p>
    </div>

    <div class="joblens-section">
      <p class="joblens-label">Experience</p>
      <p class="joblens-value">
  ${
    experienceFocus.length > 0
      ? `${experience} • ${experienceFocus.join(" • ")}`
      : experience
  }
</p>
    </div>

    <div class="joblens-section">
  <p class="joblens-label">Skills</p>
  <p class="joblens-value">
    ${skills.length > 0 ? skills.join(" • ") : "None"}
  </p>
</div>
<div class="joblens-section">
  <p class="joblens-label">Languages</p>
  <p class="joblens-value">
    ${languages.length > 0 ? languages.join(" • ") : "None"}
  </p>
</div>

  <div class="joblens-section">
  <p class="joblens-label">Fit Constraints</p>
  <p class="joblens-value">
  ${redFlags.length > 0
    ? redFlags.join(" • ")
    : "None"}
</p>
</div>

</div>
`;
  }

  render();

  let renderTimeout: number | undefined;

  const observer = new MutationObserver(() => {
    window.clearTimeout(renderTimeout);
    renderTimeout = window.setTimeout(() => {
      render();
    }, 250);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function init() {
  if (document.readyState === "loading") {
    window.addEventListener(
      "DOMContentLoaded",
      () => {
        injectPanel();
      },
      { once: true }
    );
    return;
  }

  injectPanel();
}

init();