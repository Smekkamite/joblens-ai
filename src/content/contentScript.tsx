/// <reference types="chrome" />
import { extractLinkedInJob } from "./linkedin/linkedinExtractor";

console.log("[JobLens] content script loaded");

const ROOT_ID = "joblens-ai-extension-root";
const STYLE_ID = "joblens-ai-extension-style";
const STORAGE_KEY = "joblens_settings";

type JobLensSettings = {
  profile: "custom" | "it_support" | "cloud_support" | "azure_infra" | "helpdesk";
  preferredRoles: string[];
  preferredTechnologies: string[];
  requiredLanguages: string[];
  remoteOnly: boolean;
  allowHybrid: boolean;
  allowOnsite: boolean;
  maxYearsRequired: number;
  avoidTravel: boolean;
  avoidOnCall: boolean;
  minimumSalary: string;
};

const defaultSettings: JobLensSettings = {
  profile: "cloud_support",
  preferredRoles: ["it support", "technical support", "cloud support", "azure", "helpdesk"],
  preferredTechnologies: [
    "azure",
    "microsoft 365",
    "active directory",
    "entra id",
    "networking",
    "powershell",
  ],
  requiredLanguages: ["english"],
  remoteOnly: false,
  allowHybrid: true,
  allowOnsite: false,
  maxYearsRequired: 2,
  avoidTravel: true,
  avoidOnCall: true,
  minimumSalary: "",
};

