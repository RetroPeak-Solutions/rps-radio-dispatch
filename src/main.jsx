import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import "./index.css";
import Root from "./root.jsx";
import { AppErrorBoundary } from "./Wrappers/Error/AppErrorBoundary";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <HashRouter>
          <Root />
      </HashRouter>
    </AppErrorBoundary>
  </StrictMode>
);
