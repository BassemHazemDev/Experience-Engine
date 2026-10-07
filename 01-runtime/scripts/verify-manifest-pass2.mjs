#!/usr/bin/env node
// Verifies the Pass 2 manifest (01-runtime/manifest-pass2.json) against the
// files on disk. Read-only: it never writes, and it never touches the
// Phase 37 manifest (01-runtime/manifest.json).
//
// Usage, from anywhere inside the repository:
//   node 01-runtime/scripts/verify-manifest-pass2.mjs
//   node 01-runtime/scripts/verify-manifest-pass2.mjs --allow-no-git
//
// Exit code 0 only when every check passes. Any mismatch, missing file or
// check that could not be carried out exits with 1.
//
// --allow-no-git  For a copy of the artifact that has no git history (for
//                 example an extracted archive). The change-set check is then
//                 reported as SKIPPED and does not fail the run. Every
//                 file-level check still applies.
//
// Requires Node 18 or newer. Uses only Node built-ins.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const MANIFEST = "01-runtime/manifest-pass2.json";
const allowNoGit = process.argv.includes("--allow-no-git");

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
// Byte-preserving CRLF -> LF. latin1 maps every byte to one code unit, so no
// other byte is altered.
const toLf = (buffer) => Buffer.from(buffer.toString("latin1").replace(/\r\n/g, "\n"), "latin1");
const abs = (relative) => path.join(ROOT, ...relative.split("/"));
const read = (relative) => readFileSync(abs(relative));

const checks = [];
const record = (name, status, detail = "") => checks.push({ name, status, detail });
const lines = [];
const out = (text = "") => lines.push(text);

function finish() {
  const width = Math.max(...checks.map((check) => check.name.length));
  out();
  out("CHECKS");
  for (const check of checks) {
    out(`  [${check.status.padEnd(7)}] ${check.name.padEnd(width)}  ${check.detail}`.trimEnd());
  }
  const failed = checks.filter((check) => check.status === "FAIL");
  const skipped = checks.filter((check) => check.status === "SKIPPED");
  out();
  out(
    `RESULT: ${failed.length === 0 ? "PASS" : "FAIL"}` +
      `  (${checks.filter((check) => check.status === "PASS").length} passed, ${failed.length} failed, ${skipped.length} skipped)`,
  );
  console.log(lines.join("\n"));
  process.exit(failed.length === 0 ? 0 : 1);
}

out("Experience Engine — Pass 2 manifest verification");
out(`Repository root: ${ROOT}`);
out(`Manifest:        ${MANIFEST}`);

/* ── 1. The manifest itself ─────────────────────────────────────────── */

if (!existsSync(abs(MANIFEST))) {
  record("Pass 2 manifest exists", "FAIL", `${MANIFEST} not found`);
  finish();
}

let manifest;
try {
  manifest = JSON.parse(read(MANIFEST).toString("utf8"));
} catch (error) {
  record("Pass 2 manifest is valid JSON", "FAIL", error.message);
  finish();
}

const files = manifest?.changedFiles?.files;
const phase37 = manifest?.basedOn?.phase37Manifest;
const structureOk =
  Array.isArray(files) &&
  files.length > 0 &&
  files.every(
    (file) =>
      typeof file.path === "string" &&
      // A file removed since the base commit is listed without hashes.
      (file.change === "deleted" ||
        (/^[0-9a-f]{64}$/.test(file.sha256) && /^[0-9a-f]{64}$/.test(file.sha256_lf) && Number.isInteger(file.bytes) && Number.isInteger(file.bytes_lf))),
  ) &&
  typeof phase37?.path === "string" &&
  /^[0-9a-f]{64}$/.test(phase37?.sha256 ?? "");
record("Pass 2 manifest exists", "PASS");
record("Pass 2 manifest has the expected structure", structureOk ? "PASS" : "FAIL", structureOk ? `${files.length} files listed` : "missing or malformed fields");
if (!structureOk) finish();

out(`Manifest id:     ${manifest.manifest}  (created ${manifest.createdAt})`);
out(`Git base commit: ${manifest.basedOn.gitBaseCommit}`);

/* ── 2. Every listed file: existence, size, hashes ──────────────────── */

const rows = files.map((entry) => {
  if (entry.change === "deleted") return { entry, state: existsSync(abs(entry.path)) ? "PRESENT" : "DELETED" };
  if (!existsSync(abs(entry.path))) return { entry, state: "MISSING" };
  const bytes = read(entry.path);
  if (bytes.length === entry.bytes && sha256(bytes) === entry.sha256) return { entry, state: "EXACT" };
  // A checkout may have converted line endings. The content is then verified
  // against the LF-normalized hash and size instead.
  const normalized = toLf(bytes);
  if (normalized.length === entry.bytes_lf && sha256(normalized) === entry.sha256_lf) return { entry, state: "LF" };
  return { entry, state: bytes.length !== entry.bytes && normalized.length !== entry.bytes_lf ? "SIZE+HASH" : "HASH" };
});

const stateLabel = {
  EXACT: "ok       exact SHA-256 and size",
  LF: "ok       SHA-256 and size after CRLF->LF normalization",
  DELETED: "ok       removed, as recorded",
  PRESENT: "FAIL     recorded as removed but the file exists",
  MISSING: "FAIL     file not found",
  HASH: "FAIL     SHA-256 differs",
  "SIZE+HASH": "FAIL     size and SHA-256 differ",
};

out();
out(`FILES (${rows.length})`);
for (const row of rows) out(`  ${stateLabel[row.state].padEnd(54)} ${row.entry.path}`);

const count = (state) => rows.filter((row) => row.state === state).length;
const missing = count("MISSING") + count("PRESENT");
const bad = count("HASH") + count("SIZE+HASH");
const deleted = count("DELETED");

