import { randomUUID } from "node:crypto";
import { recordLiveConversation, type AuditInitiator } from "@/lib/assistant-audit";
import { requireMember } from "@/lib/auth";

type HistoryItem = { role: "user" | "assistant"; text: string };
type ChatBody = { message?: unknown; history?: unknown; initiator?: unknown; conversationId?: unknown };
type Source = { label: string; url: string };
type ChatReply = { answer: string; sources: Source[]; sourceStatus?: string; checkedAt?: string };

const requestBuckets = new Map<string, number[]>();
const requestWindowMs = 10 * 60 * 1000;
const requestLimit = 12;

const helperInstructions = [
  "你是小魔丸，是大魔王和小魔王共用的问答小伙伴。",
  "用自然、口语化、短一点的中文回答。像认真帮忙的朋友，不像客服、老师或心理咨询师。",
  "可以讲题、捋思路、回答一般生活问题，也可以查临时变化的信息。",
  "先直接回答最要紧的那件事。用户想继续时再展开，不要为了凑格式而分很多段，也不要用星号、Markdown 表格或大段免责声明。",
  "题目或学习问题：说清楚卡在哪一步，给下一步；不知道题目时请用户补充条件或题图，不要猜。",
  "涉及最新营业、路线、天气、价格、政策、活动或任何会变的信息：用网页搜索。只有搜索拿到可打开的链接时，才可以给出具体事实；回答最后逐行列出一到三条完整 https 链接。",
  "没有查准时直接说没查准，建议用户打开官方入口、换个说法或问熟悉的人。不要编造来源、精确数字、营业时间或规则。",
  "不要假装认识大魔王或小魔王正在做什么，不替任何一方表态、回复或传话。",
  "不要索取或复述身份证号、银行卡号、住址、精确实时位置等敏感信息。",
].join("\n");

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

function sourceUrls(answer: string) {
  const matches = [...answer.matchAll(/https?:\/\/[^\s)\]}>，。；、]+/g)].map((match) => match[0]);
  const urls = [...new Set(matches)].slice(0, 3);
  return urls.flatMap((url) => {
    try {
      const parsed = new URL(url);
      return [{ label: parsed.hostname.replace(/^www\./, ""), url }];
    } catch {
      return [];
    }
  });
}

function withoutUrls(answer: string) {
  return answer.replace(/https?:\/\/[^\s)\]}>，。；、]+/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function checkedAt() {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date()).replace(/\//g, "-");
}

function conversationId(value: unknown) {
  return typeof value === "string" && /^[a-z0-9-]{16,96}$/i.test(value) ? value : randomUUID();
}

function fallbackReply() {
  return {
    answer: "这个我这会儿没查准。你可以换个说法再问我；要是很急，就先问一下现场的人或者熟悉情况的人。",
    sources: [],
  };
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
  const history = parseHistory(body.history);
  const sessionId = conversationId(body.conversationId);
  const respond = async (reply: ChatReply) => {
    try {
      await recordLiveConversation({ conversationId: sessionId, initiator, question: message, answer: reply.answer, status: reply.sourceStatus });
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
          instructions: helperInstructions,
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
      const sources = sourceUrls(rawAnswer);
      return respond({
        answer: withoutUrls(rawAnswer),
        sources,
        ...(sources.length ? { checkedAt: checkedAt() } : {}),
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return respond(fallbackReply());
  }
}
