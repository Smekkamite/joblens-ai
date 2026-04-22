export type JobLensSettings = {
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

export const defaultSettings: JobLensSettings = {
  preferredRoles: ["it support", "technical support", "cloud support", "azure", "helpdesk"],
  preferredTechnologies: ["azure", "microsoft 365", "active directory", "entra id", "networking", "powershell"],
  requiredLanguages: ["english"],

  remoteOnly: false,
  allowHybrid: true,
  allowOnsite: false,

  maxYearsRequired: 2,
  avoidTravel: true,
  avoidOnCall: true,

  minimumSalary: "",
};