function getPresetSettings(
  profile: JobLensSettings["profile"]
): Partial<JobLensSettings> {
  switch (profile) {
    case "it_support":
      return {
        preferredRoles: ["it support", "technical support", "service desk", "desktop support"],
        preferredTechnologies: [
          "active directory",
          "microsoft 365",
          "windows",
          "servicenow",
          "networking",
        ],
        requiredLanguages: ["english"],
        remoteOnly: false,
        allowHybrid: true,
        allowOnsite: true,
        maxYearsRequired: 2,
        avoidTravel: true,
        avoidOnCall: true,
      };

    case "cloud_support":
      return {
        preferredRoles: ["cloud support", "technical support", "azure", "helpdesk", "it support"],
        preferredTechnologies: [
          "azure",
          "microsoft 365",
          "active directory",
          "entra id",
          "networking",
          "powershell",
        ],
        requiredLanguages: ["english"],
        remoteOnly: false,
        allowHybrid: true,
        allowOnsite: false,
        maxYearsRequired: 2,
        avoidTravel: true,
        avoidOnCall: true,
      };

    case "azure_infra":
      return {
        preferredRoles: ["azure", "cloud engineer", "infrastructure", "system administrator"],
        preferredTechnologies: [
          "azure",
          "terraform",
          "powershell",
          "entra id",
          "active directory",
          "networking",
        ],
        requiredLanguages: ["english"],
        remoteOnly: false,
        allowHybrid: true,
        allowOnsite: false,
        maxYearsRequired: 2,
        avoidTravel: true,
        avoidOnCall: true,
      };

    case "helpdesk":
      return {
        preferredRoles: ["helpdesk", "service desk", "it support", "technical support"],
        preferredTechnologies: [
          "windows",
          "microsoft 365",
          "active directory",
          "servicenow",
          "exchange",
        ],
        requiredLanguages: ["english"],
        remoteOnly: false,
        allowHybrid: true,
        allowOnsite: true,
        maxYearsRequired: 1,
        avoidTravel: true,
        avoidOnCall: true,
      };

    default:
      return {};
  }
}

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
      width: 390px;
      font-family: Arial, Helvetica, sans-serif;
    }

    #${ROOT_ID} .joblens-card {
      background: #0f172a;
      color: #e5e7eb;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
      max-height: 88vh;
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
      gap: 10px;
      margin-bottom: 12px;
    }

    #${ROOT_ID} .joblens-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
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

    #${ROOT_ID} .joblens-settings-btn,
    #${ROOT_ID} .joblens-save-btn {
      font-size: 12px;
      font-weight: 700;
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid #334155;
      background: #111827;
      color: #e5e7eb;
      cursor: pointer;
    }

    #${ROOT_ID} .joblens-settings-btn:hover,
    #${ROOT_ID} .joblens-save-btn:hover {
      background: #172033;
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

    #${ROOT_ID} .joblens-big-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    #${ROOT_ID} .joblens-recommendation {
      font-size: 20px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
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
    }

    #${ROOT_ID} .joblens-list {
      margin: 0;
      padding-left: 18px;
    }

    #${ROOT_ID} .joblens-list li {
      margin: 4px 0;
      font-size: 14px;
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
      padding: 6px 8px;
      border-radius: 999px;
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid #334155;
    }

    #${ROOT_ID} .joblens-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    #${ROOT_ID} .joblens-mini {
      padding: 10px;
      border-radius: 10px;
      background: #0b1220;
      border: 1px solid #1e293b;
    }

    #${ROOT_ID} .joblens-mini .joblens-label {
      margin-bottom: 4px;
      font-size: 11px;
    }

    #${ROOT_ID} .joblens-mini .joblens-value {
      font-size: 13px;
    }

    #${ROOT_ID} .joblens-settings-panel {
      display: none;
      margin-top: 12px;
      padding: 12px;
      border-radius: 12px;
      background: #111827;
      border: 1px solid #1f2937;
    }

    #${ROOT_ID} .joblens-settings-panel.open {
      display: block;
    }

    #${ROOT_ID} .joblens-form-group {
      margin-bottom: 12px;
    }

    #${ROOT_ID} .joblens-input,
    #${ROOT_ID} .joblens-number,
    #${ROOT_ID} .joblens-textarea,
    #${ROOT_ID} .joblens-select {
      width: 100%;
      box-sizing: border-box;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid #334155;
      background: #0b1220;
      color: #e5e7eb;
      outline: none;
    }

    #${ROOT_ID} .joblens-input::placeholder,
    #${ROOT_ID} .joblens-textarea::placeholder {
      color: #94a3b8;
    }

    #${ROOT_ID} .joblens-textarea {
      min-height: 72px;
      resize: vertical;
    }

    #${ROOT_ID} .joblens-select {
      appearance: none;
    }

    #${ROOT_ID} .joblens-checkbox-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 10px 0;
      font-size: 13px;
      color: #e5e7eb;
      cursor: pointer;
    }

    #${ROOT_ID} .joblens-checkbox-row input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #2563eb;
      cursor: pointer;
      flex: 0 0 auto;
    }

    #${ROOT_ID} .joblens-settings-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }

    #${ROOT_ID} .joblens-help {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
      line-height: 1.35;
    }

    #${ROOT_ID} .joblens-divider {
      height: 1px;
      background: #1f2937;
      margin: 12px 0;
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
      ${items
        .map((item) => `<span class="joblens-pill">${escapeHtml(item)}</span>`)
        .join("")}
    </div>
  `;
}

function parseCsvInput(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getStoredSettings(): Promise<JobLensSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      resolve({
        ...defaultSettings,
        ...(result?.[STORAGE_KEY] || {}),
      });
    });
  });
}

function saveStoredSettings(settings: JobLensSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: settings }, () => resolve());
  });
}

function getSettingsPanelHtml(): string {
  return `
    <div class="joblens-settings-panel" id="joblens-settings-panel">
      <div class="joblens-form-group">
        <p class="joblens-label">Profile</p>
        <select class="joblens-select" id="joblens-profile">
          <option value="cloud_support">Cloud Support</option>
          <option value="it_support">IT Support</option>
          <option value="azure_infra">Azure Infra</option>
          <option value="helpdesk">Helpdesk</option>
          <option value="custom">Custom</option>
        </select>
        <p class="joblens-help">Choose a preset profile or use Custom.</p>
      </div>

      <div class="joblens-form-group">
        <p class="joblens-label">Preferred Roles</p>
        <textarea class="joblens-textarea" id="joblens-preferred-roles" placeholder="it support, cloud support, azure, helpdesk"></textarea>
        <p class="joblens-help">Comma-separated keywords used to boost fit.</p>
      </div>

      <div class="joblens-form-group">
        <p class="joblens-label">Preferred Technologies</p>
        <textarea class="joblens-textarea" id="joblens-preferred-tech" placeholder="azure, microsoft 365, active directory, powershell"></textarea>
        <p class="joblens-help">Comma-separated technical keywords.</p>
      </div>

      <div class="joblens-form-group">
        <p class="joblens-label">Required Languages</p>
        <textarea class="joblens-textarea" id="joblens-required-languages" placeholder="english, italian"></textarea>
        <p class="joblens-help">Languages you want the role to support.</p>
      </div>

      <div class="joblens-form-group">
        <p class="joblens-label">Max Years Required</p>
        <input class="joblens-number" id="joblens-max-years" type="number" min="0" max="20" />
        <p class="joblens-help">Jobs requiring more than this become worse matches.</p>
      </div>

      <div class="joblens-form-group">
        <p class="joblens-label">Minimum Salary</p>
        <input class="joblens-input" id="joblens-min-salary" placeholder="Optional, e.g. 35000" />
        <p class="joblens-help">Currently informational. We can make it stricter later.</p>
      </div>

      <div class="joblens-divider"></div>

      <label class="joblens-checkbox-row">
        <input type="checkbox" id="joblens-remote-only" />
        <span>Remote only</span>
      </label>

      <label class="joblens-checkbox-row">
        <input type="checkbox" id="joblens-allow-hybrid" />
        <span>Allow hybrid</span>
      </label>

      <label class="joblens-checkbox-row">
        <input type="checkbox" id="joblens-allow-onsite" />
        <span>Allow onsite</span>
      </label>

      <label class="joblens-checkbox-row">
        <input type="checkbox" id="joblens-avoid-travel" />
        <span>Avoid travel</span>
      </label>

      <label class="joblens-checkbox-row">
        <input type="checkbox" id="joblens-avoid-oncall" />
        <span>Avoid on-call / night shifts</span>
      </label>

      <div class="joblens-settings-actions">
        <button class="joblens-save-btn" id="joblens-save-settings">Save settings</button>
      </div>
    </div>
  `;
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
        <div class="joblens-header-left">
          <h1>JobLens AI</h1>
          <span class="joblens-badge">LLM</span>
        </div>
        <button class="joblens-settings-btn" id="joblens-settings-toggle">Settings</button>
      </div>

      ${getSettingsPanelHtml()}

      <div class="joblens-section">
        <p class="joblens-label">Status</p>
        <p class="joblens-value">Waiting for job selection...</p>
      </div>
    </div>
  `;

  let lastSignature = "";
  let activeRenderId = 0;

  async function loadSettingsIntoForm() {
    const settings = await getStoredSettings();

    (root.querySelector("#joblens-profile") as HTMLSelectElement).value =
      settings.profile || "custom";

    (root.querySelector("#joblens-preferred-roles") as HTMLTextAreaElement).value =
      settings.preferredRoles.join(", ");
    (root.querySelector("#joblens-preferred-tech") as HTMLTextAreaElement).value =
      settings.preferredTechnologies.join(", ");
    (root.querySelector("#joblens-required-languages") as HTMLTextAreaElement).value =
      settings.requiredLanguages.join(", ");
    (root.querySelector("#joblens-max-years") as HTMLInputElement).value =
      String(settings.maxYearsRequired ?? 2);
    (root.querySelector("#joblens-min-salary") as HTMLInputElement).value =
      settings.minimumSalary || "";

    (root.querySelector("#joblens-remote-only") as HTMLInputElement).checked =
      settings.remoteOnly;
    (root.querySelector("#joblens-allow-hybrid") as HTMLInputElement).checked =
      settings.allowHybrid;
    (root.querySelector("#joblens-allow-onsite") as HTMLInputElement).checked =
      settings.allowOnsite;
    (root.querySelector("#joblens-avoid-travel") as HTMLInputElement).checked =
      settings.avoidTravel;
    (root.querySelector("#joblens-avoid-oncall") as HTMLInputElement).checked =
      settings.avoidOnCall;
  }

  function wireSettingsUi() {
    const currentSettingsPanel = root.querySelector("#joblens-settings-panel") as HTMLDivElement | null;
    const currentToggle = root.querySelector("#joblens-settings-toggle") as HTMLButtonElement | null;
    const currentSave = root.querySelector("#joblens-save-settings") as HTMLButtonElement | null;
    const currentProfile = root.querySelector("#joblens-profile") as HTMLSelectElement | null;

    if (currentToggle && currentSettingsPanel) {
      currentToggle.onclick = () => {
        currentSettingsPanel.classList.toggle("open");
      };
    }

    if (currentProfile) {
      currentProfile.onchange = async () => {
        const profile = currentProfile.value as JobLensSettings["profile"];
        if (profile === "custom") return;

        const current = await getStoredSettings();
        const merged: JobLensSettings = {
          ...current,
          ...getPresetSettings(profile),
          profile,
        };

        (root.querySelector("#joblens-preferred-roles") as HTMLTextAreaElement).value =
          (merged.preferredRoles || []).join(", ");
        (root.querySelector("#joblens-preferred-tech") as HTMLTextAreaElement).value =
          (merged.preferredTechnologies || []).join(", ");
        (root.querySelector("#joblens-required-languages") as HTMLTextAreaElement).value =
          (merged.requiredLanguages || []).join(", ");
        (root.querySelector("#joblens-max-years") as HTMLInputElement).value =
          String(merged.maxYearsRequired ?? 2);
        (root.querySelector("#joblens-min-salary") as HTMLInputElement).value =
          merged.minimumSalary || "";

        (root.querySelector("#joblens-remote-only") as HTMLInputElement).checked =
          !!merged.remoteOnly;
        (root.querySelector("#joblens-allow-hybrid") as HTMLInputElement).checked =
          !!merged.allowHybrid;
        (root.querySelector("#joblens-allow-onsite") as HTMLInputElement).checked =
          !!merged.allowOnsite;
        (root.querySelector("#joblens-avoid-travel") as HTMLInputElement).checked =
          !!merged.avoidTravel;
        (root.querySelector("#joblens-avoid-oncall") as HTMLInputElement).checked =
          !!merged.avoidOnCall;
      };
    }

    if (currentSave) {
      currentSave.onclick = async () => {
        const settings: JobLensSettings = {
          profile: (root.querySelector("#joblens-profile") as HTMLSelectElement)
            .value as JobLensSettings["profile"],
          preferredRoles: parseCsvInput(
            (root.querySelector("#joblens-preferred-roles") as HTMLTextAreaElement).value
          ),
          preferredTechnologies: parseCsvInput(
            (root.querySelector("#joblens-preferred-tech") as HTMLTextAreaElement).value
          ),
          requiredLanguages: parseCsvInput(
            (root.querySelector("#joblens-required-languages") as HTMLTextAreaElement).value
          ),
          maxYearsRequired: Number(
            (root.querySelector("#joblens-max-years") as HTMLInputElement).value || 0
          ),
          minimumSalary: (
            root.querySelector("#joblens-min-salary") as HTMLInputElement
          ).value.trim(),
          remoteOnly: (root.querySelector("#joblens-remote-only") as HTMLInputElement)
            .checked,
          allowHybrid: (root.querySelector("#joblens-allow-hybrid") as HTMLInputElement)
            .checked,
          allowOnsite: (root.querySelector("#joblens-allow-onsite") as HTMLInputElement)
            .checked,
          avoidTravel: (root.querySelector("#joblens-avoid-travel") as HTMLInputElement)
            .checked,
          avoidOnCall: (root.querySelector("#joblens-avoid-oncall") as HTMLInputElement)
            .checked,
        };

        await saveStoredSettings(settings);
        console.log("[JobLens] settings saved:", settings);

        if (currentSettingsPanel) {
          currentSettingsPanel.classList.remove("open");
        }

        lastSignature = "";
        void render();
      };
    }
  }

  async function render() {
    try {
      const job = extractLinkedInJob();
      console.log("[JobLens] extractLinkedInJob result:", job);

      if (!job) {
        console.log("[JobLens] No job found yet, keeping previous UI");
        return;
      }

      const combinedText = `
${job.title || ""}
${job.company || ""}
${job.location || ""}
${(job.metadata || []).join(" | ")}
${job.description || ""}
`.trim();

      console.log("[JobLens] combinedText length:", combinedText.length);
      console.log("[JobLens] combinedText preview:", combinedText.slice(0, 500));

      if (!combinedText) return;

      const signature = [
        job.title || "",
        job.company || "",
        job.location || "",
        (job.metadata || []).join("|"),
        (job.description || "").slice(0, 1200),
      ].join(" || ");

      if (signature === lastSignature) {
        console.log("[JobLens] Same job, skipping re-render");
        return;
      }
      lastSignature = signature;

      const renderId = ++activeRenderId;

      root.innerHTML = `
        <div class="joblens-card">
          <div class="joblens-header">
            <div class="joblens-header-left">
              <h1>JobLens AI</h1>
              <span class="joblens-badge">LLM</span>
            </div>
            <button class="joblens-settings-btn" id="joblens-settings-toggle">Settings</button>
          </div>

          ${getSettingsPanelHtml()}

          <div class="joblens-section">
            <p class="joblens-label">Status</p>
            <p class="joblens-value">Analyzing...</p>
          </div>
        </div>
      `;

      wireSettingsUi();
      await loadSettingsIntoForm();

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

      if (renderId !== activeRenderId) {
        console.log("[JobLens] Stale render ignored");
        return;
      }

      console.log("[JobLens] LLM RESULT:", llmResult);

      if (!llmResult) {
        root.innerHTML = `
          <div class="joblens-card">
            <div class="joblens-header">
              <div class="joblens-header-left">
                <h1>JobLens AI</h1>
                <span class="joblens-badge">LLM</span>
              </div>
              <button class="joblens-settings-btn" id="joblens-settings-toggle">Settings</button>
            </div>

            ${getSettingsPanelHtml()}

            <div class="joblens-section">
              <p class="joblens-label">Status</p>
              <p class="joblens-value">Analysis failed</p>
            </div>
          </div>
        `;

        wireSettingsUi();
        await loadSettingsIntoForm();
        return;
      }

      const recommendation = llmResult.apply_recommendation || "borderline";
      const recommendationClass =
        recommendation === "apply"
          ? "joblens-apply"
          : recommendation === "skip"
          ? "joblens-skip"
          : "joblens-borderline";

      root.innerHTML = `
        <div class="joblens-card">
          <div class="joblens-header">
            <div class="joblens-header-left">
              <h1>JobLens AI</h1>
              <span class="joblens-badge">LLM</span>
            </div>
            <button class="joblens-settings-btn" id="joblens-settings-toggle">Settings</button>
          </div>

          ${getSettingsPanelHtml()}

          <div class="joblens-section">
            <p class="joblens-label">Recommendation</p>
            <div class="joblens-big-status">
              <div class="joblens-recommendation ${recommendationClass}">
                ${escapeHtml(recommendation)}
              </div>
              <div class="joblens-confidence">
                Confidence: ${escapeHtml(String(llmResult.confidence ?? 0))}%
              </div>
            </div>
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Role</p>
            <p class="joblens-value">${escapeHtml(
              llmResult.normalized_role || job.title || "N/A"
            )}</p>
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Why Fit</p>
            ${renderList(llmResult.why_fit || [])}
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Why Not Fit</p>
            ${renderList(llmResult.why_not_fit || [])}
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Red Flags</p>
            ${renderList(llmResult.red_flags || [])}
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Details</p>
            <div class="joblens-grid">
              <div class="joblens-mini">
                <p class="joblens-label">Work Mode</p>
                <p class="joblens-value">${escapeHtml(llmResult.work_mode || "unknown")}</p>
              </div>

              <div class="joblens-mini">
                <p class="joblens-label">Seniority</p>
                <p class="joblens-value">${escapeHtml(llmResult.seniority || "unknown")}</p>
              </div>

              <div class="joblens-mini">
                <p class="joblens-label">Experience</p>
                <p class="joblens-value">${escapeHtml(llmResult.experience_required || "N/A")}</p>
              </div>

              <div class="joblens-mini">
                <p class="joblens-label">Salary</p>
                <p class="joblens-value">${escapeHtml(llmResult.salary || "N/A")}</p>
              </div>

              <div class="joblens-mini">
                <p class="joblens-label">Travel</p>
                <p class="joblens-value">${llmResult.travel_required ? "Yes" : "No"}</p>
              </div>

              <div class="joblens-mini">
                <p class="joblens-label">On Call</p>
                <p class="joblens-value">${llmResult.on_call ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Languages Required</p>
            ${renderPills(llmResult.languages_required || [])}
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Must Have</p>
            ${renderList(llmResult.must_have || [])}
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Nice to Have</p>
            ${renderList(llmResult.nice_to_have || [])}
          </div>

          <div class="joblens-section">
            <p class="joblens-label">Tech Stack</p>
            ${renderPills(llmResult.tech_stack || [])}
          </div>
        </div>
      `;

      wireSettingsUi();
      await loadSettingsIntoForm();
    } catch (error) {
      console.error("[JobLens] render error:", error);
    }
  }

  void loadSettingsIntoForm();
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