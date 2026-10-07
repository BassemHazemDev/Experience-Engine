import { Figtree, Fraunces, IBM_Plex_Sans_Arabic, JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";

// Studio chrome
const studio = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-studio", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

// Faces used by the previewed application. The engine prepares them as font
// resources, so only the default Latin face is preloaded with the page.
// No metric-matched system fallback for these two: that fallback (Arial, Times)
// has Arabic glyphs and would win over the Arabic face in a font stack.
const latin = Figtree({ subsets: ["latin"], variable: "--font-latin", display: "swap", adjustFontFallback: false });
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-arabic",
  display: "swap",
  preload: false,
});
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap", preload: false, adjustFontFallback: false });

export const fontVariables = [studio, mono, latin, arabic, serif].map((font) => font.variable).join(" ");
