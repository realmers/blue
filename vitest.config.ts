/**
 * 
 * Huvudkonfiguration för Vitest.
 * Ställer in testmiljön (jsdom), aktiverar React-plugin,
 * hanterar TypeScript-sökvägar (@/...) och pekar ut setup-filen.
 * 
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
      exclude: [
        "src/components/ui/badge.tsx",
        "src/components/ui/button.tsx",
        "src/components/ui/card.tsx",
        "src/components/ui/field.tsx",
        "src/components/ui/footer.tsx",
        "src/components/ui/input.tsx",
        "src/components/ui/label.tsx",
        "src/components/ui/navigation-menu.tsx",
        "src/components/ui/select.tsx",
        "src/components/ui/separator.tsx",
        "src/components/ui/table.tsx",
      ],
    },
  },
});
