import { ComponentResolver, type ComponentResolution, type ResolvedExperience } from "@experience-engine/core";

// Token → Variant → Replacement.
// Tokens restyle a component in place. A variant keeps the component and
// changes its form. A replacement swaps in a different component.
const resolver = new ComponentResolver({
  Navigation: { variants: { compact: "NavigationCompact" } },
  OrdersTable: { replacements: { list: "OrdersList" } },
});

export interface ComponentAdaptation {
  readonly navigation: ComponentResolution;
  readonly orders: ComponentResolution;
}

/** Resolves component adaptation from the theme's `component.*` tokens via the core ComponentResolver. */
export function resolveComponents(experience: ResolvedExperience): ComponentAdaptation {
  return {
    navigation: resolver.resolve("Navigation", { variant: String(experience.tokens["component.nav"] ?? "") }),
    orders: resolver.resolve("OrdersTable", { replacement: String(experience.tokens["component.orders"] ?? "") }),
  };
}
