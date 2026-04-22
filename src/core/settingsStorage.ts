/// <reference types="chrome" />
import { defaultSettings, type JobLensSettings } from "./bladeSettings";

const STORAGE_KEY = "joblens_settings";

export async function getJobLensSettings(): Promise<JobLensSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      const stored = result?.[STORAGE_KEY];

      resolve({
        ...defaultSettings,
        ...(stored || {}),
      });
    });
  });
}

export async function saveJobLensSettings(
  settings: JobLensSettings
): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(
      {
        [STORAGE_KEY]: settings,
      },
      () => resolve()
    );
  });
}