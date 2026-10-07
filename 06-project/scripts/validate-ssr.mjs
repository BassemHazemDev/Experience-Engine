// Checks the raw HTTP response of /personalized for several cookies.
// Usage: start the production server (npm run build && npm start), then
//   node scripts/validate-ssr.mjs            (defaults to http://localhost:3000)
//   BASE_URL=http://localhost:3200 node scripts/validate-ssr.mjs
//
// Nothing here runs JavaScript from the page: every assertion is made on the
// HTML text the server sent.

const base = process.env.BASE_URL ?? "http://localhost:3000";
const url = `${base}/personalized`;

const cases = [
  { name: "cookie A", cookie: "ar-EG.luxury.smooth", id: "ar-EG::luxury::smooth", direction: "rtl", source: "cookie", text: "نوفا كوميرس" },
  { name: "cookie B", cookie: "en-US.light.instant", id: "en-US::light::instant", direction: "ltr", source: "cookie", text: "Nova Commerce" },
  { name: "cookie C", cookie: "ar-EG.midnight.reduced", id: "ar-EG::midnight::reduced", direction: "rtl", source: "cookie", text: "نوفا كوميرس" },
  { name: "invalid cookie", cookie: "fr-FR.neon.fast", id: "en-US::light::instant", direction: "ltr", source: "invalid", text: "Nova Commerce" },
  { name: "no cookie", cookie: null, id: "en-US::light::instant", direction: "ltr", source: "missing", text: "Nova Commerce" },
];

const marker = (html, name) => html.match(new RegExp(`data-server-${name}="([^"]*)"`))?.[1];

const results = [];
for (const test of cases) {
  const response = await fetch(url, { headers: test.cookie ? { Cookie: `experience=${test.cookie}` } : {} });
  const html = await response.text();
  const preview = html.match(/<div class="xp-root"[^>]*>/)?.[0] ?? "";
  const observed = {
    status: response.status,
    id: marker(html, "experience-id"),
    direction: marker(html, "direction"),
    source: marker(html, "cookie-source"),
    previewDir: preview.match(/dir="([^"]*)"/)?.[1],
    previewId: preview.match(/data-experience-id="([^"]*)"/)?.[1],
    containsCopy: html.includes(test.text),
  };
  const pass =
    observed.status === 200 &&
    observed.id === test.id &&
    observed.direction === test.direction &&
    observed.source === test.source &&
    observed.previewDir === test.direction &&
    observed.previewId === test.id &&
    observed.containsCopy;
  results.push({ case: test.name, cookie: test.cookie, expected: test.id, observed, pass, bytes: html.length });
}

const ids = new Set(results.filter((r) => r.observed.source === "cookie").map((r) => r.observed.id));
const sameRouteDifferentServerOutput = ids.size === 3;
const status = results.every((r) => r.pass) && sameRouteDifferentServerOutput ? "PASS" : "FAIL";

console.log(JSON.stringify({ status, route: "/personalized", sameRouteDifferentServerOutput, checkedAt: new Date().toISOString(), results }, null, 2));
process.exit(status === "PASS" ? 0 : 1);
