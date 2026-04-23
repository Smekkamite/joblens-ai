/// <reference types="chrome" />
import { extractLinkedInJob } from "./linkedin/linkedinExtractor";

console.log("[JobLens] compact content script loaded");

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
      padding: 14px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
      max-height: 85vh;
      overflow-y: auto;
    }

    #${ROOT_ID} .joblens-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    #${ROOT_ID} .joblens-title {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    #${ROOT_ID} .joblens-title h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: white;
    }

    #${ROOT_ID} .joblens-badge {
      font-size: 12px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 999px;
      background: #1d4ed8;
      color: white;
    }

    #${ROOT_ID} .joblens-btn {
      font-size: 12px;
      font-weight: 700;
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid #334155;
      background: #111827;
      color: #e5e7eb;
      cursor: pointer;
    }

    #${ROOT_ID} .joblens-btn:hover {
      background: #172033;
    }

    #${ROOT_ID} .joblens-main {
      border: 1px solid #1f2937;
      border-radius: 14px;
      padding: 14px;
      background: #111827;
    }

    #${ROOT_ID} .joblens-rec-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    #${ROOT_ID} .joblens-rec {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      margin: 0;
    }

    #${ROOT_ID} .joblens-apply {
      color: #4ade80;
    }

    #${ROOT_ID} .joblens-borderline {
      color: #facc15;
    }

    #${ROOT_ID} .joblens-skip {
      color: #f87171;
    }

    #${ROOT_ID} .joblens-confidence {
      font-size: 12px;
      color: #cbd5e1;
      white-space: nowrap;
    }

    #${ROOT_ID} .joblens-mini-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 10px;
    }

    #${ROOT_ID} .joblens-mini {
      background: #0b1220;
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 10px;
    }

    #${ROOT_ID} .joblens-label {
      margin: 0 0 4px 0;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #93c5fd;
    }

    #${ROOT_ID} .joblens-value {
      margin: 0;
      font-size: 14px;
      line-height: 1.4;
      color: #e5e7eb;
      white-space: pre-wrap;
      word-break: break-word;
    }

    #${ROOT_ID} .joblens-reason {
      margin-top: 10px;
      padding: 10px;
      border-radius: 10px;
      background: #0b1220;
      border: 1px solid #1e293b;
    }

    #${ROOT_ID} .joblens-details {
      display: none;
      margin-top: 12px;
      border: 1px solid #1f2937;
      border-radius: 14px;
      padding: 12px;
      background: #111827;
    }

    #${ROOT_ID} .joblens-details.open {
      display: block;
    }

    #${ROOT_ID} .joblens-list {
      margin: 6px 0 0 0;
      padding-left: 18px;
    }

    #${ROOT_ID} .joblens-list li {
      margin: 4px 0;
      font-size: 13px;
      line-height: 1.4;
    }

    #${ROOT_ID} .joblens-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }

    #${ROOT_ID} .joblens-pill {
      font-size: 12px;
      padding: 5px 8px;
      border-radius: 999px;
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid #334155;
    }

    #${ROOT_ID} .joblens-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    #${ROOT_ID} .joblens-settings {
      display: none;
      margin-top: 12px;
      border: 1px solid #1f2937;
      border-radius: 14px;
      padding: 12px;
      background: #111827;
    }

    #${ROOT_ID} .joblens-settings.open {
      display: block;
    }

    #${ROOT_ID} .joblens-help {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
      line-height: 1.35;
    }
  `;

  document.head.appendChild(style);
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function pickMainReason(data: any): string {
  const notFit = data?.why_not_fit || [];
  const fit = data?.why_fit || [];

  if (notFit.length > 0) {
    return notFit[0];
  }

  if (fit.length > 0) {
    return fit[0];
  }

  return "No strong signal detected";
}

function pickMainRedFlag(data: any): string {
  const flags = data?.red_flags || [];

  const priority = [
    "Onsite role",
    "Hybrid role",
    "5+ years required",
    "3+ years required",
    "On-call or shift work",
    "Travel required",
  ];

  for (const p of priority) {
    const found = flags.find((f: string) =>
      f.toLowerCase().includes(p.toLowerCase())
    );
    if (found) return found;
  }

  return flags[0] || "None";
}

function renderList(items: string[]) {
  if (!items || items.length === 0) {
    return `<p class="joblens-value">None</p>`;
  }

  return `
    <ul class="joblens-list">
      ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderPills(items: string[]) {
  if (!items || items.length === 0) {
    return `<p class="joblens-value">N/A</p>`;
  }

  return `
    <div class="joblens-pills">
      ${items.map((item) => `<span class="joblens-pill">${escapeHtml(item)}</span>`).join("")}
    </div>
  `;
}

