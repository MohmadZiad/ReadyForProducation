import type { Request, Response } from "express";
import { readDocs } from "./docs";

// صفحات الموقع الأساسية (حدث حسب مساراتك الفعلية)
const SITE_ROUTES = [
  { path: "/", title: "Home" },
  { path: "/calculator", title: "Calculator" },
  { path: "/pro-rata", title: "Pro-Rata Calculator" },
  { path: "/assistant", title: "Assistant" },
  { path: "/documentation", title: "Documentation" },
];

export async function chatHandler(req: Request, res: Response) {
  try {
    const { messages } = req.body as {
      messages: { role: string; content: string }[];
    };
    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    // Docs (Google Docs) from /shared/docs.json via server/docs.ts
    const docs = await readDocs();

    const navContext = {
      routes: SITE_ROUTES,
      // نرسل للموديل عناوين وروابط الجوجل دوكس فقط
      docs: docs.map((d) => ({
        id: d.id,
        title: d.title,
        url: d.url,
        tags: d.tags,
      })),
    };

    const system = {
      role: "system",
      content: `You are the helpful assistant for the OrangeCompany website.

NAVIGATION:
- If the user asks "where/how" to do something in the site, reply briefly AND include a direct internal link using one of these routes:
${SITE_ROUTES.map((r) => `• ${r.title}: ${r.path}`).join("\n")}

DOCUMENTS:
- If the user asks for a document/policy/offer, select the most relevant doc from the provided list and return the direct Google Docs link.
- Always keep the language consistent with the user's input (Arabic ↔ English).
- Be concise and actionable.`,
    };

    const navJson = {
      role: "system",
      content: `NAV_CONTEXT_JSON:\n${JSON.stringify(navContext)}`,
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [system, navJson, ...messages],
      }),
    });

    const data = await r.json();
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "chat error" });
  }
}
