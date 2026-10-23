import { defineConfig, loadEnv } from "vite";
import { reactRouter } from "@react-router/dev/vite";

export default defineConfig(({ mode }) => {
  const isTest = mode === "test";
  const plugins = isTest ? [] : [reactRouter()];

  return {
    plugins,
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./vitest.setup.ts",
      include: ["app/**/*.{test,spec}.{ts,tsx}"],
    },
  };
});