function injectPanel() {
  if (document.getElementById(ROOT_ID)) return;

  injectStyles();

  const root = document.createElement("div");
  root.id = ROOT_ID;
  document.body.appendChild(root);

  let lastSignature = "";
  let activeRenderId = 0;

  function bindUi() {
    const detailsBtn = root.querySelector("#joblens-details-toggle") as HTMLButtonElement | null;
    const detailsPanel = root.querySelector("#joblens-details") as HTMLDivElement | null;
    const settingsBtn = root.querySelector("#joblens-settings-toggle") as HTMLButtonElement | null;
    const settingsPanel = root.querySelector("#joblens-settings") as HTMLDivElement | null;

    if (detailsBtn && detailsPanel) {
      detailsBtn.onclick = () => detailsPanel.classList.toggle("open");
    }

    if (settingsBtn && settingsPanel) {
      settingsBtn.onclick = () => settingsPanel.classList.toggle("open");
    }
  }

  async function render() {
    try {
      const job = extractLinkedInJob();
      if (!job) return;

      const combinedText = `
${job.title || ""}
${job.company || ""}
${job.location || ""}
${(job.metadata || []).join(" | ")}
${job.description || ""}
`.trim();

      if (!combinedText) return;

      const signature = [
        job.title || "",
        job.company || "",
        job.location || "",
        (job.metadata || []).join("|"),
        (job.description || "").slice(0, 1200),
      ].join(" || ");

      if (signature === lastSignature) return;
      lastSignature = signature;

      const renderId = ++activeRenderId;

      root.innerHTML = `
        <div class="joblens-card">
          <div class="joblens-header">
            <div class="joblens-title">
              <h1>JobLens AI</h1>
              <span class="joblens-badge">LLM</span>
            </div>
          </div>

          <div class="joblens-main">
            <p class="joblens-value">Analyzing...</p>
          </div>
        </div>
      `;

      const result = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: "ANALYZE_JOB",
            jobText: combinedText,
          },
          (response: any) => {
            if (chrome.runtime.lastError) {
              console.error("[JobLens] runtime error:", chrome.runtime.lastError);
              resolve(null);
              return;
            }

            if (!response?.ok) {
              console.error("[JobLens] background analyze failed:", response?.error);
              resolve(null);
              return;
            }

            resolve(response.data);
          }
        );
      });

      if (renderId !== activeRenderId) return;

      if (!result) {
        root.innerHTML = `
          <div class="joblens-card">
            <div class="joblens-header">
              <div class="joblens-title">
                <h1>JobLens AI</h1>
                <span class="joblens-badge">LLM</span>
              </div>
            </div>

            <div class="joblens-main">
              <p class="joblens-value">Analysis failed</p>
            </div>
          </div>
        `;
        return;
      }

      const recommendation = result.apply_recommendation || "borderline";
      const recommendationClass =
        recommendation === "apply"
          ? "joblens-apply"
          : recommendation === "skip"
          ? "joblens-skip"
          : "joblens-borderline";

      const mainReason = pickMainReason(result);
      const mainFlag = pickMainRedFlag(result);
      const salary = result.salary || "N/A";
      let workMode = result.work_mode || "unknown";

if (workMode === "unknown") {
  const text = combinedText.toLowerCase();

  if (text.includes("remote")) workMode = "remote";
  else if (text.includes("hybrid") || text.includes("ibrido")) workMode = "hybrid";
  else if (text.includes("onsite") || text.includes("presenza")) workMode = "onsite";
}

      root.innerHTML = `
        <div class="joblens-card">
          <div class="joblens-header">
            <div class="joblens-title">
              <h1>JobLens AI</h1>
              <span class="joblens-badge">LLM</span>
            </div>
          </div>

          <div class="joblens-main">
            <div class="joblens-rec-row">
              <p class="joblens-rec ${recommendationClass}">${escapeHtml(recommendation)}</p>
              <span class="joblens-confidence">Confidence: ${escapeHtml(String(result.confidence ?? 0))}%</span>
            </div>

            <div class="joblens-mini-grid">
              <div class="joblens-mini">
                <p class="joblens-label">Salary</p>
                <p class="joblens-value">${escapeHtml(salary)}</p>
              </div>
              <div class="joblens-mini">
                <p class="joblens-label">Work Type</p>
                <p class="joblens-value">${escapeHtml(workMode)}</p>
              </div>
            </div>

            <div class="joblens-reason">
              <p class="joblens-label">Why</p>
              <p class="joblens-value">${escapeHtml(mainReason)}</p>
            </div>

            <div class="joblens-reason">
              <p class="joblens-label">Main Flag</p>
              <p class="joblens-value">${escapeHtml(mainFlag)}</p>
            </div>

            <div class="joblens-actions">
              <button class="joblens-btn" id="joblens-details-toggle">Details</button>
              <button class="joblens-btn" id="joblens-settings-toggle">Settings</button>
            </div>
          </div>

          <div class="joblens-details" id="joblens-details">
            <div class="joblens-mini-grid">
              <div class="joblens-mini">
                <p class="joblens-label">Role</p>
                <p class="joblens-value">${escapeHtml(result.normalized_role || job.title || "N/A")}</p>
              </div>
              <div class="joblens-mini">
                <p class="joblens-label">Experience</p>
                <p class="joblens-value">${escapeHtml(result.experience_required || "N/A")}</p>
              </div>
            </div>

            <div class="joblens-reason">
              <p class="joblens-label">Why Fit</p>
              ${renderList(result.why_fit || [])}
            </div>

            <div class="joblens-reason">
              <p class="joblens-label">Why Not Fit</p>
              ${renderList(result.why_not_fit || [])}
            </div>

            <div class="joblens-reason">
              <p class="joblens-label">Red Flags</p>
              ${renderList(result.red_flags || [])}
            </div>

            <div class="joblens-reason">
              <p class="joblens-label">Tech Stack</p>
              ${renderPills(result.tech_stack || [])}
            </div>
          </div>

          <div class="joblens-settings" id="joblens-settings">
            <p class="joblens-label">Temporary Note</p>
            <p class="joblens-value">We keep the compact UI first. Settings cleanup comes next.</p>
          </div>
        </div>
      `;

      bindUi();
    } catch (error) {
      console.error("[JobLens] render error:", error);
    }
  }

  void render();

  let renderTimeout: number | undefined;

  const scheduleRender = () => {
    window.clearTimeout(renderTimeout);
    renderTimeout = window.setTimeout(() => {
      void render();
    }, 700);
  };

  document.addEventListener("click", scheduleRender);
  window.addEventListener("popstate", scheduleRender);

  const observer = new MutationObserver(() => {
    scheduleRender();
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