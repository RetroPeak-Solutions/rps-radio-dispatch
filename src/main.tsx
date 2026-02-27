import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import "@src/index.css";
import Root from "@src/root";
import { AppErrorBoundary } from "./Wrappers/Error/AppErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <HashRouter>
          <Root />
      </HashRouter>
    </AppErrorBoundary>
  </StrictMode>
);
