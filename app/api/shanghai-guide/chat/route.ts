import { GuideSource, findGuideCards, makeStaticAssistantAnswer } from "@/data/guide";

type HistoryItem = { role: "user" | "assistant"; text: string };

const requestBuckets = new Map<string, number[]>();
const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 12;

const helperInstructions = `你是“魔丸小助手”，只服务思怡在同济四平路校区和上海的日常生活。
回答必须使用中文，并固定成五段：先做什么、推荐方案、备选方案、注意事项、来源状态。
只在需要当日信息、附近门店、天气、末班车、航班或营业状态时使用网页搜索。
涉及人身安全、医疗、火情或违法风险时，优先建议联系现场工作人员或紧急电话。
不要编造精确班次、价格、营业时间、校内规则或来源链接。若网页搜索没有提供可靠链接，在“来源状态”中明确说明“动态检索未返回可核验出处”。
不要索取、复述或存储身份证号、银行卡号、宿舍号、实时位置等敏感信息。`;

function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(address: string) {
  const now = Date.now();
  const recent = (requestBuckets.get(address) ?? []).filter((timestamp) => now - timestamp < REQUEST_WINDOW_MS);
  if (recent.length >= REQUEST_LIMIT) {
    requestBuckets.set(address, recent);
    return true;
  }
  requestBuckets.set(address, [...recent, now]);
  return false;
}

function parseHistory(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is HistoryItem => (
      typeof item === "object" && item !== null &&
      ((item as HistoryItem).role === "user" || (item as HistoryItem).role === "assistant") &&
      typeof (item as HistoryItem).text === "string"
    ))
    .map((item) => ({ role: item.role, text: item.text.slice(0, 1200) }))
    .slice(-6);
}

function needsLiveSearch(message: string) {
  return /今天|今晚|明天|附近|营业|末班|航班|天气|临时|堵车|实时|现在|几点/.test(message);
}

function extractText(response: unknown) {
  if (!response || typeof response !== "object") return "";
  const record = response as { output_text?: unknown; output?: unknown };
  if (typeof record.output_text === "string" && record.output_text.trim()) return record.output_text.trim();
  if (!Array.isArray(record.output)) return "";
  return record.output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) return [];
      return content.flatMap((part) => {
        if (!part || typeof part !== "object") return [];
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? [text] : [];
      });
    })
    .join("\n")
    .trim();
}

function dynamicSources(answer: string): GuideSource[] {
  const matches = [...answer.matchAll(/https?:\/\/[^\s)\]}>，。；、]+/g)].map((match) => match[0]);
  const unique = [...new Set(matches)].slice(0, 3);
  return unique.flatMap((url) => {
    try {
      const parsed = new URL(url);
      return [{ label: parsed.hostname.replace(/^www\./, ""), url }];
    } catch {
      return [];
    }
  });
}

export async function POST(request: Request) {
  const address = clientAddress(request);
  if (isRateLimited(address)) {
    return Response.json({ error: "魔丸要缓一缓啦，请十分钟后再问一次。" }, { status: 429 });
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "这句话没有被好好收到，再发一次试试。" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";
  if (!message) return Response.json({ error: "先写下一句想问魔丸的话吧。" }, { status: 400 });

  const history = parseHistory(body.history);
  const localAnswer = makeStaticAssistantAnswer(message);
  if (!needsLiveSearch(message)) {
    return Response.json({ ...localAnswer, mode: "library" });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Response.json({
      ...localAnswer,
      sourceStatus: "魔丸暂时离线，已先从攻略资料库里找到了可用答案",
      mode: "fallback",
    });
  }

  try {
    const upstream = await fetch("https://api.deepseek.com/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        instructions: helperInstructions,
        input: [
          ...history.map((item) => ({ role: item.role, content: item.text })),
          { role: "user", content: message },
        ],
        tools: [{ type: "web_search" }],
        tool_choice: "auto",
        max_output_tokens: 900,
        stream: false,
      }),
    });

    if (!upstream.ok) throw new Error("upstream_unavailable");
    const answer = extractText(await upstream.json());
    if (!answer) throw new Error("empty_response");

    const citations = dynamicSources(answer);
    const matchedSources = findGuideCards(message).slice(0, 2).map((card) => card.source);
    return Response.json({
      answer,
      sources: citations.length ? citations : matchedSources,
      sourceStatus: citations.length
        ? "已展示本次回答中可校验的外部链接"
        : "动态检索未返回可核验出处；请以攻略卡中的官方来源为准",
      mode: "live",
    });
  } catch {
    return Response.json({
      ...localAnswer,
      sourceStatus: "魔丸暂时没有接上实时信息，已回退到攻略资料库",
      mode: "fallback",
    });
  }
}
