import express, { type Express, type Request, type Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import {
  insertCalculationSchema,
  insertProRataSchema,
  insertChatMessageSchema,
} from "@shared/schema";
import { products, addons } from "@shared/config";
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

  app.get("/api/pro-rata/config", (_req, res) => {
    res.json({ products, addons });
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

  app.post("/api/polish", async (req, res) => {
    try {
      const { lang, notes, subject, body } = (req.body ?? {}) as {
        lang?: string;
        notes?: string;
        subject?: string;
        body?: string;
      };

      if (lang !== "ar" && lang !== "en") {
        return res.status(400).json({ error: "invalid_language" });
      }

      const safeNotes = typeof notes === "string" ? notes : "";
      const safeSubject = typeof subject === "string" ? subject : "";
      const safeBody = typeof body === "string" ? body : "";

      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        return res.json({ subject: safeSubject, body: safeBody });
      }

      const tone =
        lang === "ar"
          ? "اكتب بالعربية الفصحى المهذّبة"
          : "Write in polite and clear English";

      const systemPrompt =
        "You rewrite customer support emails for Orange Jordan. " +
        "Always preserve numbers, account IDs, and factual details. " +
        "Structure the body as greeting, short summary, bullet list, and closing. " +
        "Respond strictly with JSON containing keys 'subject' and 'body'.";

      const userPrompt = `${tone}.\nNOTES:\n${safeNotes}\nCURRENT_SUBJECT: ${safeSubject}\nCURRENT_BODY:\n${safeBody}`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || "polish_failed");
      }

      const content = data?.choices?.[0]?.message?.content;
      let polishedSubject = safeSubject;
      let polishedBody = safeBody;

      if (typeof content === "string") {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (typeof parsed.subject === "string") {
              polishedSubject = parsed.subject;
            }
            if (typeof parsed.body === "string") {
              polishedBody = parsed.body;
            }
          } catch (error) {
            console.warn("polish parse error", error);
          }
        }
      }

      return res.json({ subject: polishedSubject, body: polishedBody });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message ?? "polish_failed" });
    }
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
