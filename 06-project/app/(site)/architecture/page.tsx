import type { Metadata } from "next";
import Link from "next/link";
import { ArchitectureExplorer } from "@/components/architecture/explorer";
import { ProvenanceTag } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Architecture" };

const MANUAL_CONCERNS = [
  "Culture state",
  "Theme state",
  "Motion state",
  "Resource selector",
  "Component branch",
  "Layout branch",
  "Direction branch",
  "Transition branch",
  "Failure handling",
  "Stale-request guard",
  "Loading state",
];

const MANUAL_SKETCH = `const generation = ++latest;
setLoading(true);
try {
  const [messages, font, assets, code] = await Promise.all([
    loadMessages(culture),
    loadFont(culture, theme),
    loadAssets(theme),
    theme === "midnight" ? import("./orders-list") : null,
  ]);
  if (generation !== latest) return;      // stale
  setMessages(messages);
  setDirection(culture === "ar-EG" ? "rtl" : "ltr");
  setTheme(theme);
  setLayout(pickLayout(culture, theme));
  setAnimation(motion);
} catch {
  // keep whatever was on screen… if nothing above ran yet
} finally {
  setLoading(false);
}`;

const ENGINE_SKETCH = `await engine.setExperience({
  culture,
  theme,
  motion,
});`;

export default function ArchitecturePage() {
  return (
    <main className="page">
      <header className="page-head">
        <h1>Architecture</h1>
        <p className="lede">
          A framework-agnostic core runs the Experience Transition Protocol. Adapters connect it to React and Next.js. The application sends one request and
          renders one snapshot.
        </p>
      </header>

      <ArchitectureExplorer />

      <section className="band" aria-labelledby="compare-title">
        <div className="band-head">
          <h2 id="compare-title">Where the orchestration lives</h2>
          <p>
            Without an experience runtime, each of these concerns is something the application coordinates by hand at every place an experience can change.
            With the engine they sit behind one call.
          </p>
        </div>
        <div className="compare">
          <article className="compare-side">
            <h3>Orchestrated in the application</h3>
            <ul className="concerns">
              {MANUAL_CONCERNS.map((concern) => (
                <li key={concern}>{concern}</li>
              ))}
            </ul>
            <pre className="code-block">
              <code>{MANUAL_SKETCH}</code>
            </pre>
            <ProvenanceTag kind="illustrative">Illustrative sketch, not code from the evaluation</ProvenanceTag>
          </article>
          <article className="compare-side compare-engine">
            <h3>Handed to the engine</h3>
            <ul className="concerns">
              <li>Experience request</li>
            </ul>
            <pre className="code-block">
              <code>{ENGINE_SKETCH}</code>
            </pre>
            <ProvenanceTag kind="engine">This is the call the Studio makes</ProvenanceTag>
          </article>
        </div>
        <p className="note band-note">
          This compares where coordination code sits, which is a structural difference. It is not a performance comparison. A carefully written manual
          controller reaches the same tested safety outcomes; see the Traditional+ baseline on the <Link href="/evidence">Evidence</Link> page.
        </p>
      </section>
    </main>
  );
}
