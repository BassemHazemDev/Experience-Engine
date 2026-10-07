# LinkedIn launch draft

A draft only. Nothing has been posted. Replace the bracketed placeholders before publishing, and remove the npm line if the packages are not published yet.

---

I've open-sourced Experience Engine, a small runtime I built to deal with one specific problem in multi-market front ends.

**The problem**

Most apps already handle language, right-to-left layout, theming and animation. They handle them separately: an i18n library, a theme provider, some conditional rendering, a few lazy imports.

That works until they have to change at the same moment. Switch a dashboard from English and a light theme to Arabic and a dark, compact one, and a single click now means: load the Arabic copy and font before showing any Arabic, flip the layout, swap every token, replace a data table with a compact list whose code isn't downloaded yet, and animate it or not. If the user clicks again halfway through, the older request must not land on top of the newer one. If anything fails to load, the screen should stay exactly as it was.

None of those steps is hard. The coordination between them is, and it usually ends up scattered through application code.

**The idea**

Treat the whole combination as one value, an "experience", with three independent dimensions: culture, theme and motion. The app declares them as data and asks for a complete experience:

```ts
await engine.setExperience({ culture: "ar-EG", theme: "luxury", motion: "smooth" });
```

The engine resolves the target, works out a typed delta, finds what depends on it, loads what's needed, and commits in one step, only if that request is still the latest one.

**A concrete example**

In the demo, that one call changes the language, flips direction to RTL, switches the typeface, replaces 24 design tokens, loads a translation bundle, two fonts and a texture, and cross-fades the result. If I make the font fail on purpose, the UI simply stays in English and the same request can be retried.

**What's in the repo**

- `@experience-engine/core`: framework-agnostic, no dependencies
- `@experience-engine/react`: a provider and hooks on `useSyncExternalStore`
- Experience Engine Studio: a Next.js app that previews a storefront admin and takes each transition apart, showing the delta, the dependency graph, every resource and the commit. There's also a playground for rapid switching and failure recovery, and a page where a cookie chooses the server-rendered experience.
- Docs, four small examples, and the research record the project grew out of

**What it is not**

I want to be straightforward about this. It's version 0.1.0 and experimental; I haven't run it in production. In my own evaluation, a carefully written manual controller reached the same safety results, so the value is having that logic in one reusable place, not a guarantee you couldn't get otherwise. It isn't faster in general either: in several of my measurements it added overhead. And nobody outside the project has replicated the results yet.

If you work on design systems, localization, or multi-brand products, I'd like to hear where this matches your experience and where it doesn't.

GitHub: https://github.com/BassemHazemDev/Experience-Engine
Studio: [LIVE DEMO URL — add after deployment]
npm: [`@experience-engine/core`, `@experience-engine/react` — add after publishing]

#frontend #react #nextjs #designsystems #i18n #opensource

---

## Notes for the author

- The figures in "A concrete example" come from the Studio's own inspector for the transition `en-US / light / instant` → `ar-EG / luxury / smooth`: 24 visual tokens changed, and four resources (a translation bundle, two fonts, one texture). Re-check them in the Studio before posting in case the demo definitions have changed.
- A short screen recording of that transition with the inspector open will carry the post better than a screenshot.
- If the paper is under double-blind review when you post, a public post that links your name to the project's title makes anonymity harder to maintain. The venue allows public archives but notes this risk.
