// server/vite.ts
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";

const viteLogger = createLogger();

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function findProjectRoot() {
  const candidates = [
    process.cwd(),
    path.resolve(moduleDir, ".."),
    path.resolve(moduleDir, "..", ".."),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "package.json"))) {
      return candidate;
    }
  }

  return path.resolve(moduleDir, "..");
}

const projectRoot = findProjectRoot();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: { middlewareMode: true, hmr: { server }, allowedHosts: true },
    appType: "custom",
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
  });

  // middlewares تبع Vite
  app.use(vite.middlewares);

  // fallback للـ HTML بالبيئة التطويرية
  app.use("*", async (req, res, next) => {
    try {
      const file = path.resolve(
        projectRoot,
        "client",
        "index.html"
      );
      const template = await fs.promises.readFile(file, "utf-8");
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // مطابق لإعداد outDir في vite.config.ts
  const candidatePaths = [
    path.resolve(moduleDir, "public"),
    path.resolve(projectRoot, "dist", "public"),
  ];

  const distPath = candidatePaths.find((candidate) => fs.existsSync(candidate));

  if (!distPath) {
    throw new Error(
      `Missing build dir. Looked in: ${candidatePaths.join(", ")}. Run "npm run build" first.`
    );
  }

  app.use(express.static(distPath));

  // SPA fallback
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
