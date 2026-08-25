import { GuideSource, findGuideCards, makeStaticAssistantAnswer } from "@/data/guide";

type HistoryItem = { role: "user" | "assistant"; text: string };

const requestBuckets = new Map<string, number[]>();
const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 12;

const helperInstructions = `你是“魔丸小助手”，只服务思怡在同济四平路校区和上海的日常生活。你的口吻是她男朋友给她留话：自然、温柔、简短，像“你先别急”“我先帮你看了一下”“要是临时有变就这样做”，不要像客服、说明书或 AI。
回答必须使用中文，并固定成五段：先做什么、推荐方案、备选方案、注意事项、来源状态。
每一次提问都必须先使用一次网页搜索核验；即使问题看似稳定，也要优先确认最新官方规则、运营状态或页面发布日期。只搜索一次，得到可靠结果后立刻回答，不要反复搜索。
涉及人身安全、医疗、火情或违法风险时，优先建议联系现场工作人员或紧急电话。
不要编造精确班次、价格、营业时间、校内规则或来源链接。若网页搜索没有提供可靠链接，在“来源状态”中明确说明“动态检索未返回可核验出处”。
不要索取、复述或存储身份证号、银行卡号、宿舍号、实时位置等敏感信息。
不要描述你的搜索过程、工具调用或内部推理。每段简洁明白，优先给最重要的 2–3 步。可以用“你”“我”，但不要滥用昵称、煽情、承诺自己就在现场，或把未查到的事说得笃定。若给出任何动态的具体事实，末尾必须逐行附上 1–3 条完整的 https:// 来源链接；没有链接就不要给出该事实。`;

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

function removeSourceUrls(answer: string) {
  return answer
    .replace(/https?:\/\/[^\s)\]}>，。；、]+/g, "")
    .replace(/\n{3,}/g, "\n\n")
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

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Response.json({
      ...localAnswer,
      sourceStatus: "这次没接上最新信息，我先把提前替你核过的攻略放在这里",
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
          reasoning: { effort: "low" },
          max_output_tokens: 650,
          stream: false,
        }),
        signal: controller.signal,
      });
      const deadline = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error("live_search_timeout"));
        }, 12_000);
      });
      const upstream = await Promise.race([liveRequest, deadline]);

      if (!upstream.ok) throw new Error("upstream_unavailable");
      const answer = extractText(await upstream.json());
      if (!answer) throw new Error("empty_response");

      const citations = dynamicSources(answer);
      if (!citations.length) {
        return Response.json({
          ...localAnswer,
          sourceStatus: "这次没查到能让你放心照着走的来源，所以没有拿猜测糊弄你",
          mode: "fallback",
        });
      }
      return Response.json({
        answer: removeSourceUrls(answer),
        sources: citations,
        sourceStatus: "我这次查到了可以自己打开确认的来源；临时变化还是以原页面为准",
        cards: findGuideCards(message).slice(0, 3),
        checkedAt: checkedAt(),
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
        ? "我查得有点久了，先把之前替你核过的攻略放在这里"
        : "这次没接上最新信息，我先把提前替你核过的攻略放在这里",
      mode: "fallback",
    });
  }
}
