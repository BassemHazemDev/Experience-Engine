import path from "node:path";
import type { NextConfig } from "next";

// This app is a member of the npm workspace rooted one directory up, and the
// engine packages it uses live in ../01-runtime/packages.
const repoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
};

export default nextConfig;
