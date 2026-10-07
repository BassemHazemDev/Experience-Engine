import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
    // The engine packages are linked from ../01-runtime; keep them resolving
    // `react` from this app's node_modules.
    preserveSymlinks: true,
  },
  esbuild: { jsx: "automatic" },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    server: { deps: { inline: [/@experience-engine/] } },
  },
});
