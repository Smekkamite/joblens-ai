import { mountApp } from "../app/main";

const ROOT_ID = "joblens-ai-extension-root";

export function injectApp() {
  const existingRoot = document.getElementById(ROOT_ID);
  if (existingRoot) return;

  const root = document.createElement("div");
  root.id = ROOT_ID;

  root.style.position = "fixed";
  root.style.top = "20px";
  root.style.right = "20px";
  root.style.zIndex = "999999";
  root.style.pointerEvents = "auto";

  document.body.appendChild(root);

  mountApp(root);
}