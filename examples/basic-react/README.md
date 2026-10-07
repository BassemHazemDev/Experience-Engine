# Basic React example

Creates an engine, mounts the React provider, and switches culture, theme and motion. Arabic flips the direction to RTL and changes the currency format; the copy for a culture is loaded as a resource before that culture is committed.

```bash
# from the repository root
npm install
npm run dev -w example-basic-react
```

| File | What to read |
|---|---|
| `src/experience.ts` | Culture, theme and motion definitions and the engine |
| `src/main.tsx` | `engine.init()` and `ExperienceProvider` |
| `src/App.tsx` | `useExperience()`, `useDirection()`, the three setters and `setExperience()` |
