import type { Metadata } from "next";
import Link from "next/link";
import { createDependencyGraph, seedNodes } from "@experience-engine/core";
import { resolveComponents } from "@/components/preview/adaptation";
import { ExperienceTriplet, ProvenanceTag } from "@/components/ui/primitives";
import { createEngine } from "@/engine/create-engine";
import type { StudioRequest } from "@/engine/definitions";
import { EVIDENCE } from "@/lib/evidence";

export const metadata: Metadata = { title: "Case study" };

const FROM: StudioRequest = { culture: "en-US", theme: "light", motion: "instant" };
const TO: StudioRequest = { culture: "ar-EG", theme: "midnight", motion: "smooth" };

/** Runs one real transition when the page is built, so the example below is the engine's own output. */
async function runExample() {
  const engine = createEngine(FROM);
  await engine.init();
  const before = engine.getExperience()!;
  const after = await engine.setExperience(TO);
  const tx = engine.runtime.getLastTransaction()!;
  const graph = createDependencyGraph(tx.from, tx.to, tx.delta);
  return {
    tx,
    after,
    nodes: graph.nodes.size,
    seeds: seedNodes(tx.delta, tx.to).length,
    visualTokens: Object.keys(tx.delta.tokens.changed).filter((key) => !key.startsWith("component.")).length,
    componentsBefore: resolveComponents(before),
    componentsAfter: resolveComponents(after),
  };
}

const row = (name: string) => EVIDENCE.find((entry) => entry.name === name)!;

