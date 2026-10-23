import type { Config } from "@react-router/dev/config";

// React Router framework configuration. This file must live at the project
// root (next to vite.config.ts) — a copy inside app/ is ignored.
// SSR stays enabled: the built-in default entry.server handles Node streaming,
// so no custom app/entry.server.tsx is needed.
export default {
  ssr: true,
} satisfies Config;