import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const projectRoot = process.cwd();
const clientRoot = path.resolve(projectRoot, "client");

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
        "@": path.resolve(clientRoot, "src"),
        "@shared": path.resolve(projectRoot, "shared"),
        "@assets": path.resolve(projectRoot, "attached_assets"),
      },
    },
    root: clientRoot,
    build: {
      outDir: path.resolve(projectRoot, "dist/public"),
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
