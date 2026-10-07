# Component adaptation example

Three themes, three depths of change:

| Theme | What changes | Depth |
|---|---|---|
| `comfortable` | baseline | — |
| `rounded` | card radius; `Button` resolves to `PillButton` | token, variant |
| `compact` | spacing; `OrdersTable` is replaced by `OrdersList` | token, replacement |

```bash
# from the repository root
npm install
npm run dev -w example-component-adaptation
```

`src/experience.ts` holds the themes and the `ComponentResolver`. `src/App.tsx` asks the resolver which component to render and prints the result.
