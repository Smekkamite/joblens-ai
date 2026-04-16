export function detectSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const skills: string[] = [];

  const skillMap: Array<{ label: string; patterns: string[] }> = [
    { label: "Azure", patterns: ["azure"] },
    { label: "AWS", patterns: ["aws", "amazon web services"] },
    { label: "GCP", patterns: ["gcp", "google cloud"] },
    { label: "Kubernetes", patterns: ["kubernetes"] },
    { label: "AKS", patterns: ["aks"] },
    { label: "Docker", patterns: ["docker"] },
    { label: "Terraform", patterns: ["terraform"] },
    { label: "Linux", patterns: ["linux"] },
    { label: "Python", patterns: ["python"] },
    { label: "PowerShell", patterns: ["powershell", "power shell"] },
    { label: "CI/CD", patterns: ["ci/cd", "cicd", "continuous integration", "continuous delivery"] },
    { label: "Git", patterns: ["git"] },
    { label: "Networking", patterns: ["networking", "network"] },
    { label: "Entra ID", patterns: ["entra id"] },
    { label: "Active Directory", patterns: ["active directory", "ad ds"] },
    { label: "Microsoft 365", patterns: ["microsoft 365", "m365", "office 365"] },
    { label: "Okta", patterns: ["okta"] },
    { label: "IAM", patterns: ["iam", "identity and access management"] },
    { label: "SSO", patterns: ["sso", "single sign-on"] },
    { label: "MFA", patterns: ["mfa", "multi-factor authentication"] },
    { label: "Identity Governance", patterns: ["identity governance"] },
    { label: "Troubleshooting", patterns: ["troubleshooting"] },
    { label: "IT Support", patterns: ["it support", "technical support", "help desk", "helpdesk"] },
  ];

  for (const skill of skillMap) {
    const found = skill.patterns.some((pattern) => lower.includes(pattern));
    if (found) {
      skills.push(skill.label);
    }
  }

  return [...new Set(skills)].slice(0, 6);
}