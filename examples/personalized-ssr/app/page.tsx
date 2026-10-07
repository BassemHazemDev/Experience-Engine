import { cookies } from "next/headers";
import ClientExperience from "./client";
import { COOKIE, parseCookie } from "./cookie";
import { createEngine, type Request } from "./experience";

// Rendered for every request, because the cookie decides the result.
export const dynamic = "force-dynamic";

export default async function Page() {
  const request = parseCookie((await cookies()).get(COOKIE)?.value);

  // A new engine per request: nothing is shared between visitors.
  const engine = createEngine(request);
  const experience = await engine.init();

  return (
    <div data-server-experience-id={experience.id} data-server-direction={experience.direction}>
      <ClientExperience initialRequest={experience.request as Request} />
    </div>
  );
}
