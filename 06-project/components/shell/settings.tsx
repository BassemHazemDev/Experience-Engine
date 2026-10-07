"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type StudioTheme = "dark" | "light";

interface Settings {
  readonly researchMode: boolean;
  readonly setResearchMode: (on: boolean) => void;
  /** The Studio's own chrome. Unrelated to the engine's Theme dimension. */
  readonly studioTheme: StudioTheme;
  readonly setStudioTheme: (theme: StudioTheme) => void;
}

const SettingsContext = createContext<Settings | null>(null);

export const STUDIO_THEME_KEY = "studio-theme";
const RESEARCH_KEY = "studio-research-mode";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked; the setting then lasts for this page only.
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [researchMode, setResearch] = useState(false);
  const [studioTheme, setTheme] = useState<StudioTheme>("dark");

  useEffect(() => {
    setResearch(read(RESEARCH_KEY) === "on");
    setTheme(document.documentElement.dataset.studioTheme === "light" ? "light" : "dark");
  }, []);

  const setResearchMode = useCallback((on: boolean) => {
    setResearch(on);
    write(RESEARCH_KEY, on ? "on" : "off");
  }, []);

  const setStudioTheme = useCallback((theme: StudioTheme) => {
    setTheme(theme);
    document.documentElement.dataset.studioTheme = theme;
    write(STUDIO_THEME_KEY, theme);
  }, []);

  const value = useMemo(
    () => ({ researchMode, setResearchMode, studioTheme, setStudioTheme }),
    [researchMode, setResearchMode, studioTheme, setStudioTheme],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error("useSettings must be used inside SettingsProvider.");
  return settings;
}

/** Runs before paint so the saved Studio theme never flashes. */
export const studioThemeScript = `try{var t=localStorage.getItem(${JSON.stringify(STUDIO_THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.studioTheme=t}catch(e){}`;
