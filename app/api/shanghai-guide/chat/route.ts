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
不要索取、复述或存储身份证号、银行卡号、宿舍号、实时位置等敏感信息。
不要描述你的搜索过程、工具调用或内部推理。若给出任何动态的具体事实，末尾必须逐行附上 1–3 条完整的 https:// 来源链接；没有链接就不要给出该事实。`;

function clientAddress(request: Request) {
  const realAddress = request.headers.get("x-real-ip");
  if (realAddress) return realAddress.trim();
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
  if (!Array.isArray(record.output)) return "";
  return record.output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const typedItem = item as { type?: unknown; content?: unknown };
      // Responses API returns both private reasoning items and user-facing messages.
      // Only message/output_text content may ever reach the browser.
      if (typedItem.type !== "message") return [];
      const content = typedItem.content;
      if (!Array.isArray(content)) return [];
      return content.flatMap((part) => {
        if (!part || typeof part !== "object") return [];
        const typedPart = part as { type?: unknown; text?: unknown };
        return typedPart.type === "output_text" && typeof typedPart.text === "string" ? [typedPart.text] : [];
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
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const liveRequest = fetch("https://api.deepseek.com/responses", {
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
          // Flash spends part of this budget on server-side search reasoning. Leave
          // enough room for a short, complete answer after the search finishes.
          max_output_tokens: 2200,
          stream: false,
        }),
        signal: controller.signal,
      });
      const deadline = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error("live_search_timeout"));
        }, 8_000);
      });
      const upstream = await Promise.race([liveRequest, deadline]);

      if (!upstream.ok) throw new Error("upstream_unavailable");
      const answer = extractText(await upstream.json());
      if (!answer) throw new Error("empty_response");

      const citations = dynamicSources(answer);
      if (!citations.length) {
        return Response.json({
          ...localAnswer,
          sourceStatus: "实时检索未返回可核验来源，未展示未经证实的动态结论",
          mode: "fallback",
        });
      }
      return Response.json({
        answer,
        sources: citations,
        sourceStatus: "已展示本次回答中可校验的外部链接；动态信息请以原始页面为准",
        cards: findGuideCards(message).slice(0, 3),
        mode: "live",
      });
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  } catch (error) {
    const timedOut = error instanceof Error && error.message === "live_search_timeout";
    return Response.json({
      ...localAnswer,
      sourceStatus: timedOut
        ? "实时查询超过 8 秒，已回退到已核验攻略"
        : "魔丸暂时没有接上实时信息，已回退到攻略资料库",
      mode: "fallback",
    });
  }
}
