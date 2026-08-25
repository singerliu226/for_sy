"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { GuideCard, GuideSource, findGuideCards, quickPrompts } from "@/data/guide";

type AssistantMessage = {
  role: "user" | "assistant";
  text: string;
  sources?: GuideSource[];
  status?: string;
  cards?: GuideCard[];
  checkedAt?: string;
};

type AssistantResponse = {
  answer: string;
  sources: GuideSource[];
  sourceStatus: string;
  cards?: GuideCard[];
  checkedAt?: string;
};

type AnswerSection = { title: string; lines: string[] };

const historyKey = "molwan-assistant-history-v2";
const answerHeadings = ["先做什么", "推荐方案", "备选方案", "注意事项", "来源状态"];

function readMessages() {
  try {
    const value = JSON.parse(window.localStorage.getItem(historyKey) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is AssistantMessage => (
      item && (item.role === "user" || item.role === "assistant") && typeof item.text === "string"
    )).slice(-8);
  } catch {
    return [];
  }
}

function formatAssistantAnswer(answer: string): AnswerSection[] {
  const sections: AnswerSection[] = [];
  let current: AnswerSection = { title: "回答", lines: [] };

  for (const rawLine of answer.replace(/\r/g, "").split("\n")) {
    const line = rawLine
      .replace(/\*\*/g, "")
      .replace(/^\s*#{1,6}\s*/, "")
      .replace(/^\s*[-•]\s+/, "")
      .trim();
    if (!line) continue;

    const heading = answerHeadings.find((item) => line === item || line.startsWith(`${item}：`) || line.startsWith(`${item}:`));
    if (heading) {
      if (current.lines.length) sections.push(current);
      current = { title: heading, lines: [line.slice(heading.length).replace(/^[：:]\s*/, "").trim()].filter(Boolean) };
      continue;
    }
    current.lines.push(line);
  }

  if (current.lines.length) sections.push(current);
  return sections.length ? sections : [{ title: "回答", lines: ["暂时没有可展示的回答。"] }];
}

function rememberGuide(card: GuideCard) {
  try {
    const key = "molwan-recent-guides";
    const existing = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    const current = Array.isArray(existing) ? existing.filter((item): item is string => typeof item === "string") : [];
    window.localStorage.setItem(key, JSON.stringify([card.id, ...current.filter((id) => id !== card.id)].slice(0, 6)));
  } catch {
    // Recent links are a convenience only; the assistant should still work without browser storage.
  }
}

export function MagicAssistant() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const searchResults = useMemo(() => findGuideCards(query), [query]);

  useEffect(() => {
    setMessages(readMessages());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(historyKey, JSON.stringify(messages.slice(-8)));
  }, [messages, ready]);

  async function askAssistant(question?: string) {
    const message = (question ?? query).trim();
    if (!message || sending) return;

    const nextHistory: AssistantMessage[] = [...messages, { role: "user", text: message }].slice(-8);
    setMessages(nextHistory);
    setQuery("");
    setSending(true);

    try {
      const response = await fetch("/api/shanghai-guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: nextHistory.slice(0, -1).map(({ role, text }) => ({ role, text })),
        }),
      });
      const data = await response.json() as AssistantResponse & { error?: string };
      if (!response.ok || !data.answer) throw new Error(data.error ?? "暂时没能连接到魔丸小助手");

      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.answer, sources: data.sources, status: data.sourceStatus, cards: data.cards, checkedAt: data.checkedAt },
      ].slice(-8));
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "先做什么：这次没有拿到可核验的最新结果，先不要依据猜测行动。\n\n推荐方案：打开下面的魔都攻略，或直接查看官方来源。\n\n备选方案：涉及当日到达、营业、末班或安全问题时，直接向现场服务台、值班人员确认。\n\n注意事项：紧急情况直接拨打 110、120 或 119。\n\n来源状态：本次联网核验未完成，未展示未经证实的动态结论。",
          status: "本次没有取得最新信息",
        },
      ].slice(-8));
    } finally {
      setSending(false);
    }
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askAssistant();
  }

  return (
    <section className="magic-console magic-console--page" aria-labelledby="magic-title">
      <div className="magic-console__heading">
        <span className="magic-console__orb" aria-hidden="true">丸</span>
        <div><p>LIVE SHANGHAI HELPER</p><h2 id="magic-title">魔丸小助手</h2></div>
        <span className="magic-console__status"><i />每次提问联网核验</span>
      </div>
      <p className="magic-console__intro">问此刻真正要办的事。魔丸会优先给出能打开核验的来源；没有可靠新信息时，会直接告诉你。</p>
      <form onSubmit={submitQuestion} className="magic-console__form">
        <label className="sr-only" htmlFor="magic-question">问问魔丸小助手</label>
        <input id="magic-question" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="比如：今晚同济附近还有药店营业吗？" autoComplete="off" />
        <button type="submit" disabled={sending}>{sending ? "正在联网核验…" : "问问魔丸 ↗"}</button>
      </form>
      <div className="magic-console__prompts">
        {quickPrompts.map((prompt) => <button type="button" onClick={() => void askAssistant(prompt)} key={prompt}>{prompt}</button>)}
      </div>
      <p className="magic-console__privacy">每次提问都会尝试联网确认，回答会标出本次核验状态与来源。请不要输入住址、证件、银行卡或实时位置。</p>
      {query.trim() && searchResults.length > 0 && (
        <div className="magic-console__matches" aria-live="polite">
          <span>魔都攻略里已有这些基础资料</span>
          {searchResults.slice(0, 3).map((card) => <a href={`/guide#guide-${card.section}`} key={card.id}>{card.title} →</a>)}
        </div>
      )}
      {messages.length > 0 && (
        <div className="magic-console__conversation" aria-live="polite">
          <div className="magic-console__conversation-head"><span>本机保留最近 4 轮，方便接着问</span><button type="button" onClick={() => setMessages([])}>清空对话</button></div>
          {messages.slice(-4).map((message, index) => (
            <article className={`magic-message magic-message--${message.role}`} key={`${message.role}-${index}-${message.text.slice(0, 18)}`}>
              <p>{message.role === "user" ? "思怡的问题" : "魔丸的回答"}</p>
              {message.role === "assistant" ? (
                <div className="magic-answer">
                  {formatAssistantAnswer(message.text).map((section, sectionIndex) => (
                    <section className="magic-answer__section" key={`${section.title}-${sectionIndex}`}><h3>{section.title}</h3><div>{section.lines.map((line, lineIndex) => <p key={`${line}-${lineIndex}`}>{line}</p>)}</div></section>
                  ))}
                </div>
              ) : <div className="magic-answer magic-answer--user">{message.text}</div>}
              {message.status && <small>{message.status}</small>}
              {message.checkedAt && <small>本次联网核验 · {message.checkedAt}</small>}
              {message.cards && message.cards.length > 0 && <div className="magic-message__cards">{message.cards.map((card) => <a href={`/guide#guide-${card.section}`} onClick={() => rememberGuide(card)} key={card.id}>去看魔都攻略 · {card.title} →</a>)}</div>}
              {message.sources && message.sources.length > 0 && <footer>{message.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>来源 · {source.label} ↗</a>)}</footer>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
