import { ComponentResolver, ExperienceEngine } from "@experience-engine/core";

export type Theme = "comfortable" | "rounded" | "compact";

// The three depths of adaptation, cheapest first:
//   token        the same component reads new values
//   variant      the same component takes a different form
//   replacement  a different component is rendered
//
// Themes carry the choice as plain tokens. "component.*" is this example's own
// naming convention; the engine treats them like any other token.
export const engine = new ExperienceEngine<"en-US", Theme, "instant">({
  cultures: { "en-US": { locale: "en-US", direction: "ltr" } },
  themes: {
    comfortable: { tokens: { radius: 4, gap: 16, "component.button": "default", "component.orders": "table" } },
    rounded: { tokens: { radius: 20, gap: 16, "component.button": "pill", "component.orders": "table" } },
    compact: { tokens: { radius: 4, gap: 6, "component.button": "default", "component.orders": "list" } },
  },
  motions: { instant: { defaultStrategy: "instant", durationMs: 0 } },
  initial: { culture: "en-US", theme: "comfortable", motion: "instant" },
});

// Which names a variant or a replacement resolves to.
export const components = new ComponentResolver({
  Button: { variants: { pill: "PillButton" } },
  OrdersTable: { replacements: { list: "OrdersList" } },
});
