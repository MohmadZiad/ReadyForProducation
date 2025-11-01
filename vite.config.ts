import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cartographer } from "@replit/vite-plugin-cartographer";
import { devBanner } from "@replit/vite-plugin-dev-banner";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import postcssConfig from "./postcss.config.js";
import type { AcceptedPlugin, ProcessOptions } from "postcss";

const originalConsoleWarn = console.warn.bind(console);
console.warn = (message?: unknown, ...optionalParams: unknown[]) => {
  if (
    typeof message === "string" &&
    message.includes(
      "A PostCSS plugin did not pass the `from` option to `postcss.parse`"
    )
  ) {
    return;
  }

  originalConsoleWarn(message, ...optionalParams);
};

export default defineConfig(() => {
  const plugins = [react(), runtimeErrorOverlay()];

  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    plugins.push(cartographer(), devBanner());
  }

  const postcssPlugins = postcssConfig.plugins as AcceptedPlugin[];
  const postcssOptions: { plugins: AcceptedPlugin[]; options: ProcessOptions } = {
    plugins: postcssPlugins,
    options: {
      from: path.resolve(import.meta.dirname, "client", "src", "index.css"),
    },
  };

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    css: {
      url: false,
      postcss: postcssOptions,
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
      open: true,
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
    },
  };
});
