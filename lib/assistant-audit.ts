import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const auditInitiators = ["思怡", "魔王"] as const;
export type AuditInitiator = (typeof auditInitiators)[number];
export type AuditRole = "user" | "assistant";
export type AuditOrigin = "live" | "browser-recovery";

export type AssistantAuditRecord = {
  id: string;
  conversationId: string;
  initiator: AuditInitiator;
  role: AuditRole;
  text: string;
  createdAt: string;
  origin: AuditOrigin;
  timeKnown: boolean;
  status?: string;
};

type NewAuditRecord = Omit<AssistantAuditRecord, "id" | "createdAt"> & { id?: string; createdAt?: string };

const auditLimit = 12000;
const storePath = process.env.ASSISTANT_AUDIT_LOG_FILE ?? join(process.cwd(), ".assistant-audit", "conversations.json");
let writes = Promise.resolve();

function cleanText(value: unknown, limit: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

// The assistant never asks for these values. This extra guard keeps an accidental
// phone / ID / card number out of an otherwise private archive as well.
function redactSensitiveText(value: string) {
  return value
    .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, "[已隐藏手机号]")
    .replace(/(?<!\d)\d{17}[\dXx](?![\dA-Za-z])/g, "[已隐藏身份证号]")
    .replace(/(?<!\d)(?:\d[ -]?){15,18}\d(?!\d)/g, "[已隐藏银行卡号]");
}

export function isAuditInitiator(value: unknown): value is AuditInitiator {
  return typeof value === "string" && (auditInitiators as readonly string[]).includes(value);
}

function isAuditRole(value: unknown): value is AuditRole {
  return value === "user" || value === "assistant";
}

function isAuditOrigin(value: unknown): value is AuditOrigin {
  return value === "live" || value === "browser-recovery";
}

function normaliseRecord(value: unknown): AssistantAuditRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<AssistantAuditRecord>;
  if (
    typeof record.id !== "string" ||
    typeof record.conversationId !== "string" ||
    !isAuditInitiator(record.initiator) ||
    !isAuditRole(record.role) ||
    !isAuditOrigin(record.origin) ||
    typeof record.createdAt !== "string" ||
    typeof record.timeKnown !== "boolean"
  ) return null;
  const text = redactSensitiveText(cleanText(record.text, 2400));
  if (!text) return null;
  const status = cleanText(record.status, 260);
  return {
    id: record.id.slice(0, 96),
    conversationId: record.conversationId.slice(0, 96),
    initiator: record.initiator,
    role: record.role,
    text,
    createdAt: record.createdAt,
    origin: record.origin,
    timeKnown: record.timeKnown,
    ...(status ? { status } : {}),
  };
}

async function readRecords() {
  try {
    const content = await readFile(storePath, "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed.map(normaliseRecord).filter((record): record is AssistantAuditRecord => record !== null).slice(-auditLimit) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function saveRecords(records: AssistantAuditRecord[]) {
  await mkdir(dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(records, null, 2), "utf8");
  await rename(temporaryPath, storePath);
}

function withWriteLock<T>(task: () => Promise<T>) {
  const result = writes.then(task, task);
  writes = result.then(() => undefined, () => undefined);
  return result;
}

export async function appendAuditRecords(records: NewAuditRecord[]) {
  const prepared = records.map((record) => normaliseRecord({
    ...record,
    id: record.id ?? randomUUID(),
    createdAt: record.createdAt ?? new Date().toISOString(),
  })).filter((record): record is AssistantAuditRecord => record !== null);
  if (!prepared.length) return 0;

  return withWriteLock(async () => {
    const existing = await readRecords();
    const knownIds = new Set(existing.map((record) => record.id));
    const additions = prepared.filter((record) => !knownIds.has(record.id));
    if (!additions.length) return 0;
    await saveRecords([...existing, ...additions].sort((first, second) => first.createdAt.localeCompare(second.createdAt)).slice(-auditLimit));
    return additions.length;
  });
}

export async function recordLiveConversation(input: {
  conversationId: string;
  initiator: AuditInitiator;
  question: string;
  answer: string;
  status?: string;
}) {
  const createdAt = new Date().toISOString();
  return appendAuditRecords([
    { conversationId: input.conversationId, initiator: input.initiator, role: "user", text: input.question, createdAt, origin: "live", timeKnown: true },
    { conversationId: input.conversationId, initiator: input.initiator, role: "assistant", text: input.answer, createdAt: new Date(Date.now() + 1).toISOString(), origin: "live", timeKnown: true, status: input.status },
  ]);
}

export type RecoveryMessage = { role: AuditRole; text: string; status?: string };

export async function recoverBrowserConversation(input: {
  recoveryId: string;
  initiator: AuditInitiator;
  messages: RecoveryMessage[];
}) {
  const safeRecoveryId = cleanText(input.recoveryId, 80);
  if (!safeRecoveryId) return 0;
  const startedAt = Date.now();
  return appendAuditRecords(input.messages.slice(0, 32).flatMap((message, index) => {
    const text = cleanText(message.text, 2400);
    if (!isAuditRole(message.role) || !text) return [];
    const fingerprint = createHash("sha256").update(`${safeRecoveryId}|${index}|${message.role}|${text}`).digest("hex").slice(0, 32);
    return [{
      id: `recovery-${fingerprint}`,
      conversationId: `recovery-${safeRecoveryId}`,
      initiator: input.initiator,
      role: message.role,
      text,
      createdAt: new Date(startedAt + index).toISOString(),
      origin: "browser-recovery" as const,
      timeKnown: false,
      status: message.status,
    }];
  }));
}

export async function getAssistantAuditRecords() {
  return readRecords();
}
