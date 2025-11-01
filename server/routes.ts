import express, { type Express, type Request, type Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import {
  insertCalculationSchema,
  insertProRataSchema,
  insertChatMessageSchema,
} from "@shared/schema";
import { chatHandler } from "./chat";

const feedbackLog: Array<Record<string, unknown>> = [];
const metricsLog: Array<Record<string, unknown>> = [];

export async function registerRoutes(app: Express): Promise<Server> {
  // Calculator Routes
  app.get("/api/calculations", async (_req, res) => {
    try {
      const calculations = await storage.getCalculations();
      res.json(calculations);
    } catch {
      res.status(500).json({ error: "Failed to fetch calculations" });
    }
  });

  app.get("/api/calculations/:id", async (req, res) => {
    try {
      const calculation = await storage.getCalculation(req.params.id);
      if (!calculation)
        return res.status(404).json({ error: "Calculation not found" });
      res.json(calculation);
    } catch {
      res.status(500).json({ error: "Failed to fetch calculation" });
    }
  });

  app.post("/api/calculations", async (req, res) => {
    try {
      const validatedData = insertCalculationSchema.parse(req.body);
      const calculation = await storage.createCalculation(validatedData);
      res.status(201).json(calculation);
    } catch (error) {
      res
        .status(400)
        .json({
          error: (error as Error).message || "Invalid calculation data",
        });
    }
  });

  // Pro-Rata Routes
  app.get("/api/pro-rata", async (_req, res) => {
    try {
      const proRataCalculations = await storage.getProRataCalculations();
      res.json(proRataCalculations);
    } catch {
      res.status(500).json({ error: "Failed to fetch pro-rata calculations" });
    }
  });

  app.get("/api/pro-rata/:id", async (req, res) => {
    try {
      const proRata = await storage.getProRataCalculation(req.params.id);
      if (!proRata)
        return res
          .status(404)
          .json({ error: "Pro-rata calculation not found" });
      res.json(proRata);
    } catch {
      res.status(500).json({ error: "Failed to fetch pro-rata calculation" });
    }
  });

  app.post("/api/pro-rata", async (req, res) => {
    try {
      const validatedData = insertProRataSchema.parse(req.body);
      const proRata = await storage.createProRataCalculation(validatedData);
      res.status(201).json(proRata);
    } catch (error) {
      res
        .status(400)
        .json({ error: (error as Error).message || "Invalid pro-rata data" });
    }
  });

  // Chat history (storage only)
  app.get("/api/messages", async (_req, res) => {
    try {
      const messages = await storage.getChatMessages();
      res.json(messages);
    } catch {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      res
        .status(400)
        .json({ error: (error as Error).message || "Invalid message data" });
    }
  });

  // Real AI chat (OpenAI)
  app.post("/api/chat", express.json(), chatHandler);

  app.post("/api/feedback", express.json(), (req, res) => {
    feedbackLog.push({ ...req.body, receivedAt: Date.now() });
    res.status(204).end();
  });

  app.post("/api/metrics", express.json(), (req, res) => {
    metricsLog.push({ ...req.body, receivedAt: Date.now() });
    res.status(204).end();
  });

  // Document Routes (DB/Memory)
  app.get("/api/documents", async (req, res) => {
    try {
      const q = (req.query.q as string | undefined)?.trim();
      const docs = q
        ? await storage.searchDocuments(q)
        : await storage.getDocuments();
      res.json(docs);
    } catch {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc) return res.status(404).json({ error: "Document not found" });
      res.json(doc);
    } catch {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // /api/docs → serve list from api/docs.ts (Google Docs links)
  app.get("/api/docs", async (req: Request, res: Response) => {
    const mod = await import("../api/docs");
    return mod.default(req, res);
  });

  const { createServer } = await import("http");
  const httpServer = createServer(app);
  return httpServer;
}
