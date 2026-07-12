import { defineConfig } from "tsup";

// tsup bundles TS -> JS (ESM) + d.ts. It honors tsconfig paths via esbuild.
// Dev uses tsx (runs TS directly, no build needed). This is the production build.
export default defineConfig({
  entry: ["src/app.ts", "src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  dts: true,
  sourcemap: true,
  clean: true,
  shims: false,
  splitting: true,
});
