/// <reference types="chrome" />
import { extractLinkedInJob } from "./linkedin/linkedinExtractor";

console.log("[JobLens] content script loaded");

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
      max-height: 85vh;
      overflow-y: auto;
    }

    #${ROOT_ID} .joblens-card::-webkit-scrollbar {
      width: 6px;
    }

    #${ROOT_ID} .joblens-card::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
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
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function injectPanel() {
  if (document.getElementById(ROOT_ID)) return;

  injectStyles();

  const root = document.createElement("div");
  root.id = ROOT_ID;
  document.body.appendChild(root);

  root.innerHTML = `
    <div class="joblens-card">
      <div class="joblens-header">
        <h1>JobLens AI</h1>
        <span class="joblens-badge">LLM</span>
      </div>

      <div class="joblens-section">
        <p class="joblens-label">Status</p>
        <p class="joblens-value">Waiting for job selection...</p>
      </div>
    </div>
  `;

  let lastSignature = "";

  async function render() {
    try {
      const job = extractLinkedInJob();
      console.log("[JobLens] extractLinkedInJob result:", job);

      if (!job) {
        console.log("[JobLens] No job found yet, keeping previous UI");
        return;
      }

      const combinedText = `
${job?.title || ""}
${job?.company || ""}
${job?.location || ""}
${job?.description || ""}
`.trim();

      console.log("[JobLens] combinedText length:", combinedText.length);

      if (!combinedText) return;

      const signature = combinedText.slice(0, 500);
      if (signature === lastSignature) {
        console.log("[JobLens] Same job, skipping re-render");
        return;
      }
      lastSignature = signature;

      root.innerHTML = `
        <div class="joblens-card">
          <div class="joblens-header">
            <h1>JobLens AI</h1>
            <span class="joblens-badge">LLM</span>
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Status</p>
            <p class="joblens-value">Analyzing...</p>
          </div>
        </div>
      `;

      const llmResult = await new Promise<any>((resolve) => {
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

      console.log("[JobLens] LLM RESULT:", llmResult);

      const llmRole = llmResult?.role || job.title || "N/A";
      const llmRemote = llmResult?.remote || "N/A";
      const llmExperience = llmResult?.experience_years || "N/A";
      const llmSalary = llmResult?.salary || "N/A";
      const llmTechStack =
        llmResult?.tech_stack && llmResult.tech_stack.length > 0
          ? llmResult.tech_stack.join(" • ")
          : "N/A";
      const llmVerdict = llmResult?.verdict || "N/A";
      const llmRedFlags =
        llmResult?.red_flags && llmResult.red_flags.length > 0
          ? llmResult.red_flags.join(" • ")
          : "None";

      root.innerHTML = `
        <div class="joblens-card">
          <div class="joblens-header">
            <h1>JobLens AI</h1>
            <span class="joblens-badge">LLM</span>
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
            <p class="joblens-label">Role</p>
            <p class="joblens-value">${escapeHtml(llmRole)}</p>
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Work Mode</p>
            <p class="joblens-value">${escapeHtml(llmRemote)}</p>
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Experience</p>
            <p class="joblens-value">${escapeHtml(llmExperience)}</p>
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Salary</p>
            <p class="joblens-value">${escapeHtml(llmSalary)}</p>
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Tech Stack</p>
            <p class="joblens-value">${escapeHtml(llmTechStack)}</p>
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Verdict</p>
            <p class="joblens-value">${escapeHtml(llmVerdict)}</p>
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Red Flags</p>
            <p class="joblens-value">${escapeHtml(llmRedFlags)}</p>
          </div>
        </div>
      `;
    } catch (error) {
      console.error("[JobLens] render error:", error);
    }
  }

  void render();

  let renderTimeout: number | undefined;

  document.addEventListener("click", () => {
    window.clearTimeout(renderTimeout);
    renderTimeout = window.setTimeout(() => {
      void render();
    }, 700);
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