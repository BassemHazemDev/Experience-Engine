# Component adaptation

A theme can change a component at three depths. Use the shallowest one that does the job.

| Depth | What changes | Example |
|---|---|---|
| **Token** | The same component reads new values | Card radius, colour, spacing |
| **Variant** | The same component takes a different form | Navigation as a labelled rail or as icons only |
| **Replacement** | A different component is rendered | A data table replaced by a compact list |

## Tokens

Nothing special: the component reads `experience.tokens`, usually through CSS variables.

```css
.card {
  border-radius: var(--radius);
  background: var(--card);
}
```

## Variants and replacements

`ComponentResolver` maps a component name and a context to the component that should render.

```ts
import { ComponentResolver } from "@experience-engine/core";

const components = new ComponentResolver({
  Navigation: { variants: { compact: "NavigationCompact" } },
  OrdersTable: { replacements: { list: "OrdersList" } },
});

components.resolve("Navigation");
// { mode: "base", component: "Navigation" }

components.resolve("Navigation", { variant: "compact" });
// { mode: "variant", component: "NavigationCompact", variant: "compact" }

components.resolve("OrdersTable", { replacement: "list" });
// { mode: "replacement", component: "OrdersList" }
```

A replacement takes precedence over a variant. An unknown variant or replacement falls back to `base`.

The resolver returns names. Mapping a name to a component is your code:

```tsx
const registry = { Navigation, NavigationCompact, OrdersTable, OrdersList };
const Orders = registry[components.resolve("OrdersTable", { replacement }).component];
```

## Letting the theme choose

The theme needs to say which variant or replacement it wants. The resolved experience carries tokens, so the simplest way is a token:

```ts
const themes = {
  light: { tokens: { radius: 12, "component.nav": "rail", "component.orders": "table" } },
  midnight: { tokens: { radius: 6, "component.nav": "compact", "component.orders": "list" } },
};
```

```tsx
const { tokens } = experience;
const nav = components.resolve("Navigation", { variant: String(tokens["component.nav"]) });
const orders = components.resolve("OrdersTable", { replacement: String(tokens["component.orders"]) });
```

`component.*` is a naming convention, not an engine feature. The engine treats these like any other token, so a change shows up in the delta as `token:component.orders`.

## Preparing replacement code

If a replacement is a lazily loaded chunk, list it as a `code` resource on the theme that uses it. The engine then loads it before the commit, and the swap happens without a loading state.

```ts
const themes = {
  midnight: {
    tokens: { "component.orders": "list" },
    resources: [{ kind: "code", id: "components/orders-list", version: "1", load: () => import("./orders-list") }],
  },
};
```

```tsx
// The same module, so by commit time it is already loaded.
const OrdersList = lazy(() => import("./orders-list"));
```

## Examples

- Minimal: [`examples/component-adaptation`](../examples/component-adaptation).
- In a full application: `06-project/components/preview/adaptation.ts` and the Midnight theme in `06-project/engine/definitions.ts`.

## Current limitation

`ThemeDefinition` has a `components` field, and the typed delta has a `components` section, but the resolver does not yet copy a theme's `components` onto the resolved experience. Until it does, the delta's component section stays empty and the token convention above is the way to drive adaptation.
