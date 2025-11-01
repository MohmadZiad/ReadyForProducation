import path from "path";
import fs from "fs/promises";

export interface DocItem {
  id: string;
  title: string;
  url: string;
  tags: string[];
}

export async function readDocs(): Promise<DocItem[]> {
  const p = path.resolve(process.cwd(), "shared/docs.json");
  const raw = await fs.readFile(p, "utf-8");
  const docs = JSON.parse(raw) as DocItem[];
  return docs;
}
