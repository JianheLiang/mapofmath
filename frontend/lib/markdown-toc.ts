import { slugifyHeading } from "@/lib/slugify";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractMarkdownToc(body: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    const m = /^(#{2,3})\s+(.+)$/.exec(trimmed);
    if (!m) {
      continue;
    }
    const level = m[1].length;
    const text = m[2].replace(/\s+#+\s*$/, "").trim();
    if (!text) {
      continue;
    }
    const id = slugifyHeading(text);
    if (id) {
      items.push({ id, text, level });
    }
  }
  return items;
}
