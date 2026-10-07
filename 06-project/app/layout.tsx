import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SettingsProvider, studioThemeScript } from "@/components/shell/settings";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Experience Engine Studio", template: "%s · Experience Engine Studio" },
  description:
    "A framework-agnostic runtime protocol for composing and transitioning web experiences across culture, theme, and motion.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-studio-theme="dark" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: studioThemeScript }} />
      </head>
      <body>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
