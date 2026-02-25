import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import "./index.css";
import Root from "./root.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <Root />
    </HashRouter>
  </StrictMode>
);
