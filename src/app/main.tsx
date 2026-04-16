import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

export function mountApp(container: HTMLElement) {
  const root = ReactDOM.createRoot(container);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  return root;
}