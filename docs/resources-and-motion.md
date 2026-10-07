# Resources and motion

## Resources

A resource is something an experience needs before it can be shown.

```ts
interface ResourceReference {
  kind: "translation" | "font" | "asset" | "code";
  id: string;
  version?: string;
  load?: () => Promise<unknown>;
}
```

Attach resources to the culture or theme that needs them:

```ts
const cultures = {
  "ar-EG": {
    locale: "ar-EG",
    direction: "rtl",
    resources: [
      { kind: "translation", id: "messages/ar-EG", version: "1", load: () => import("./messages/ar-EG") },
      { kind: "font", id: "arabic-text", version: "1", load: () => document.fonts.load("16px 'IBM Plex Sans Arabic'") },
    ],
  },
};

const themes = {
  luxury: {
    tokens: { … },
    resources: [
      { kind: "asset", id: "texture/luxury", version: "1", load: () => decode("/textures/luxury.svg") },
    ],
  },
};
```

`kind` is a label. The engine does not load differently per kind; your `load` function does the work. In the dependency graph, translations and fonts are attached to the culture and assets and code to the theme.

A resolved experience lists the culture's resources followed by the theme's.

### Loading

During the Prepare stage the engine calls `load()` for every resource of the target experience, in parallel, and waits for all of them. Only then can the commit happen.

### Caching

- A resource is identified by `kind`, `id` and `version`.
- After a successful load it is cached for the lifetime of the engine and `load()` is not called again.
- Two transitions that need the same resource at the same time share one `load()` call.
- A failed load is **not** cached. The next request tries again.
- Change `version` to force a reload of changed content.

```ts
engine.resources.cachedCount();        // how many are cached
engine.resources.invalidate(resource); // drop one
engine.resources.clear();              // drop all
```

### Using what was loaded

The engine guarantees the resource has loaded before the experience is committed. Making the loaded value available to your components is up to you. A simple pattern is a module-level map that the loader fills:

```ts
const messages = new Map<string, Messages>();

const translation = (culture: string) => ({
  kind: "translation" as const,
  id: `messages/${culture}`,
  version: "1",
  load: async () => messages.set(culture, (await import(`./messages/${culture}.ts`)).default),
});

// In a component, after commit:
const text = messages.get(experience.locale)!;
```

### Preload

`engine.preload(request)` loads a request's resources without changing the experience. Use it on hover or focus so the switch that follows has nothing to wait for.

```tsx
<button
  onPointerEnter={() => void engine.preload(arabic).catch(() => undefined)}
  onClick={() => void engine.setExperience(arabic).catch(() => undefined)}
>
  العربية
</button>
```

### Failure

If any `load()` rejects, `setExperience()` rejects with `RESOURCE_LOAD_FAILED` and the commit does not happen. The experience on screen is the one that was already committed. `error.details.key` names the resource and `error.cause` holds the original error.

```ts
try {
  await engine.setExperience(target);
} catch (error) {
  if (error instanceof ExperienceEngineError && error.code === "RESOURCE_LOAD_FAILED") {
    // still on the previous experience; offer a retry
  }
}
```

If the very first `init()` fails, nothing is committed and `engine.getExperience()` stays `undefined`. Render a fallback and let the user retry.

### On the server

Loaders run on the server too. Guard browser-only APIs:

```ts
load: async () => {
  if (typeof document === "undefined") return;
  await document.fonts.load("16px 'IBM Plex Sans Arabic'");
};
```

## Motion

The engine resolves a motion definition onto `experience.motion` and does nothing else with it. Playing it belongs to your application.

```ts
experience.motion; // { defaultStrategy: "view-transition", durationMs: 480, easing: "…" }
```

### Applying a commit

A commit reaches React as a re-render. To animate it, decide how to apply the new snapshot based on its motion.

```tsx
function usePresented(experience) {
  const [presented, setPresented] = useState(experience);

  useEffect(() => {
    if (experience === presented) return;
    const canAnimate = "startViewTransition" in document && document.visibilityState === "visible";

    if (experience.motion.defaultStrategy === "view-transition" && canAnimate) {
      document.startViewTransition(() => flushSync(() => setPresented(experience)));
    } else {
      setPresented(experience);
    }
  }, [experience, presented]);

  return presented;
}
```

For the `css` strategy, set the duration as a CSS variable and transition colours:

```css
.app * {
  transition: background-color var(--motion-ms) var(--motion-ease), color var(--motion-ms) var(--motion-ease);
}
```

The Studio's version, with the safeguards described below, is `06-project/components/preview/use-presented-experience.ts`.

### Reduced motion

Respect the system preference when you play a motion. Do not change the request.

```ts
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const strategy = prefersReduced && motion.defaultStrategy !== "instant" ? "css" : motion.defaultStrategy;
const duration = prefersReduced ? Math.min(motion.durationMs ?? 0, 140) : motion.durationMs;
```

The committed experience still says `smooth`. Only its presentation on this device is shorter. The engine's definition and the browser's preference are two different things, and keeping them apart means the stored preference stays correct when the user moves to another device.

### Fallback behaviour

- **No View Transitions API.** Apply the snapshot directly. The experience still commits.
- **Hidden tab.** Browsers skip view transitions for hidden documents, and a tab that has stopped rendering may never run the update callback. Check `document.visibilityState` first, and do not let the screen depend on the callback alone.
- **Direction and font changes** cannot be interpolated with CSS transitions. A view transition cross-fades the old and new render instead.
