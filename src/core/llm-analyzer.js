
import { buildPrompt } from "./prompt.js";

export const analyzeJob = async (jobText) => {
  const prompt = buildPrompt(jobText);

  const res = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3.1:8b",
      prompt,
      stream: false
    })
  });

  const data = await res.json();

  try {
    return JSON.parse(data.response);
  } catch (e) {
    console.error("Invalid JSON from LLM:", data.response);
    return null;
  }
};