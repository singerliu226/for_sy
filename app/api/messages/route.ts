import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const dynamic = "force-dynamic";

type BoardMessage = {
  id: string;
  author: "思怡";
  body: string;
  createdAt: string;
};

const MESSAGE_LIMIT = 180;
const MESSAGE_LENGTH_LIMIT = 280;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const storePath = process.env.MESSAGE_BOARD_FILE ?? join(process.cwd(), ".message-board", "messages.json");
const requestBuckets = new Map<string, number[]>();
let writes = Promise.resolve();

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function clientAddress(request: Request) {
  const realAddress = request.headers.get("x-real-ip");
  if (realAddress) return realAddress.trim();
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function rateLimited(address: string) {
  const now = Date.now();
  const recent = (requestBuckets.get(address) ?? []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    requestBuckets.set(address, recent);
    return true;
  }
  requestBuckets.set(address, [...recent, now]);
  return false;
}

function isBoardMessage(value: unknown): value is BoardMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<BoardMessage>;
  return typeof message.id === "string"
    && message.author === "思怡"
    && typeof message.body === "string"
    && typeof message.createdAt === "string";
}

async function readMessages() {
  try {
    const content = await readFile(storePath, "utf8");
    const value = JSON.parse(content);
    return Array.isArray(value) ? value.filter(isBoardMessage).slice(-MESSAGE_LIMIT) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function saveMessages(messages: BoardMessage[]) {
  await mkdir(dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(messages, null, 2), "utf8");
  await rename(temporaryPath, storePath);
}

function withWriteLock<T>(task: () => Promise<T>) {
  const result = writes.then(task, task);
  writes = result.then(() => undefined, () => undefined);
  return result;
}

function cleanMessage(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n?/g, "\n").trim();
}

export async function GET() {
  try {
    const messages = await readMessages();
    return json({ messages: messages.reverse() });
  } catch {
    return json({ error: "留言板暂时打不开，过一会儿再试试。" }, 500);
  }
}

export async function POST(request: Request) {
  const address = clientAddress(request);
  if (rateLimited(address)) return json({ error: "这一会儿已经写得很多啦，过十分钟再留一条。" }, 429);

  let body: { message?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "这句话没有被好好收到，再发一次试试。" }, 400);
  }

  // A hidden field gives basic bot resistance without adding friction for 思怡.
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true });

  const message = cleanMessage(body.message);
  if (!message) return json({ error: "先写一句想说的话吧。" }, 400);
  if (message.length > MESSAGE_LENGTH_LIMIT) return json({ error: `这一条最多 ${MESSAGE_LENGTH_LIMIT} 个字。` }, 400);

  const entry: BoardMessage = {
    id: randomUUID(),
    author: "思怡",
    body: message,
    createdAt: new Date().toISOString(),
  };

  try {
    await withWriteLock(async () => {
      const messages = await readMessages();
      messages.push(entry);
      await saveMessages(messages.slice(-MESSAGE_LIMIT));
    });
    return json({ message: entry }, 201);
  } catch {
    return json({ error: "这次没能留住，稍后再试一次。" }, 500);
  }
}
