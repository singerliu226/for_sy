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

const historyKey = "molwan-assistant-history-v3";
const answerHeadings = ["先做什么", "推荐方案", "备选方案", "注意事项", "来源状态"];
const answerHeadingLabels: Record<string, string> = {
  "先做什么": "先做这一步",
  "推荐方案": "推荐方案",
  "备选方案": "临时有变",
  "注意事项": "注意",
  "来源状态": "来源状态",
};

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
          text: "哎呀，小助手不会啊啊啊，快去找魔王吧",
          status: "暂时没有收到可靠回答",
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
        <div><p>SHANGHAI QUICK CHECK</p><h2 id="magic-title">输入你现在要解决的事</h2></div>
        <span className="magic-console__status"><i />可查询最新信息</span>
      </div>
      <p className="magic-console__intro">帮你判断落地后怎么走、哪儿还开着、会不会下雨或错过末班车。</p>
      <form onSubmit={submitQuestion} className="magic-console__form">
        <label className="sr-only" htmlFor="magic-question">输入问题</label>
        <input id="magic-question" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="比如：今晚同济附近还有药店开着吗？" autoComplete="off" />
        <button type="submit" disabled={sending}>{sending ? "查询中…" : "开始查询 ↗"}</button>
      </form>
      <div className="magic-console__prompts">
        {quickPrompts.map((prompt) => <button type="button" onClick={() => void askAssistant(prompt)} key={prompt}>{prompt}</button>)}
      </div>
      {query.trim() && searchResults.length > 0 && (
        <div className="magic-console__matches" aria-live="polite">
          <span>相关攻略</span>
          {searchResults.slice(0, 3).map((card) => <a href={`/guide#guide-${card.section}`} key={card.id}>{card.title} →</a>)}
        </div>
      )}
      {messages.length > 0 && (
        <div className="magic-console__conversation" aria-live="polite">
          <div className="magic-console__conversation-head"><button type="button" onClick={() => setMessages([])}>清除记录</button></div>
          {messages.slice(-4).map((message, index) => (
            <article className={`magic-message magic-message--${message.role}`} key={`${message.role}-${index}-${message.text.slice(0, 18)}`}>
              <p>{message.role === "user" ? "你的问题" : "查询结果"}</p>
              {message.role === "assistant" ? (
                <div className="magic-answer">
                  {formatAssistantAnswer(message.text).map((section, sectionIndex) => (
                    <section className="magic-answer__section" key={`${section.title}-${sectionIndex}`}><h3>{answerHeadingLabels[section.title] ?? section.title}</h3><div>{section.lines.map((line, lineIndex) => <p key={`${line}-${lineIndex}`}>{line}</p>)}</div></section>
                  ))}
                </div>
              ) : <div className="magic-answer magic-answer--user">{message.text}</div>}
              {message.status && <small>{message.status}</small>}
              {message.checkedAt && <small>查询时间 · {message.checkedAt}</small>}
              {message.cards && message.cards.length > 0 && <div className="magic-message__cards">{message.cards.map((card) => <a href={`/guide#guide-${card.section}`} onClick={() => rememberGuide(card)} key={card.id}>{card.title} →</a>)}</div>}
              {message.sources && message.sources.length > 0 && <footer>{message.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>来源 · {source.label} ↗</a>)}</footer>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
