import path from "node:path";
import type { NextConfig } from "next";

// This example lives in an npm workspace; the workspace root is two levels up.
const nextConfig: NextConfig = {
  turbopack: { root: path.join(__dirname, "..", "..") },
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
};

export default nextConfig;
