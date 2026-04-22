declare module "../core/llm-analyzer" {
  export function analyzeJob(jobText: string): Promise<{
    role: string;
    remote: string;
    experience_years: string;
    salary: string;
    tech_stack: string[];
    verdict: string;
    red_flags: string[];
  }>;
}