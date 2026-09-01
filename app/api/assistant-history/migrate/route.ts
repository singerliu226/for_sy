import { isAuditInitiator, recoverBrowserConversation, type RecoveryMessage } from "@/lib/assistant-audit";

function response(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function validRecoveryId(value: unknown) {
  return typeof value === "string" && /^[a-z0-9-]{16,80}$/i.test(value);
}

function parseMessages(value: unknown): RecoveryMessage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Partial<RecoveryMessage>;
    if ((record.role !== "user" && record.role !== "assistant") || typeof record.text !== "string") return [];
    return [{ role: record.role, text: record.text, ...(typeof record.status === "string" ? { status: record.status } : {}) }];
  }).slice(0, 32);
}

export async function POST(request: Request) {
  let body: { recoveryId?: unknown; initiator?: unknown; messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return response({ error: "旧记录没有被正确读到。" }, 400);
  }

  if (!validRecoveryId(body.recoveryId) || !isAuditInitiator(body.initiator)) return response({ error: "恢复信息不完整。" }, 400);
  const messages = parseMessages(body.messages);
  if (!messages.length) return response({ imported: 0 });

  try {
    const imported = await recoverBrowserConversation({ recoveryId: body.recoveryId, initiator: body.initiator, messages });
    return response({ imported });
  } catch {
    return response({ error: "旧记录暂时没有保存下来。" }, 500);
  }
}
