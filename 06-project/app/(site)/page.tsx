import Image from "next/image";
import Link from "next/link";
import { HeroDemo } from "@/features/landing/hero-demo";

const DIMENSIONS = [
  {
    dim: "culture",
    name: "Culture",
    body: "Locale, reading direction, typography, number and date formats, and the copy itself. Arabic is a different layout, not a translated heading.",
  },
  {
    dim: "theme",
    name: "Theme",
    body: "Semantic tokens for surface, text, radius, density and shadow, plus which components take a variant or are replaced outright.",
  },
  {
    dim: "motion",
    name: "Motion",
    body: "How a committed change is shown: instantly, as a view transition, or reduced. It never depends on which culture or theme is active.",
  },
] as const;

const STAGES = [
  { name: "Experience state", body: "One committed, immutable snapshot of the resolved culture, theme and motion." },
  { name: "Experience transition", body: "A complete target request replaces scattered setters." },
  { name: "Typed delta", body: "The engine works out exactly which keys differ between the two snapshots." },
  { name: "Dependency closure", body: "Only what depends on those keys is prepared. Everything else is left alone." },
  { name: "Heterogeneous preparation", body: "Translations, fonts, assets and code load together before anything is shown." },
  { name: "Guarded commit", body: "The new experience becomes visible in one step, and only if it is still the latest request." },
];

export default function Home() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-author-badge">
            <Image src="/author-logo.png" alt="" width={16} height={16} className="hero-author-logo" aria-hidden="true" />
            <span>
              Built &amp; maintained by{" "}
              <a href="https://github.com/BassemHazemDev" target="_blank" rel="noopener noreferrer">
                Bassem Hazem
              </a>
            </span>
          </div>
          <h1>Design the experience. Let the engine handle the transition.</h1>
          <p className="lede">
            Experience Engine is a framework-agnostic runtime for multi-dimensional UI experience transitions. Culture, theme and motion are chosen
            independently and change together through one call.
          </p>
          <div className="hero-actions">
            <Link href="/studio" className="btn btn-primary btn-lg">
              Open Studio
            </Link>
            <Link href="/case-study" className="btn btn-lg">
              Read the case study
            </Link>
          </div>
        </div>
        <HeroDemo />
      </section>

      <section className="band" aria-labelledby="dimensions-title">
        <div className="band-head">
          <h2 id="dimensions-title">One application, three independent dimensions</h2>
          <p>
            Compose culture, theme and motion independently. The application sends one request and does not orchestrate the resources, components, direction
            and transitions that follow from it.
          </p>
        </div>
        <ul className="dimension-cards">
          {DIMENSIONS.map((item) => (
            <li key={item.dim} data-dim={item.dim}>
              <h3>{item.name}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="band" aria-labelledby="protocol-title">
        <div className="band-head">
          <h2 id="protocol-title">What happens between the request and the screen</h2>
          <p>The Experience Transition Protocol runs the same six steps for every change, whether one dimension moves or all three.</p>
        </div>
        <ol className="protocol">
          {STAGES.map((stage) => (
            <li key={stage.name}>
              <h3>{stage.name}</h3>
              <p>{stage.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="band band-split" aria-labelledby="next-title">
        <div className="band-head">
          <h2 id="next-title">See it take a transition apart</h2>
          <p>
            The Studio shows the delta, the dependency closure, every resource and the commit for each change you make. Personalized SSR resolves the first
            experience on the server from a cookie, then hands it to the same runtime.
          </p>
        </div>
        <ul className="link-list">
          <li>
            <Link href="/studio">Studio</Link>
            <span>Compose an experience and inspect the transition</span>
          </li>
          <li>
            <Link href="/playground">Playground</Link>
            <span>Fire rapid requests and break a transition on purpose</span>
          </li>
          <li>
            <Link href="/personalized">Personalized SSR</Link>
            <span>Same URL, different first render per visitor</span>
          </li>
          <li>
            <Link href="/case-study">Case study</Link>
            <span>The problem, the model and one transition, in five minutes</span>
          </li>
          <li>
            <Link href="/architecture">Architecture</Link>
            <span>Layers, the eight protocol stages, component adaptation</span>
          </li>
          <li>
            <Link href="/evidence">Evidence</Link>
            <span>What was tested, what is scoped, what is not claimed</span>
          </li>
          <li>
            <a href="https://github.com/BassemHazemDev/Experience-Engine">GitHub</a>
            <span>Source, documentation and examples</span>
          </li>
        </ul>
      </section>

      <section className="band author-band" aria-labelledby="author-title">
        <div className="author-card">
          <Image
            src="/author-logo.png"
            alt="Bassem Hazem logo"
            width={52}
            height={52}
            className="author-card-logo"
          />
          <div className="author-card-body">
            <h2 id="author-title" className="author-card-title">Created by Bassem Hazem</h2>
            <p className="author-card-bio">
              Software engineer and independent researcher working across full-stack architecture, product engineering, and UI runtime systems.
              Experience Engine was developed to formalize and evaluate the Experience Transition Protocol (ETP).
            </p>
            <div className="author-card-links">
              <a href="https://github.com/BassemHazemDev" target="_blank" rel="noopener noreferrer" className="btn btn-small">
                GitHub @BassemHazemDev
              </a>
              <a href="https://www.linkedin.com/in/bassem-hazem-7902b32a2/" target="_blank" rel="noopener noreferrer" className="btn btn-small">
                LinkedIn Profile
              </a>
              <a href="https://github.com/BassemHazemDev/Experience-Engine" target="_blank" rel="noopener noreferrer" className="btn btn-small">
                Canonical Repository
              </a>
              <a href="https://www.npmjs.com/package/@experience-engine/core" target="_blank" rel="noopener noreferrer" className="btn btn-small">
                npm Packages
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
