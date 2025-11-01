export type DocItem = {
  id: string;
  title: string;
  url: string;
  tags: ("ar" | "en")[];
};

import { resolveApiUrl } from "./apiBase";

async function fetchJson(url: string) {
  const r = await fetch(resolveApiUrl(url), { cache: "no-store" });
  if (!r.ok) throw new Error(`docs fetch failed: ${r.status}`);
  return r.json();
}

/** يحاول /api/docs أولاً (قائمة Google Docs)، ولو فشل يرجع /api/documents (المخزّنة داخليًا) */
export async function fetchDocs(): Promise<DocItem[]> {
  try {
    const a = await fetchJson("/api/docs");
    return (a.docs ?? []) as DocItem[];
  } catch {
    const b = await fetchJson("/api/documents");
    return (b.docs ?? b) as DocItem[];
  }
}
