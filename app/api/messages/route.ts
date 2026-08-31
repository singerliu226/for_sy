import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const dynamic = "force-dynamic";

type Person = "思怡" | "魔王";

type Attachment = {
  fileName: string;
  mimeType: string;
};

type BoardMessage = {
  id: string;
  author: Person;
  recipient: Person;
  replyToId?: string;
  body: string;
  createdAt: string;
  image?: Attachment;
  audio?: Attachment;
};

type UploadedFile = {
  name: string;
  size: number;
  type: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

type ValidatedUpload = {
  file: UploadedFile;
  extension: string;
  mimeType: string;
};

const MESSAGE_LIMIT = 180;
const MESSAGE_LENGTH_LIMIT = 280;
const messageIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const IMAGE_SIZE_LIMIT = 6 * 1024 * 1024;
const AUDIO_SIZE_LIMIT = 12 * 1024 * 1024;
const storePath = process.env.MESSAGE_BOARD_FILE ?? join(process.cwd(), ".message-board", "messages.json");
const uploadsDirectory = join(dirname(storePath), "uploads");
const requestBuckets = new Map<string, number[]>();
const imageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
const audioTypes = new Map([
  ["audio/webm", "webm"],
  ["audio/mp4", "m4a"],
  ["audio/mpeg", "mp3"],
  ["audio/wav", "wav"],
  ["audio/x-wav", "wav"],
  ["audio/ogg", "ogg"],
]);
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

function isPerson(value: unknown): value is Person {
  return value === "思怡" || value === "魔王";
}

function isAttachment(value: unknown): value is Attachment {
  if (!value || typeof value !== "object") return false;
  const attachment = value as Partial<Attachment>;
  return typeof attachment.fileName === "string" && typeof attachment.mimeType === "string";
}

function normaliseMessage(value: unknown): BoardMessage | null {
  if (!value || typeof value !== "object") return null;
  const message = value as Partial<BoardMessage>;
  if (typeof message.id !== "string" || !isPerson(message.author) || typeof message.body !== "string" || typeof message.createdAt !== "string") return null;
  if (message.image !== undefined && !isAttachment(message.image)) return null;
  if (message.audio !== undefined && !isAttachment(message.audio)) return null;

  // Messages written before the two-way board existed were all for 魔王.
  return {
    id: message.id,
    author: message.author,
    recipient: isPerson(message.recipient) ? message.recipient : "魔王",
    ...(typeof message.replyToId === "string" && messageIdPattern.test(message.replyToId) ? { replyToId: message.replyToId } : {}),
    body: message.body,
    createdAt: message.createdAt,
    ...(message.image ? { image: message.image } : {}),
    ...(message.audio ? { audio: message.audio } : {}),
  };
}

async function readMessages() {
  try {
    const content = await readFile(storePath, "utf8");
    const value = JSON.parse(content);
    return Array.isArray(value) ? value.map(normaliseMessage).filter((message): message is BoardMessage => message !== null).slice(-MESSAGE_LIMIT) : [];
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

function asUpload(value: FormDataEntryValue | null): UploadedFile | null {
  if (!value || typeof value === "string") return null;
  return value as unknown as UploadedFile;
}

function normaliseMimeType(type: string) {
  return type.toLowerCase().split(";", 1)[0].trim();
}

function validateUpload(file: UploadedFile | null, kind: "image" | "audio"): ValidatedUpload | null {
  if (!file || !file.size) return null;
  const allowedTypes = kind === "image" ? imageTypes : audioTypes;
  const sizeLimit = kind === "image" ? IMAGE_SIZE_LIMIT : AUDIO_SIZE_LIMIT;
  const mimeType = normaliseMimeType(file.type);
  const extension = allowedTypes.get(mimeType);

  if (!extension) throw new Error(kind === "image" ? "图片请用 JPG、PNG、WebP 或 GIF。" : "语音请用 WebM、M4A、MP3、WAV 或 OGG。");
  if (file.size > sizeLimit) throw new Error(kind === "image" ? "图片请控制在 6MB 以内。" : "语音请控制在 12MB 以内。");

  return { file, extension, mimeType };
}

async function saveUpload(upload: ValidatedUpload) {
  await mkdir(uploadsDirectory, { recursive: true });
  const attachment: Attachment = {
    fileName: `${randomUUID()}.${upload.extension}`,
    mimeType: upload.mimeType,
  };
  await writeFile(join(uploadsDirectory, attachment.fileName), Buffer.from(await upload.file.arrayBuffer()));
  return attachment;
}

export async function GET(request: Request) {
  const requestedRecipient = new URL(request.url).searchParams.get("recipient");
  if (requestedRecipient && !isPerson(requestedRecipient)) return json({ error: "收件人不对。" }, 400);

  try {
    const messages = await readMessages();
    const visibleMessages = requestedRecipient ? messages.filter((message) => message.recipient === requestedRecipient) : messages;
    return json({ messages: visibleMessages.reverse() });
  } catch {
    return json({ error: "留言板暂时打不开，过一会儿再试试。" }, 500);
  }
}

export async function POST(request: Request) {
  const address = clientAddress(request);
  if (rateLimited(address)) return json({ error: "这一会儿已经写得很多啦，过十分钟再留一条。" }, 429);

  let message = "";
  let website = "";
  let requestedAuthor: unknown = "思怡";
  let replyToId = "";
  let imageFile: UploadedFile | null = null;
  let audioFile: UploadedFile | null = null;

  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      message = cleanMessage(form.get("message"));
      website = typeof form.get("website") === "string" ? String(form.get("website")) : "";
      requestedAuthor = form.get("author") ?? "思怡";
      replyToId = typeof form.get("replyToId") === "string" ? String(form.get("replyToId")) : "";
      imageFile = asUpload(form.get("image"));
      audioFile = asUpload(form.get("audio"));
    } else {
      const body = await request.json() as { message?: unknown; website?: unknown; author?: unknown; replyToId?: unknown };
      message = cleanMessage(body.message);
      website = typeof body.website === "string" ? body.website : "";
      requestedAuthor = body.author ?? "思怡";
      replyToId = typeof body.replyToId === "string" ? body.replyToId : "";
    }
  } catch {
    return json({ error: "这次没能好好收到，再发一次试试。" }, 400);
  }

  if (website.trim()) return json({ ok: true });
  if (!isPerson(requestedAuthor)) return json({ error: "写信的人不对。" }, 400);
  if (replyToId && !messageIdPattern.test(replyToId)) return json({ error: "要回复的留言不见了，刷新后再试试。" }, 400);
  if (message.length > MESSAGE_LENGTH_LIMIT) return json({ error: `这一条最多 ${MESSAGE_LENGTH_LIMIT} 个字。` }, 400);

  let image: ValidatedUpload | null;
  let audio: ValidatedUpload | null;
  try {
    image = validateUpload(imageFile, "image");
    audio = validateUpload(audioFile, "audio");
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "附件没能上传。" }, 400);
  }

  if (!message && !image && !audio) return json({ error: "写句话，或选一张图片、一段语音再发吧。" }, 400);

  try {
    const entry = await withWriteLock(async () => {
      const next: BoardMessage = {
        id: randomUUID(),
        author: requestedAuthor,
        recipient: requestedAuthor === "魔王" ? "思怡" : "魔王",
        body: message,
        createdAt: new Date().toISOString(),
      };
      if (replyToId) {
        const messages = await readMessages();
        if (!messages.some((messageItem) => messageItem.id === replyToId)) throw new Error("要回复的留言不见了，刷新后再试试。");
        next.replyToId = replyToId;
        messages.push(next);
        if (image) next.image = await saveUpload(image);
        if (audio) next.audio = await saveUpload(audio);
        await saveMessages(messages.slice(-MESSAGE_LIMIT));
        return next;
      }
      if (image) next.image = await saveUpload(image);
      if (audio) next.audio = await saveUpload(audio);

      const messages = await readMessages();
      messages.push(next);
      await saveMessages(messages.slice(-MESSAGE_LIMIT));
      return next;
    });
    return json({ message: entry }, 201);
  } catch {
    return json({ error: "这次没能留住，稍后再试一次。" }, 500);
  }
}
