import { randomUUID } from "node:crypto";
import { deleteAssistantConversation, getRecentAssistantConversation, getRecentAssistantMemory, recordLiveConversation, type AuditInitiator } from "@/lib/assistant-audit";
import { requireMember } from "@/lib/auth";
import { otherMember } from "@/lib/members";

type HistoryItem = { role: "user" | "assistant"; text: string };
type ChatBody = { message?: unknown; conversationId?: unknown };
type ChatReply = { answer: string; relayDraft?: string; saved: boolean; memoryAvailable: boolean };

const requestBuckets = new Map<string, number[]>();
const requestWindowMs = 10 * 60 * 1000;
const requestLimit = 12;

function helperInstructions(initiator: AuditInitiator) {
  return [
    "你是小魔丸，是两个人的小助手。小魔王是思怡；大魔王是刘唱。",
    `现在正在和你说话的是${initiator}。记住这个身份，不要再问“你是谁”。`,
    "说人话，像一个熟悉她们、愿意认真听的人。不要客服腔、心理咨询腔、模板腔，也不要夸张卖萌。",
    "可以帮忙讲题、理清一件事、回答生活问题，也可以听她吐槽或难过。心事先接住，再慢慢问她现在最想怎么办；别急着讲大道理。",
    "题目或学习问题：说清楚卡在哪一步，给下一步；不知道题目时请让她补充题目或条件，不要硬猜。",
    "涉及当日营业、路线、天气、价格、政策或活动等会变的信息，先用网页搜索；没有查准就坦白说没查准，别编具体信息。",
    "如果用户想让你给另一位传话，提醒她必须先在页面里确认文字，不能说已经发出去了。",
    "回答短一点，先说最要紧的。不要用星号、Markdown 表格、来源说明或免责声明。",
    "不要索取或复述身份证号、银行卡号、住址、精确实时位置等敏感信息。",
  ].join("\n");
}

function clientAddress(request: Request) {
  const realAddress = request.headers.get("x-real-ip");
  if (realAddress) return realAddress.trim();
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(address: string) {
  const now = Date.now();
  const recent = (requestBuckets.get(address) ?? []).filter((timestamp) => now - timestamp < requestWindowMs);
  if (recent.length >= requestLimit) {
    requestBuckets.set(address, recent);
    return true;
  }
  requestBuckets.set(address, [...recent, now]);
  return false;
}

function extractText(response: unknown) {
  if (!response || typeof response !== "object") return "";
  const record = response as { output_text?: unknown; output?: unknown };
  if (typeof record.output_text === "string" && record.output_text.trim()) return record.output_text.trim();
  if (!Array.isArray(record.output)) return "";
  return record.output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const message = item as { type?: unknown; content?: unknown };
      if (message.type !== "message" || !Array.isArray(message.content)) return [];
      return message.content.flatMap((part) => {
        if (!part || typeof part !== "object") return [];
        const content = part as { type?: unknown; text?: unknown };
        return content.type === "output_text" && typeof content.text === "string" ? [content.text] : [];
      });
    })
    .join("\n")
    .trim();
}

function withoutUrls(answer: string) {
  return answer.replace(/https?:\/\/[^\s)\]}>，。；、]+/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function conversationId(value: unknown) {
  return typeof value === "string" && /^[a-z0-9-]{16,96}$/i.test(value) ? value : randomUUID();
}

function relayDraft(message: string, initiator: AuditInitiator) {
  const match = message.match(/^(?:小魔丸[，,：:\s]*)?(?:(?:你)?(?:能不能|可不可以|可以|能)[，,：:\s]*)?(?:帮我|替我|麻烦你)?[，,：:\s]*(?:告诉|转告|传话给|发消息给|跟|对)(大魔王|小魔王|刘唱|思怡)[，,：:\s]*(?:说[，,：:\s]*)?([\s\S]+)$/);
  if (!match) return null;
  const target = match[1] === "刘唱" ? "大魔王" : match[1] === "思怡" ? "小魔王" : match[1];
  if (target !== otherMember(initiator)) return null;
  const draft = match[2].replace(/^[“"' ]+|[”"' ]+$/g, "").trim();
  return draft && draft !== "…" && draft !== "..." ? draft.slice(0, 280) : null;
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const access = requireMember(request);
  if ("response" in access) return access.response;
  try {
    return json({ messages: await getRecentAssistantConversation(access.member) });
  } catch {
    return json({ error: "聊天记录暂时打不开，刷新后再试试。" }, 503);
  }
}

export async function DELETE(request: Request) {
  const access = requireMember(request);
  if ("response" in access) return access.response;
  try {
    await deleteAssistantConversation(access.member);
    return json({ ok: true });
  } catch {
    return json({ error: "这次没删掉聊天记录，请再试一次。" }, 503);
  }
}

export async function POST(request: Request) {
  const access = requireMember(request);
  if ("response" in access) return access.response;
  const address = `${access.member}:${clientAddress(request)}`;
  if (isRateLimited(address)) return json({ error: "这会儿聊得有点多，十分钟后再来找我吧。" }, 429);

  let body: ChatBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: "这句话没有被好好收到，再发一次试试。" }, 400);
  }

  const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";
  if (!message) return json({ error: "先写下一句想问小魔丸的话吧。" }, 400);
  const initiator: AuditInitiator = access.member;
  let history: HistoryItem[] = [];
  let memoryAvailable = true;
  try {
    history = await getRecentAssistantMemory(initiator);
  } catch {
    memoryAvailable = false;
  }
  const sessionId = conversationId(body.conversationId);
  const respond = async (answer: string, draft?: string) => {
    let saved = false;
    try {
      await recordLiveConversation({ conversationId: sessionId, initiator, question: message, answer });
      saved = true;
    } catch {
      // The conversation still works, but the interface must not claim this was remembered.
    }
    return json({ answer, ...(draft ? { relayDraft: draft } : {}), saved, memoryAvailable } satisfies ChatReply);
  };

  const draft = relayDraft(message, initiator);
  if (draft) return respond(`我把话写好了。你看看要不要改，点“确认传话”后，${otherMember(initiator)}才能收到。`, draft);

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return json({ error: "小魔丸这会儿没连上，刚才这句没有发出去。等会儿再试试。" }, 503);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const upstream = await fetch("https://api.deepseek.com/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          instructions: helperInstructions(initiator),
          input: [...history.map((item) => ({ role: item.role, content: item.text })), { role: "user", content: message }],
          tools: [{ type: "web_search" }],
          tool_choice: "auto",
          reasoning: { effort: "low" },
          max_output_tokens: 700,
          stream: false,
        }),
        signal: controller.signal,
      });
      if (!upstream.ok) throw new Error("upstream unavailable");
      const rawAnswer = extractText(await upstream.json());
      if (!rawAnswer) throw new Error("empty answer");
      return respond(withoutUrls(rawAnswer));
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return json({ error: "小魔丸这会儿没连上，刚才这句没有发出去。等会儿再试试。" }, 503);
  }
}
