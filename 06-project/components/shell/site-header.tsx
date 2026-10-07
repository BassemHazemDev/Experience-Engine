"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEngineStatus, useStudioRuntime } from "@/components/engine-boundary";
import { useSettings } from "./settings";

// Developer-facing pages first; the research pages follow.
const LINKS = [
  { href: "/studio", label: "Studio" },
  { href: "/playground", label: "Playground" },
  { href: "/personalized", label: "Personalized SSR" },
  { href: "/case-study", label: "Case study" },
  { href: "/architecture", label: "Architecture" },
  { href: "/benchmark", label: "Benchmark" },
  { href: "/evidence", label: "Evidence" },
];

const REPOSITORY_URL = "https://github.com/BassemHazemDev/Experience-Engine";

const STATUS_LABEL = { starting: "Engine starting", preparing: "Engine preparing", ready: "Engine ready", failed: "Engine could not start" } as const;

export function SiteHeader() {
  const pathname = usePathname();
  const status = useEngineStatus();
  const { retryStart } = useStudioRuntime();
  const { researchMode, setResearchMode, studioTheme, setStudioTheme } = useSettings();

  return (
    <header className="site-header">
      <Link href="/" className="site-brand">
        <span className="site-brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>
          Experience Engine <span className="site-brand-sub">Studio</span>
        </span>
      </Link>

      <nav className="site-nav" aria-label="Primary">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="site-tools">
        <span className="engine-status" data-status={status} role="status">
          <span className="engine-status-dot" aria-hidden="true" />
          {STATUS_LABEL[status]}
          {status === "failed" && (
            <button type="button" className="btn btn-ghost btn-small" onClick={retryStart}>
              Retry
            </button>
          )}
        </span>

        <button
          type="button"
          className="switch"
          role="switch"
          aria-checked={researchMode}
          onClick={() => setResearchMode(!researchMode)}
        >
          <span className="switch-track" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
          Research mode
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => setStudioTheme(studioTheme === "dark" ? "light" : "dark")}
          aria-label={`Switch Studio interface to ${studioTheme === "dark" ? "light" : "dark"}`}
          title="Studio interface colour. Separate from the experience Theme."
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="10" cy="10" r="6.5" />
            <path d="M10 3.5v13a6.5 6.5 0 000-13z" fill="currentColor" />
          </svg>
        </button>

        <a className="btn btn-ghost" href={REPOSITORY_URL} rel="noreferrer">
          GitHub
        </a>
      </div>
    </header>
  );
}
