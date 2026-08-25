import { GuideSource, findGuideCards, makeStaticAssistantAnswer, recognizeGuideIntent } from "@/data/guide";

type HistoryItem = { role: "user" | "assistant"; text: string };

const requestBuckets = new Map<string, number[]>();
const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 12;

const helperInstructions = `你是“魔丸小助手”，只服务思怡在同济四平路校区和上海的日常生活。口吻自然、温柔、简短，优先给可执行步骤，不像客服、说明书或 AI。避免反复描述“我查了”“我替你整理了”等过程性自述。
回答必须使用中文，并固定成五段：先做什么、推荐方案、备选方案、注意事项、来源状态。
每一次提问都必须先判断用户在问什么主题；地点词本身不是主题，绝不能因为用户提到“同济”就回答机场通勤。最新一条用户问题优先，不要沿用对话历史中的旧主题。动态问题可使用一次网页搜索核验；得到可靠结果后立刻回答，不要反复搜索。
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
  const intent = recognizeGuideIntent(message);
  const localAnswer = makeStaticAssistantAnswer(message);

  // These two topics are deliberately answered from a safe, real-time entry
  // point instead of asking a model to invent a restaurant list or delay an
  // urgent action. They also make the intent boundary visible to the user.
  if (intent.id === "nearby-food" || intent.id === "emergency") {
    return Response.json({ ...localAnswer, mode: "intent" });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Response.json({
      ...localAnswer,
      sourceStatus: `暂时无法获取最新信息；${localAnswer.sourceStatus}`,
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
          instructions: `${helperInstructions}\n\n本次用户问题已识别为「${intent.label}」。只回答这个主题；若搜索结果与此主题无关，宁可说明无法确认，也不能改答机场、通勤或其他主题。`,
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
          sourceStatus: "未找到可靠的可验证来源，以下为已收录攻略",
          mode: "fallback",
        });
      }
      return Response.json({
        answer: removeSourceUrls(answer),
        sources: citations,
        sourceStatus: "来源可自行打开确认；临时变化以原页面为准",
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
        ? `查询超时；${localAnswer.sourceStatus}`
        : `暂时无法获取最新信息；${localAnswer.sourceStatus}`,
      mode: "fallback",
    });
  }
}