record(
  "Every listed file is present, or absent if recorded as removed",
  missing === 0 ? "PASS" : "FAIL",
  `${rows.length - missing - deleted} present, ${deleted} removed, ${missing} wrong`,
);
record(
  "SHA-256 matches for every listed file",
  missing === 0 && bad === 0 ? "PASS" : "FAIL",
  `${count("EXACT")} exact, ${count("LF")} after LF normalization, ${bad} mismatched`,
);
record(
  "Recorded size matches for every listed file",
  missing === 0 && count("SIZE+HASH") === 0 && bad === 0 ? "PASS" : "FAIL",
  `${count("EXACT")} exact size, ${count("LF")} LF-normalized size`,
);
const declared = manifest.changedFiles.count === rows.length && new Set(files.map((file) => file.path)).size === rows.length;
record("File count is consistent and paths are unique", declared ? "PASS" : "FAIL", `count field ${manifest.changedFiles.count}, entries ${rows.length}`);

/* ── 3. The Phase 37 manifest ───────────────────────────────────────── */

const phase37Exists = existsSync(abs(phase37.path));
record("Phase 37 manifest exists", phase37Exists ? "PASS" : "FAIL", phase37.path);

if (phase37Exists) {
  const bytes = read(phase37.path);
  const exact = sha256(bytes) === phase37.sha256;
  const viaLf = !exact && typeof phase37.sha256_lf === "string" && sha256(toLf(bytes)) === phase37.sha256_lf;
  record(
    "Phase 37 manifest SHA-256 matches the recorded reference",
    exact || viaLf ? "PASS" : "FAIL",
    exact ? "exact" : viaLf ? "after LF normalization" : `expected ${phase37.sha256.slice(0, 16)}…, found ${sha256(bytes).slice(0, 16)}…`,
  );

  // Which Phase 37 entries no longer match must be exactly what Pass 2 recorded.
  let entries;
  try {
    entries = JSON.parse(bytes.toString("utf8")).files;
  } catch {
    entries = null;
  }
  if (Array.isArray(entries)) {
    const base = path.posix.dirname(phase37.path);
    const differing = entries
      .filter((entry) => {
        const relative = `${base}/${entry.path}`;
        if (!existsSync(abs(relative))) return true;
        const current = read(relative);
        return sha256(current) !== entry.sha256 && sha256(toLf(current)) !== entry.sha256;
      })
      .map((entry) => `${base}/${entry.path}`)
      .sort();
    const expected = [...(manifest.coreChange?.phase37EntriesNowDiffering ?? [])].sort();
    const same = JSON.stringify(differing) === JSON.stringify(expected);
    out();
    out(`PHASE 37 ENTRIES (${entries.length}): ${entries.length - differing.length} still match, ${differing.length} differ`);
    for (const file of differing) {
      const byPass2 = (manifest.coreChange?.phase37EntriesChangedByPass2 ?? []).includes(file);
      out(`  differs  ${file}  (${byPass2 ? "changed by Pass 2" : "already differed before Pass 2"})`);
    }
    record("Phase 37 entries that differ are exactly those recorded", same ? "PASS" : "FAIL", same ? `${differing.length} recorded` : `found [${differing.join(", ")}]`);
  } else {
    record("Phase 37 entries that differ are exactly those recorded", "FAIL", "Phase 37 manifest could not be parsed");
  }
}

/* ── 4. The change set: nothing changed outside the manifest ────────── */

function git(args) {
  return execFileSync("git", ["-c", "core.quotepath=off", ...args], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

const CHANGE_SET = "No changed file is missing from the manifest";
const ONLY_CHANGED = "Manifest lists only files that changed";
let gitReady = true;
let gitProblem = "";
try {
  git(["rev-parse", "--is-inside-work-tree"]);
  git(["cat-file", "-e", `${manifest.basedOn.gitBaseCommit}^{commit}`]);
} catch (error) {
  gitReady = false;
  gitProblem = /not a git repository/i.test(String(error.stderr ?? error.message)) ? "not a git repository" : "git is unavailable or the base commit is not in this repository";
}

if (!gitReady) {
  const status = allowNoGit ? "SKIPPED" : "FAIL";
  const hint = allowNoGit ? gitProblem : `${gitProblem}; pass --allow-no-git to verify files only`;
  record(CHANGE_SET, status, hint);
  record(ONLY_CHANGED, status, hint);
} else {
  const split = (text) => text.split("\0").filter(Boolean);
  // Everything that differs from the base commit, committed or not, plus untracked files.
  const changed = new Set([
    ...split(git(["diff", "--name-only", "-z", manifest.basedOn.gitBaseCommit, "--"])),
    ...split(git(["ls-files", "-z", "--others", "--exclude-standard"])),
  ]);
  changed.delete(MANIFEST); // a file cannot contain its own hash
  const listed = new Set(files.map((file) => file.path));
  const unlisted = [...changed].filter((file) => !listed.has(file)).sort();
  const unchanged = [...listed].filter((file) => !changed.has(file)).sort();

  out();
  out(`CHANGE SET since ${manifest.basedOn.gitBaseCommit.slice(0, 10)}: ${changed.size} files (the manifest itself is excluded)`);
  for (const file of unlisted) out(`  not in manifest       ${file}`);
  for (const file of unchanged) out(`  listed but unchanged  ${file}`);

  record(CHANGE_SET, unlisted.length === 0 ? "PASS" : "FAIL", unlisted.length === 0 ? `${changed.size} changed, all listed` : `${unlisted.length} unlisted`);
  record(ONLY_CHANGED, unchanged.length === 0 ? "PASS" : "FAIL", unchanged.length === 0 ? "" : `${unchanged.length} listed but identical to the base commit`);
}

finish();
