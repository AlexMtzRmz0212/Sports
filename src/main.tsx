import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/big-shoulders-display/700";
import "@fontsource/big-shoulders-display/800";
import "@fontsource/barlow/400";
import "@fontsource/barlow/600";
import "@fontsource/barlow-condensed/600";
import "@fontsource/barlow-condensed/700";
import "@fontsource/kalam/400";
import "@fontsource/kalam/700";
import "./styles/base.css";
import "./styles/venues.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
