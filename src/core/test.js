import { analyzeJob } from "./llm-analyzer.js";

const jobText = `
We are looking for a Junior Cloud Support Engineer.
Requirements:
- 1+ year experience
- Basic knowledge of Azure or AWS
- Remote position
- No salary specified
`;

const run = async () => {
  const result = await analyzeJob(jobText);
  console.log(result);
};

run();