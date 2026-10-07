import type { Metadata } from "next";
import { cookies } from "next/headers";
import { EngineBoundary } from "@/components/engine-boundary";
import { SiteHeader } from "@/components/shell/site-header";
import { ExperienceTriplet } from "@/components/ui/primitives";
import { createEngine } from "@/engine/create-engine";
import type { StudioRequest } from "@/engine/definitions";
import { EXPERIENCE_COOKIE, parseExperienceCookie } from "@/engine/experience-cookie";
import { messageLoaders } from "@/engine/messages";
import { PersonalizedRuntime } from "@/features/personalized/personalized-runtime";

export const metadata: Metadata = { title: "Personalized SSR" };

// Rendered for every request: the cookie decides the first experience.
export const dynamic = "force-dynamic";

const SOURCE_TEXT = {
  cookie: "Resolved from the request cookie",
  missing: "No cookie was sent, so the default experience was used",
  invalid: "The cookie did not name a registered experience, so the safe default was used",
} as const;

export default async function PersonalizedPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(EXPERIENCE_COOKIE)?.value;
  const parsed = parseExperienceCookie(raw);

  // A new engine for this request only. Nothing here outlives the response.
  const engine = createEngine(parsed.request);
  const experience = await engine.init();
  const request = experience.request as StudioRequest;
  const initialMessages = await messageLoaders[request.culture]();

  const shownCookie = raw === undefined ? undefined : raw.length > 80 ? `${raw.slice(0, 80)}…` : raw;

  return (
    <EngineBoundary initialRequest={request} initialMessages={initialMessages}>
      <SiteHeader />
      <main
        id="server-personalized-experience"
        className="page page-wide"
        data-render-source="dynamic-server-component"
        data-server-experience-id={experience.id}
        data-server-culture={request.culture}
        data-server-theme={request.theme}
        data-server-motion={request.motion}
        data-server-direction={experience.direction}
        data-server-cookie-source={parsed.source}
      >
        <header className="page-head">
          <h1>Personalized SSR</h1>
          <p className="lede">
            This page has one URL. The server reads your <code>experience</code> cookie, resolves that experience with a fresh engine, and sends HTML that
            is already in your language, direction and theme. The browser then hydrates it and the same runtime takes over.
          </p>
        </header>

        <div className="ssr">
          <section className="ssr-trace" aria-labelledby="trace-title">
            <h2 id="trace-title" className="sr-only">
              Request and response
            </h2>

            <div className="trace-step">
              <h3>Request</h3>
              <pre className="code-block">
                <code>
                  GET /personalized{"\n"}
                  Cookie: {shownCookie === undefined ? "(none)" : `${EXPERIENCE_COOKIE}=${shownCookie}`}
                </code>
              </pre>
            </div>

            <div className="trace-step">
              <h3>Server resolution</h3>
              <p className="note" id="server-proof">
                {SOURCE_TEXT[parsed.source]}. Resolved on the server before any JavaScript ran in your browser.
              </p>
              <dl className="facts facts-rows" id="server-experience">
                <div>
                  <dt>ID</dt>
                  <dd>
                    <code>{experience.id}</code>
                  </dd>
                </div>
                <div>
                  <dt>Culture</dt>
                  <dd>
                    <code>{request.culture}</code>
                  </dd>
                </div>
                <div>
                  <dt>Theme</dt>
                  <dd>
                    <code>{request.theme}</code>
                  </dd>
                </div>
                <div>
                  <dt>Motion</dt>
                  <dd>
                    <code>{request.motion}</code>
                  </dd>
                </div>
                <div>
                  <dt>Direction</dt>
                  <dd>
                    <code>{experience.direction}</code>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="trace-step">
              <h3>HTML</h3>
              <p className="note">
                The application to the right is part of this response, rendered as <ExperienceTriplet request={request} size="sm" />. View the page source
                to see it without JavaScript.
              </p>
            </div>

            <PersonalizedRuntime serverId={experience.id} part="trace" />
          </section>

          <section className="ssr-stage" aria-label="Server-rendered application">
            <PersonalizedRuntime serverId={experience.id} part="stage" />
          </section>
        </div>

        <p className="note band-note">
          Validated in a local Next.js production server (PASS_WITH_SCOPE). This does not establish behaviour for every CDN, cache or deployment topology.
        </p>
      </main>
    </EngineBoundary>
  );
}
