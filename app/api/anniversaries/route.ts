import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { isMember, type Member } from "@/lib/members";

export const dynamic = "force-dynamic";

export type SavedAnniversary = {
  id: string;
  date: string;
  title: string;
  line: string;
  createdBy: Member;
  createdAt: string;
  sourcePageId?: string;
};

const storePath = process.env.ANNIVERSARY_FILE ?? join(process.cwd(), ".anniversaries", "items.json");
const itemLimit = 200;
let writes = Promise.resolve();

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function cleanText(value: unknown, limit: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\p{Cc}]+/gu, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

function validDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value + "T12:00:00").getTime());
}

function normaliseItem(value: unknown): SavedAnniversary | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<SavedAnniversary>;
  if (typeof item.id !== "string" || !validDate(item.date) || typeof item.title !== "string" || typeof item.line !== "string" || !isMember(item.createdBy) || typeof item.createdAt !== "string") return null;
  const title = cleanText(item.title, 80);
  const line = cleanText(item.line, 180);
  const sourcePageId = cleanText(item.sourcePageId, 96).replace(/[^a-z0-9-]/gi, "");
  if (!title || !line) return null;
  return { id: item.id.slice(0, 96), date: item.date, title, line, createdBy: item.createdBy, createdAt: item.createdAt, ...(sourcePageId ? { sourcePageId } : {}) };
}

async function readItems() {
  try {
    const values = JSON.parse(await readFile(storePath, "utf8"));
    return Array.isArray(values) ? values.map(normaliseItem).filter((item): item is SavedAnniversary => item !== null).slice(-itemLimit) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function saveItems(items: SavedAnniversary[]) {
  await mkdir(dirname(storePath), { recursive: true });
  const temporaryPath = storePath + "." + randomUUID() + ".tmp";
  await writeFile(temporaryPath, JSON.stringify(items, null, 2), "utf8");
  await rename(temporaryPath, storePath);
}

function withWriteLock<T>(task: () => Promise<T>) {
  const result = writes.then(task, task);
  writes = result.then(() => undefined, () => undefined);
  return result;
}

export async function GET() {
  try {
    const items = await readItems();
    return json({ items: items.sort((first, second) => second.date.localeCompare(first.date)) });
  } catch {
    return json({ error: "纪念柜暂时打不开。" }, 500);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "这次没有收到内容，再试一下。" }, 400);
  }

  const author = body.author;
  const title = cleanText(body.title, 80);
  const line = cleanText(body.line, 180);
  const date = body.date;
  const sourcePageId = cleanText(body.sourcePageId, 96).replace(/[^a-z0-9-]/gi, "");
  if (!isMember(author)) return json({ error: "先选一下你是谁。" }, 400);
  if (!validDate(date)) return json({ error: "先选一个日子。" }, 400);
  if (!title || !line) return json({ error: "写个标题，再留一句话吧。" }, 400);

  try {
    const item = await withWriteLock(async () => {
      const entries = await readItems();
      const next: SavedAnniversary = {
        id: randomUUID(),
        date,
        title,
        line,
        createdBy: author,
        createdAt: new Date().toISOString(),
        ...(sourcePageId ? { sourcePageId } : {}),
      };
      entries.push(next);
      await saveItems(entries.slice(-itemLimit));
      return next;
    });
    return json({ item }, 201);
  } catch {
    return json({ error: "这天没能收好，稍后再试一次。" }, 500);
  }
}
