import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async ({ command }) => {
  const plugins = [react(), runtimeErrorOverlay()];

  if (command === "serve" && process.env.REPL_ID) {
    const [{ cartographer }, { devBanner }] = await Promise.all([
      import("@replit/vite-plugin-cartographer"),
      import("@replit/vite-plugin-dev-banner"),
    ]);
    plugins.push(cartographer(), devBanner());
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(moduleDir, "client", "src"),
        "@shared": path.resolve(moduleDir, "shared"),
        "@assets": path.resolve(moduleDir, "attached_assets"),
      },
    },
    root: path.resolve(moduleDir, "client"),
    build: {
      outDir: path.resolve(moduleDir, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
