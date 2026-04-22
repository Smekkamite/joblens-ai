export const buildPrompt = (jobText) => `

You are extracting hiring signals from a job posting for a job screening tool.

Your task is extraction only.
Do NOT decide whether the candidate should apply.
Do NOT generate motivational summaries.
Do NOT include generic company positives like:
- inclusive work environment
- equal opportunities employer
- growth opportunity
- dynamic team
unless they are explicit hard requirements or constraints.

Return ONLY valid JSON.
Do not use markdown.
Do not wrap the response in code fences.
Do not add explanations.
Do not infer unsupported facts.

If a field is not explicitly supported by the text, use:
- "" for strings
- [] for arrays
- false for booleans
- "unknown" only when explicitly allowed

Return this exact JSON structure:

{
  "normalized_role": "",
  "work_mode": "remote | hybrid | onsite | unknown",
  "seniority": "junior | mid | senior | unknown",
  "experience_required": "",
  "salary": "",
  "travel_required": false,
  "on_call": false,
  "languages_required": [],
  "must_have": [],
  "nice_to_have": [],
  "tech_stack": [],
  "raw_risks": [],
  "confidence": 0
}

Rules:

1. normalized_role
- Use the actual role in the posting
- Do not invent a different role

2. work_mode
- "remote" only if explicitly remote
- "hybrid" only if explicitly hybrid / partial onsite / mixed
- "onsite" only if explicitly onsite / office-based / in-presence
- otherwise "unknown"

3. seniority
- "junior" only if explicitly junior / entry-level / graduate / trainee / internship
- "mid" if the posting clearly expects prior professional experience but is not senior/lead
- "senior" if explicitly senior / lead / principal / staff / expert
- otherwise "unknown"
- NEVER return combined values like "junior | mid"

4. experience_required
- Extract only explicit years/experience requirements
- Examples: "1+", "2-3", "3+", "3-4", "5+"
- Otherwise ""

5. salary
- Extract only if explicitly stated
- Keep it concise

6. travel_required
- true only if travel is explicitly required
- otherwise false

7. on_call
- true only if on-call / shifts / night shifts / rotation / weekend availability are explicitly required
- otherwise false

8. languages_required
- Include only explicitly required languages

9. must_have
- Include only explicit hard requirements or core expectations
- Keep items short and concrete
- No soft generic filler unless clearly central to the role

10. nice_to_have
- Include only explicit preferred / bonus / optional requirements
- Keep items short and concrete

11. tech_stack
- Include only explicit technologies, platforms, infrastructure, tools, or technical domains
- Keep items short and concrete
- Do not output vague things like "cloud-based technologies" if the actual stack is not stated

12. raw_risks
- Include only explicit caution signals from the posting
- Good examples:
  - "Travel required"
  - "On-call / shift work"
  - "3+ years required"
  - "Client-facing technical ownership"
  - "Proven SaaS experience required"
  - "Multiple stakeholder coordination"
  - "Integration ownership"
  - "Fast-paced startup environment"
  - "Hybrid role"
  - "Onsite role"
- No generic corporate fluff

13. confidence
- Integer from 0 to 100
- High confidence only if the posting is explicit and detailed

Job posting:
${jobText}
`;