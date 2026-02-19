/**
 * Huvudkonfiguration för Vitest.
 * Ställer in testmiljön (jsdom), aktiverar React-plugin,
 * hanterar TypeScript-sökvägar (@/...) och pekar ut setup-filen.
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      exclude: ["src/components/ui", "src/server/db.ts", "src/server/api/root.ts", "src/lib/generated/prisma/internal/class.ts", "src/server/api/trpc.ts", "src/server/better-auth/config.ts"],
    },
  },
});
