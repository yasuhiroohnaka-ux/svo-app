import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// vite.config.ts は Cloudflare 向けビルド用なので、テストはこちらの設定で動かす
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**", ".next/**", "design-drafts/**"],
    environment: "node",
  },
});
