/// <reference types="chrome" />

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
        const prompt = `
Analyze the following job posting and extract structured information.

Return ONLY valid JSON.
Do not use markdown.
Do not wrap the response in code fences.
Do not add explanations.
Do not invent missing information.
If information is missing, use an empty string "" or an empty array [].

Return this exact JSON structure:

{
  "role": "",
  "remote": "remote | hybrid | onsite | unknown",
  "experience_years": "",
  "salary": "",
  "tech_stack": [],
  "verdict": "good | mid | bad",
  "red_flags": []
}

Rules:
- "experience_years" should contain only the required years if explicitly mentioned (example: "1+", "2-3").
- "salary" should be empty if not explicitly mentioned.
- "tech_stack" must include only clearly mentioned technologies.
- "red_flags" must include only real negative signals explicitly supported by the text.
- Add "no salary provided" only if salary is not mentioned.
- Add "onsite only" only if the role is explicitly onsite.
- Add "hybrid role" only if the role is explicitly hybrid.
- Add "high experience requirement" only if the role explicitly requires 3+ years or more for a junior role.
- "verdict":
  - "good" = junior-friendly, remote, reasonable requirements
  - "mid" = mixed signals
  - "bad" = senior/heavy requirements, onsite/hybrid mismatch, or multiple strong red flags

Job posting:
${jobText}
`;

        const res = await fetch("http://localhost:11434/api/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
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
        } catch (_jsonError) {
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
        } catch (_parseError) {
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

        sendResponse({ ok: true, data: parsed });
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