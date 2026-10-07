#!/usr/bin/env node
// Refreshes the file list in 01-runtime/manifest-pass2.json so that it matches
// the working tree: every file that differs from the manifest's base commit is
// listed with its current hashes.
//
// It rewrites only the parts that are derived from the files:
//   changedFiles, updatedAt, revisions, and the Phase 37 comparison lists.
// Everything else in the manifest (research-claims statement, recorded results,
// scoped limitations) is kept as it is. It never touches 01-runtime/manifest.json.
//
// Usage, from anywhere inside the repository:
//   node 01-runtime/scripts/update-manifest-pass2.mjs --note "what changed and why"
//
// Then check the result:
//   node 01-runtime/scripts/verify-manifest-pass2.mjs
//
// Requires Node 18 or newer and git. Uses only Node built-ins.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const MANIFEST = "01-runtime/manifest-pass2.json";

const noteIndex = process.argv.indexOf("--note");
const note = noteIndex > -1 ? process.argv[noteIndex + 1] : undefined;
if (!note) {
  console.error('A note is required: --note "what changed and why"');
  process.exit(1);
}

const abs = (relative) => path.join(ROOT, ...relative.split("/"));
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
const toLf = (buffer) => Buffer.from(buffer.toString("latin1").replace(/\r\n/g, "\n"), "latin1");
const git = (args) => execFileSync("git", ["-c", "core.quotepath=off", ...args], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const split = (text) => text.split("\0").filter(Boolean);

const manifest = JSON.parse(readFileSync(abs(MANIFEST), "utf8"));
const base = manifest.basedOn.gitBaseCommit;
let inBase;
let changed;
try {
  git(["cat-file", "-e", `${base}^{commit}`]);
  inBase = new Set(split(git(["ls-tree", "-r", "-z", "--name-only", base])));
  changed = [...new Set([...split(git(["diff", "--name-only", "-z", base, "--"])), ...split(git(["ls-files", "-z", "--others", "--exclude-standard"]))])]
    .filter((file) => file !== MANIFEST)
    .sort();
} catch {
  // When the base commit is not present in this repository (e.g. shallow clone or squashed release),
  // retain existing manifest files and incorporate any modified/untracked files from the working tree.
  const existingFiles = manifest.changedFiles?.files ?? [];
  const existingMap = new Map(existingFiles.map((file) => [file.path, file.change]));
  inBase = {
    has(file) {
      return existingMap.get(file) === "modified";
    },
  };
  changed = [...new Set([...existingFiles.map((file) => file.path), ...split(git(["ls-files", "-z", "--modified", "--others", "--exclude-standard"]))])]
    .filter((file) => file !== MANIFEST)
    .sort();
}

const files = changed.map((file) => {
  if (!existsSync(abs(file))) return { path: file, change: "deleted" };
  const bytes = readFileSync(abs(file));
  const normalized = toLf(bytes);
  const text = bytes.toString("latin1");
  const crlf = (text.match(/\r\n/g) || []).length;
  const lf = (text.match(/\n/g) || []).length;
  return {
    path: file,
    sha256: sha256(bytes),
    sha256_lf: sha256(normalized),
    bytes: bytes.length,
    bytes_lf: normalized.length,
    eol: crlf === 0 ? "lf" : crlf === lf ? "crlf" : "mixed",
    change: inBase.has(file) ? "modified" : "added",
  };
});

// Which Phase 37 entries no longer match, and whether a listed change explains it.
const phase37Path = manifest.basedOn.phase37Manifest.path;
const phase37Dir = path.posix.dirname(phase37Path);
const phase37 = JSON.parse(readFileSync(abs(phase37Path), "utf8"));
const differing = phase37.files
  .map((entry) => ({ file: `${phase37Dir}/${entry.path}`, entry }))
  .filter(({ file, entry }) => {
    if (!existsSync(abs(file))) return true;
    const bytes = readFileSync(abs(file));
    return sha256(bytes) !== entry.sha256 && sha256(toLf(bytes)) !== entry.sha256;
  })
  .map(({ file }) => file);
const listed = new Set(changed);

const count = (kind) => files.filter((file) => file.change === kind).length;
manifest.updatedAt = new Date().toISOString();
manifest.revisions = [...(manifest.revisions ?? []), { at: manifest.updatedAt, files: files.length, note }];
manifest.changedFiles = { count: files.length, modified: count("modified"), added: count("added"), deleted: count("deleted"), files };
manifest.coreChange = {
  ...manifest.coreChange,
  phase37EntriesNowDiffering: differing,
  phase37EntriesChangedByPass2: differing.filter((file) => listed.has(file)),
  phase37EntriesAlreadyDifferingBeforePass2: {
    ...manifest.coreChange?.phase37EntriesAlreadyDifferingBeforePass2,
    files: differing.filter((file) => !listed.has(file)),
  },
};

writeFileSync(abs(MANIFEST), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Updated ${MANIFEST}: ${files.length} files (${count("modified")} modified, ${count("added")} added, ${count("deleted")} deleted) since ${base.slice(0, 10)}.`);
console.log("Now run: node 01-runtime/scripts/verify-manifest-pass2.mjs");
