import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ExperienceProvider } from "@experience-engine/react";
import { App } from "./App";
import { engine } from "./experience";

// Commit the initial experience, then render.
void engine.init().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ExperienceProvider engine={engine}>
        <App />
      </ExperienceProvider>
    </StrictMode>,
  );
});
