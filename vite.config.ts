import { defineConfig, loadEnv } from "vite";
import { reactRouter } from "@react-router/dev/vite";

export default defineConfig(({ mode }) => {
  const isTest = mode === "test";
  const plugins = isTest ? [] : [reactRouter()];

  return {
    plugins,
    // @mui/icons-material v9's ESM build imports '@mui/material/utils' as a
    // directory import, which Node's native ESM resolver rejects outright
    // (ERR_UNSUPPORTED_DIR_IMPORT) because @mui/material publishes no exports
    // map for that subpath. When the SSR module runner externalizes these
    // packages, resolution is handed to Node at runtime and fails with
    // "Directory import ... is not supported". Bundling the whole MUI +
    // Emotion chain keeps every import inside Vite's resolver (which handles
    // directory imports via each package's `main`/`module` fields) instead.
    // The chain must be inlined together: @mui/material depends on CJS
    // packages like @mui/utils, and mixing inlined ESM with externalized CJS
    // breaks default-export interop ("(0, __vite_ssr_import_1__.default) is
    // not a function" in createPalette.js).
    ssr: {
      noExternal: ["@mui/*", "@emotion/*"],
    },
    // Pre-bundle the heavy MUI/Emotion chain so the dev server doesn't
    // re-process hundreds of modules on every file change. This is the main
    // reason hot reloading and page reloads are slow.
    optimizeDeps: {
      include: [
        "@mui/material",
        "@mui/icons-material",
        "@mui/system",
        "@mui/utils",
        "@emotion/react",
        "@emotion/styled",
        "@emotion/is-prop-valid",
      ],
    },
    server: {
      hmr: {
        protocol: "ws",
        host: "localhost",
      },
      // Stop the file watcher from crawling large, irrelevant directories so
      // it doesn't choke on them or trigger spurious rebuilds on every change.
      watch: {
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/dist/**",
          "**/build/**",
          "**/.react-router/**",
          "**/transcripts/**",
        ],
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./vitest.setup.ts",
      include: ["app/**/*.{test,spec}.{ts,tsx}"],
    },
  };
});