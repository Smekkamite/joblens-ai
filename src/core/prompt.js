export const buildPrompt = (jobText) => `
Analyze the following job posting and extract structured information.

Return ONLY valid JSON.
Do not use markdown.
Do not wrap the response in code fences.
Do not add explanations.
Do not infer or guess missing information.
If something is not explicitly stated in the job posting, return "" or [].
Be conservative.

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

Strict rules:
- "role" must match the actual role in the posting as closely as possible. Do not replace it with a generic equivalent.
- "remote" must be:
  - "remote" only if explicitly stated
  - "hybrid" only if explicitly stated
  - "onsite" only if explicitly stated
  - otherwise "unknown"
- "experience_years" only if explicitly stated (examples: "1+", "2-3", "3+")
- "salary" only if explicitly stated
- "tech_stack" only technologies explicitly mentioned
- "red_flags" only real negative signals explicitly supported by the text
- add "no salary provided" only if salary is not mentioned
- add "high experience requirement" only if 3+ years or more are explicitly required for a junior role
- "verdict":
  - "good" = clearly junior-friendly and reasonable
  - "mid" = mixed / incomplete
  - "bad" = clearly senior-heavy, restrictive, or multiple strong red flags

Job posting:
${jobText}
`;