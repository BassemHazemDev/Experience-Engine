import type { Metadata } from "next";
import Link from "next/link";
import { LocalRunner } from "@/components/benchmark/local-runner";
import { ProvenanceTag } from "@/components/ui/primitives";
import { NEXT_CLIENT_SAMPLES, PERFORMANCE_STATEMENT, REACT18_SAMPLES, SOURCES, STORED_ADAPTER_NOTE, SYNTHETIC_RESULTS } from "@/lib/evidence";

export const metadata: Metadata = { title: "Benchmark" };

export default function BenchmarkPage() {
  return (
    <main className="page">
      <header className="page-head">
        <h1>Benchmark</h1>
        <p className="lede">
          Runtime characterization, not a race. Three kinds of numbers appear on this page and each is labelled: results stored from local runs, results from
          synthetic workloads, and readings taken in your browser right now.
        </p>
      </header>

      <section className="band" aria-labelledby="position-title">
        <blockquote className="statement">
          <p id="position-title">{PERFORMANCE_STATEMENT}</p>
          <footer>
            From the paper’s evaluation, <code>{SOURCES.paper}</code>
          </footer>
        </blockquote>
      </section>

      <section className="band" aria-labelledby="react-title">
        <div className="band-head">
          <h2 id="react-title">React 18 end-to-end</h2>
          <p>
            React 18.3.1 with the real adapter: three transitions, each ending in the requested state with one observed React re-render. Two long-task entries
            were reported per sample, so these are treated as characterization only.
          </p>
          <ProvenanceTag kind="stored" />
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Target experience</th>
                <th scope="col" className="num">
                  Switch latency
                </th>
                <th scope="col" className="num">
                  Resource wait
                </th>
                <th scope="col" className="num">
                  Commit to paint
                </th>
                <th scope="col" className="num">
                  CLS
                </th>
                <th scope="col" className="num">
                  Dropped frames
                </th>
                <th scope="col" className="num">
                  Long tasks
                </th>
              </tr>
            </thead>
            <tbody>
              {REACT18_SAMPLES.map((sample, index) => (
                <tr key={index}>
                  <td>
                    <code>{sample.target}</code>
                  </td>
                  <td className="num">{sample.switchLatencyMs.toFixed(1)} ms</td>
                  <td className="num">{sample.resourceWaitMs.toFixed(1)} ms</td>
                  <td className="num">{sample.commitToPaintMs.toFixed(1)} ms</td>
                  <td className="num">{sample.cls}</td>
                  <td className="num">{sample.droppedFrames}</td>
                  <td className="num">{sample.longTasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note band-note">
          Three samples in one local Chromium-based browser. {STORED_ADAPTER_NOTE} Source: <code>{SOURCES.phase92}</code>
        </p>
      </section>

      <section className="band" aria-labelledby="next-title">
        <div className="band-head">
          <h2 id="next-title">Next.js client runtime</h2>
          <p>
            Next.js 16.2.0 App Router with React 19.2.0, production server. After hydration, three transitions ran through the adapter and the DOM converged
            to each requested state.
          </p>
          <ProvenanceTag kind="stored" />
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Target experience</th>
                <th scope="col" className="num">
                  Request to DOM convergence
                </th>
              </tr>
            </thead>
            <tbody>
              {NEXT_CLIENT_SAMPLES.map((sample, index) => (
                <tr key={index}>
                  <td>
                    <code>{sample.target}</code>
                  </td>
                  <td className="num">{sample.latencyMs.toFixed(1)} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note band-note">
          {STORED_ADAPTER_NOTE} Source: <code>{SOURCES.phase92}</code>. Server-side personalization is covered on the <Link href="/personalized">Personalized SSR</Link> page.
        </p>
      </section>

      <section className="band" aria-labelledby="synthetic-title">
        <div className="band-head">
          <h2 id="synthetic-title">Synthetic and stress workloads</h2>
          <p>These describe behaviour on generated workloads. They characterize the tested dependency model and say nothing about speed in a real product.</p>
          <ProvenanceTag kind="synthetic" />
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Experiment</th>
                <th scope="col">Workload</th>
                <th scope="col">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {SYNTHETIC_RESULTS.map((row) => (
                <tr key={row.name}>
                  <th scope="row">{row.name}</th>
                  <td>{row.size}</td>
                  <td>{row.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note band-note">
          Source: <code>{SOURCES.paper}</code>. Ablation and baseline results are on the <Link href="/evidence">Evidence</Link> page.
        </p>
      </section>

      <section className="band" aria-labelledby="local-title">
        <div className="band-head">
          <h2 id="local-title">Take your own readings</h2>
          <p>
            Cold, cached, preloaded, RTL and rapid scenarios, run once each against the real engine on this device. “Cold” means cold for the engine’s cache;
            your browser may already hold the files.
          </p>
        </div>
        <LocalRunner />
      </section>
    </main>
  );
}
