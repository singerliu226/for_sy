import { randomUUID } from "node:crypto";
import { getRecentAssistantMemory, recordLiveConversation, type AuditInitiator } from "@/lib/assistant-audit";
import { requireMember } from "@/lib/auth";

type HistoryItem = { role: "user" | "assistant"; text: string };
type ChatBody = { message?: unknown; history?: unknown; conversationId?: unknown };
type ChatReply = { answer: string };

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
    "页面里有“给对方留句话”功能。用户想让另一位看到的话，提醒她可以用这个功能；你不能假装已经替她发出去。",
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

function parseHistory(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is HistoryItem => Boolean(item) && typeof item === "object" && ((item as HistoryItem).role === "user" || (item as HistoryItem).role === "assistant") && typeof (item as HistoryItem).text === "string")
    .map((item) => ({ role: item.role, text: item.text.slice(0, 1200) }))
    .slice(-6);
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

function fallbackReply() {
  return {
    answer: "这个我这会儿没查准。你可以换个说法再问我；要是很急，就先问一下现场的人或者熟悉情况的人。",
  };
}

function mergeHistory(memory: HistoryItem[], local: HistoryItem[]) {
  const seen = new Set<string>();
  return [...memory, ...local].filter((item) => {
    const key = `${item.role}\u0000${item.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(-12);
}

export async function POST(request: Request) {
  const access = requireMember(request);
  if ("response" in access) return access.response;
  const address = clientAddress(request);
  if (isRateLimited(address)) return Response.json({ error: "小魔丸要缓一缓啦，十分钟后再问一次。" }, { status: 429 });

  let body: ChatBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "这句话没有被好好收到，再发一次试试。" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";
  if (!message) return Response.json({ error: "先写下一句想问小魔丸的话吧。" }, { status: 400 });
  const initiator: AuditInitiator = access.member;
  const localHistory = parseHistory(body.history);
  let history = localHistory;
  try {
    history = mergeHistory(await getRecentAssistantMemory(initiator), localHistory);
  } catch {
    // A temporary memory read issue should not stop a new conversation.
  }
  const sessionId = conversationId(body.conversationId);
  const respond = async (reply: ChatReply) => {
    try {
      await recordLiveConversation({ conversationId: sessionId, initiator, question: message, answer: reply.answer });
    } catch {
      // The answer still belongs to the visitor if the private archive has a temporary problem.
    }
    return Response.json(reply);
  };

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return respond(fallbackReply());

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
      return respond({
        answer: withoutUrls(rawAnswer),
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return respond(fallbackReply());
  }
}
