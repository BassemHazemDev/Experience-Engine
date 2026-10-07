# Experience model

An experience is one culture, one theme and one motion. All definitions live in `engine/definitions.ts`.

```ts
type StudioRequest = {
  culture: "en-US" | "ar-EG";
  theme: "light" | "luxury" | "midnight";
  motion: "instant" | "smooth" | "reduced";
};
```

The resolved experience id is `<culture>::<theme>::<motion>`, for example `ar-EG::luxury::smooth`. The default request is `en-US`, `light`, `instant`.

## Cultures

| | `en-US` | `ar-EG` |
|---|---|---|
| Locale | `en-US` | `ar-EG` |
| Direction | `ltr` | `rtl` |
| Body font | Figtree (`--font-latin`) | IBM Plex Sans Arabic (`--font-arabic`) |
| Heading font | the theme's display face | IBM Plex Sans Arabic (`displayFamily`) |
| Line height | 1.5 | 1.75 |
| Currency | USD | EGP |
| Numbering system | `latn` | `arab` |
| Resources | translation `messages/en-US`, font `latin-text` | translation `messages/ar-EG`, font `arabic-text` |

What changes when the culture changes:

- `dir` and `lang` on the preview root
- All copy, including customer names and activity items
- Body typeface, line height and letter spacing
- Digits, currency symbol and date format
- Sidebar side, text alignment, badge and control placement, table column order
- Chart direction and hero texture side

## Themes

| | `light` | `luxury` | `midnight` |
|---|---|---|---|
| Character | Clean, bright | Warm black and gold | Navy, compact |
| Density | comfortable (`space` 16) | spacious (`space` 22) | compact (`space` 11) |
| Radius | 12 | 2 | 6 |
| Display face | Figtree | Fraunces (serif) | Figtree |
| Heading weight | 650 | 500 | 600 |
| Button | Solid accent | Outlined gold | Solid cyan |
| Shadow | Soft drop shadow | Hairline glow and deep shadow | None |
| Navigation | `rail` (labelled) | `rail` | `compact` (icon-only variant) |
| Orders | `table` | `table` | `list` (replacement) |
| Resources | asset `texture/light` | asset `texture/luxury`, font `serif-display` | asset `texture/midnight`, code `components/orders-list` |

### Token reference

Every theme defines the same keys.

| Token | Used for |
|---|---|
| `surface`, `sidebar`, `card`, `raised` | Page, navigation, card and inset backgrounds |
| `text`, `muted`, `border` | Text and line colours |
| `accent`, `accentText`, `accentSoft` | Primary colour, text on it, and its tint |
| `positive`, `negative`, `warning` | Status colours |
| `radius`, `radius.control` | Card and control corner radius |
| `shadow` | Card shadow |
| `space` | Base spacing unit; sets density |
| `font.display`, `heading.weight`, `heading.tracking` | Heading typography |
| `button.bg`, `button.text`, `button.border` | Primary button treatment |
| `texture` | Hero background image |
| `component.nav` | Navigation variant |
| `component.orders` | Orders component replacement |

## Motions

| | `instant` | `smooth` | `reduced` |
|---|---|---|---|
| Strategy | `instant` | `view-transition` | `css` |
| Duration | 0 ms | 480 ms | 140 ms |
| Easing | — | `cubic-bezier(.2,.8,.2,1)` | `linear` |
| What you see | Immediate change | Cross-fade with slight blur and scale | Short colour fade |

## Resources

| Kind | What the loader does |
|---|---|
| `translation` | Dynamic `import()` of the locale's message module, then registers it in the catalog |
| `font` | `document.fonts.load()` for the family behind a CSS variable; no-op on the server |
| `asset` | Creates an `Image` and awaits `decode()`; no-op on the server |
| `code` | Dynamic `import()` of a component module |

Because the engine awaits all of these before it commits, the new copy, typeface, texture and component are all available in the same frame as the change.

## Presets

Each preset is exactly one request (`engine/presets.ts`).

| Preset | Request |
|---|---|
| International | `en-US` · `light` · `instant` |
| Arabic Luxury | `ar-EG` · `luxury` · `instant` |
| Arabic Executive | `ar-EG` · `luxury` · `smooth` |
| Minimal | `en-US` · `midnight` · `instant` |
| Executive Dark | `en-US` · `luxury` · `reduced` |

The rapid-test sequence is five requests ending in `ar-EG` · `luxury` · `smooth`.

## Independence of the dimensions

- Changing only the culture produces a delta with no `token:` keys and no motion change (covered by a test).
- Changing only the motion produces a closure of a single node, `motion:<id>` (covered by a test).
- No code path reads a culture id to choose a theme value or a motion behaviour.

One deliberate interaction exists: a culture may declare `typography.displayFamily`. Arabic does, because the themes' Latin display faces have no Arabic glyphs. This is data on the culture, not a branch on the culture id.

## Adding a definition

### A new theme

1. Add the id to `THEMES` in `engine/definitions.ts`.
2. Add an entry to `themes` with every token in the reference table.
3. Add a label in `LABELS.theme`.
4. If it needs a texture, add an SVG under `public/textures/` and reference it in both the `texture` token and an `asset` resource.

No change to the core, the adapter or the preview components is needed. The controls, cookie whitelist and inspector pick it up from the constants.

### A new culture

1. Add the id to `CULTURES` and an entry to `cultures`.
2. Add `engine/messages/<id>.ts` typed as `Messages`, and a loader in `messageLoaders`.
3. Add a label in `LABELS.culture`.
4. If the script needs its own typeface, declare it in `app/fonts.ts` and reference its CSS variable in `typography.fontFamily`.

### A new motion

Add the id to `MOTIONS`, an entry to `motions`, and a label. If it uses a strategy other than `instant`, `css` or `view-transition`, add handling for it in `use-presented-experience.ts`.
