import ClientExperience from "./client";
import { createEngine, type Request } from "./experience";

// The experience this page is rendered in. A Server Component resolves it,
// so the HTML arrives with the right direction, language and colours.
const REQUEST: Request = { culture: "ar-EG", theme: "dark", motion: "smooth" };

export default async function Page() {
  const engine = createEngine(REQUEST);
  const experience = await engine.init();

  return (
    <div data-server-experience-id={experience.id} data-server-direction={experience.direction}>
      <ClientExperience initialRequest={experience.request as Request} />
    </div>
  );
}