export default async function CaseStudyPage() {
  const example = await runExample();
  const { tx, after, componentsBefore, componentsAfter } = example;

  return (
    <main className="page">
      <header className="page-head">
        <h1>Case study</h1>
        <p className="lede">
          Why changing language, theme and motion at the same time is harder than changing each one, what Experience Engine does about it, and what the
          evidence does and does not show. About five minutes.
        </p>
      </header>

      <section className="band" aria-labelledby="problem-title">
        <div className="band-head">
          <h2 id="problem-title">The problem</h2>
        </div>
        <div className="prose">
          <p>
            A product that serves more than one market and more than one brand ends up with several ways its interface can vary: the language and reading
            direction, the visual theme, how much it animates. Each has good tooling. A localization library handles copy and formats, design tokens handle
            colour and spacing, and a setting handles animation.
          </p>
          <p>
            The trouble starts when they change together. Take a storefront admin switching from English with a light theme to Arabic with a dark, compact
            one. That single user action means:
          </p>
          <ul>
            <li>load the Arabic copy and an Arabic typeface, and do not show Arabic text until both are there;</li>
            <li>flip the layout to right-to-left, including the chart and the table columns;</li>
            <li>swap every colour, radius and spacing value;</li>
            <li>replace the data table with a compact list, whose code has to be downloaded first;</li>
            <li>animate the change, or not, depending on a setting and on the device;</li>
            <li>if the user clicks again before this finishes, make sure the older request cannot land on top of the newer one;</li>
            <li>if anything fails to load, leave the screen exactly as it was.</li>
          </ul>
        </div>
      </section>

      <section className="band" aria-labelledby="hard-title">
        <div className="band-head">
          <h2 id="hard-title">Why the usual approach gets difficult</h2>
        </div>
        <div className="prose">
          <p>
            None of those steps is hard. What is hard is that they live in different places: a locale provider, a theme provider, a few lazy imports, some
            conditional rendering, a loading flag. The coordination between them is nobody&rsquo;s job, so it ends up in application code, written again at
            each place an experience can change.
          </p>
          <p>
            That code tends to grow the same parts every time: a counter to detect stale requests, a <code>Promise.all</code> over whatever needs loading,
            an ordering of state updates so nothing shows half-applied, and a catch block that tries to undo what already happened. It can be written
            correctly. It is rarely written once.
          </p>
        </div>
      </section>

      <section className="band" aria-labelledby="model-title">
        <div className="band-head">
          <h2 id="model-title">The model</h2>
        </div>
        <div className="prose">
          <p>
            Experience Engine treats the combination as one value, an <strong>experience</strong>, with three independent dimensions: <strong>culture</strong>{" "}
            (locale, direction, typography, formats, translations, fonts), <strong>theme</strong> (tokens, density, component adaptation, assets) and{" "}
            <strong>motion</strong> (how a change is shown). The application declares them as plain data and asks for a complete experience:
          </p>
          <pre className="code-block">
            <code>{`await engine.setExperience({ culture: "ar-EG", theme: "midnight", motion: "smooth" });`}</code>
          </pre>
          <p>
            Each dimension can still change on its own. What changes is who owns the transition: the engine, in one place, instead of the application, in
            many.
          </p>
        </div>
      </section>

      <section className="band" aria-labelledby="protocol-title">
        <div className="band-head">
          <h2 id="protocol-title">What the engine does with a request</h2>
          <p>The Experience Transition Protocol. The same eight stages run for every change.</p>
        </div>
        <ol className="case-steps">
          <li>
            <h3>Normalize</h3>
            <p>Validate the request and fill in defaults.</p>
          </li>
          <li>
            <h3>Resolve</h3>
            <p>Turn it into an immutable snapshot: locale, direction, tokens, formats, resources, motion.</p>
          </li>
          <li>
            <h3>Diff</h3>
            <p>Compare with the current snapshot to get a typed delta, one section per dimension.</p>
          </li>
          <li>
            <h3>Seeds</h3>
            <p>Pick the nodes in the dependency graph that the delta touches directly.</p>
          </li>
          <li>
            <h3>Closure</h3>
            <p>Follow the graph from those seeds to find everything affected. The rest is left alone.</p>
          </li>
          <li>
            <h3>Prepare</h3>
            <p>Load the translations, fonts, assets and code the target needs, together, without touching what is on screen.</p>
          </li>
          <li>
            <h3>Transition</h3>
            <p>Hand the resolved motion to the application to play.</p>
          </li>
          <li>
            <h3>Commit</h3>
            <p>If this is still the latest request, replace the committed snapshot in one step. Otherwise discard it.</p>
          </li>
        </ol>
      </section>

      <section className="band" aria-labelledby="impl-title">
        <div className="band-head">
          <h2 id="impl-title">Implementation</h2>
        </div>
        <div className="prose">
          <p>
            Two packages. <code>@experience-engine/core</code> is the runtime: no dependencies, no framework, no browser globals, so the same code resolves
            an experience in a server component. <code>@experience-engine/react</code> is a provider and a handful of hooks on top of{" "}
            <code>useSyncExternalStore</code>; components re-render when the engine commits and at no other time.
          </p>
          <p>
            Components adapt at three depths. A <strong>token</strong> restyles a component in place. A <strong>variant</strong> keeps the component and
            changes its form. A <strong>replacement</strong> swaps in a different component, and its code is prepared like any other resource.
          </p>
          <p>
            This site is the larger worked example. The storefront preview in the <Link href="/studio">Studio</Link> holds no language, theme or animation
            state of its own; it renders whatever snapshot the engine committed.
          </p>
        </div>
      </section>

      <section className="band" aria-labelledby="example-title">
        <div className="band-head">
          <h2 id="example-title">One transition, concretely</h2>
          <p>
            The transition described at the top of this page, run by the engine when this page was built. <ProvenanceTag kind="engine" />
          </p>
        </div>
        <p className="band-note" style={{ marginBlockEnd: 16 }}>
          <ExperienceTriplet request={FROM} /> <span aria-label="to">→</span> <ExperienceTriplet request={TO} />
        </p>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">What</th>
                <th scope="col">Before</th>
                <th scope="col">After</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Language</th>
                <td>
                  <code>{tx.delta.culture.locale?.from}</code>
                </td>
                <td>
                  <code>{tx.delta.culture.locale?.to}</code>
                </td>
              </tr>
              <tr>
                <th scope="row">Direction</th>
                <td>
                  <code>{tx.delta.culture.direction?.from}</code>
                </td>
                <td>
                  <code>{tx.delta.culture.direction?.to}</code>
                </td>
              </tr>
              <tr>
                <th scope="row">Currency format</th>
                <td>
                  <code>{String(tx.from?.formatting.currency)}</code>
                </td>
                <td>
                  <code>{String(after.formatting.currency)}</code>
                </td>
              </tr>
              <tr>
                <th scope="row">Page surface token</th>
                <td>
                  <code>{String(tx.from?.tokens.surface)}</code>
                </td>
                <td>
                  <code>{String(after.tokens.surface)}</code>
                </td>
              </tr>
              <tr>
                <th scope="row">Navigation</th>
                <td>
                  <code>
                    {componentsBefore.navigation.component} ({componentsBefore.navigation.mode})
                  </code>
                </td>
                <td>
                  <code>
                    {componentsAfter.navigation.component} ({componentsAfter.navigation.mode})
                  </code>
                </td>
              </tr>
              <tr>
                <th scope="row">Orders</th>
                <td>
                  <code>
                    {componentsBefore.orders.component} ({componentsBefore.orders.mode})
                  </code>
                </td>
                <td>
                  <code>
                    {componentsAfter.orders.component} ({componentsAfter.orders.mode})
                  </code>
                </td>
              </tr>
              <tr>
                <th scope="row">Motion</th>
                <td>
                  <code>{tx.delta.motion.strategy?.from}</code>
                </td>
                <td>
                  <code>
                    {tx.delta.motion.strategy?.to}, {after.motion.durationMs} ms
                  </code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <dl className="facts" style={{ marginBlockStart: 20 }}>
          <div>
            <dt>Changed keys in the delta</dt>
            <dd>
              {tx.delta.changedKeys.length}, of which {example.visualTokens} are visual tokens
            </dd>
          </div>
          <div>
            <dt>Dependency graph</dt>
            <dd>
              {tx.affected.length} of {example.nodes} nodes in the prepared closure, from {example.seeds} seeds
            </dd>
          </div>
          <div>
            <dt>Resources prepared before commit</dt>
            <dd>
              {after.resources.length}: {after.resources.map((resource) => resource.kind).join(", ")}
            </dd>
          </div>
          <div>
            <dt>Outcome</dt>
            <dd>{tx.status}</dd>
          </div>
        </dl>
        <p className="note band-note">
          Run it yourself in the <Link href="/studio">Studio</Link> and open the inspector, or break it on purpose in the{" "}
          <Link href="/playground">Playground</Link>.
        </p>
      </section>

      <section className="band" aria-labelledby="eval-title">
        <div className="band-head">
          <h2 id="eval-title">What the evaluation found</h2>
          <p>
            Stored results from the research record. <ProvenanceTag kind="stored">Stored results, not live measurements</ProvenanceTag>
          </p>
        </div>
        <div className="prose">
          <ul>
            <li>
              <strong>The safety properties hold in the tested workloads.</strong> {row("Browser stress").result}
            </li>
            <li>
              <strong>Each stage earns its place.</strong> {row("Ablation").result}
            </li>
            <li>
              <strong>A careful manual implementation does just as well on safety.</strong> {row("Traditional+ baseline").result} The contribution is the
              reusable abstraction, not a guarantee that cannot be had otherwise.
            </li>
            <li>
              <strong>It is not faster in general.</strong> In several measured scenarios the engine added orchestration overhead.
            </li>
            <li>
              <strong>Server rendering works in the tested setup.</strong> {row("Dynamic per-request SSR").result}
            </li>
          </ul>
          <p>
            The full table, with the scope of each result and its source file, is on the <Link href="/evidence">Evidence</Link> page.
          </p>
        </div>
      </section>

      <section className="band" aria-labelledby="limits-title">
        <div className="band-head">
          <h2 id="limits-title">Limitations</h2>
        </div>
        <div className="prose">
          <ul>
            <li>Version 0.1.0 is experimental and has not been used in production.</li>
            <li>The engine reports commits. The stages before a commit cannot be observed as live events.</li>
            <li>Component adaptation is driven by theme tokens, so the delta lists those token keys instead of component changes.</li>
            <li>Results on dependency locality come from synthetic graphs. The graph in this demo has a few dozen nodes.</li>
            <li>Per-request server rendering was validated on a local production server, not behind a CDN or a shared cache.</li>
            <li>Nobody outside the project has independently replicated the results.</li>
            <li>The evaluation is about system behaviour. It does not measure whether people prefer the result.</li>
          </ul>
        </div>
      </section>

      <section className="band" aria-labelledby="links-title">
        <div className="band-head">
          <h2 id="links-title">Where to go next</h2>
        </div>
        <ul className="link-list" style={{ maxInlineSize: 720 }}>
          <li>
            <Link href="/studio">Studio</Link>
            <span>Compose an experience and inspect the transition</span>
          </li>
          <li>
            <Link href="/playground">Playground</Link>
            <span>Rapid requests, injected failures, unregistered ids</span>
          </li>
          <li>
            <Link href="/personalized">Personalized SSR</Link>
            <span>A cookie choosing the server-rendered experience</span>
          </li>
          <li>
            <Link href="/architecture">Architecture</Link>
            <span>Layers and stages in more detail</span>
          </li>
          <li>
            <a href="https://github.com/BassemHazemDev/Experience-Engine">GitHub</a>
            <span>Source, documentation, examples and the research archive</span>
          </li>
        </ul>
      </section>
    </main>
  );
}
