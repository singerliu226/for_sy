"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMemberIdentity } from "@/components/MemberIdentity";

type Source = { label: string; url: string };

type AssistantMessage = {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  status?: string;
  checkedAt?: string;
};

type AssistantResponse = {
  answer: string;
  sources: Source[];
  sourceStatus?: string;
  checkedAt?: string;
};

const historyKey = "mozu-little-marble-history-v1";
const oldHistoryKeys = ["molwan-assistant-history-v3", "molwan-assistant-history-v2"];
const quickPrompts = ["魔丸，帮我看看这题？", "我有点乱，怎么先把这件事理顺？", "这家店现在还开着吗？"];

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "m-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}

function readHistory(key: string) {
  try {
    const raw = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is AssistantMessage => Boolean(item) && (item.role === "user" || item.role === "assistant") && typeof item.text === "string").slice(-8);
  } catch {
    return [];
  }
}

function tidyText(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function displayBlocks(value: string) {
  return tidyText(value).split(/\n{2,}/).filter(Boolean);
}

function visibleStatus(value?: string) {
  if (value === "这段是小魔丸的说明，没有附上可打开的来源。" || value === "这次没有拿到能确认的来源") return "";
  return value ?? "";
}

export function MagicAssistant() {
  const { member } = useMemberIdentity();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [sessionId] = useState(newId);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const current = readHistory(historyKey);
    if (current.length) {
      setMessages(current);
      return;
    }
    for (const oldKey of oldHistoryKeys) {
      const legacy = readHistory(oldKey);
      if (legacy.length) {
        setMessages(legacy);
        return;
      }
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(historyKey, JSON.stringify(messages.slice(-8)));
    } catch {
      // The chat can still be used when the browser declines local storage.
    }
  }, [messages]);

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from) setQuery("关于「" + from.slice(0, 80) + "」：");
  }, []);

  async function ask(question?: string) {
    const message = (question ?? query).trim();
    if (!message || !member || sending) {
      if (!member) setNotice("先登录，再来问小魔丸。 ");
      return;
    }

    const nextHistory = [...messages, { role: "user" as const, text: message }].slice(-8);
    setMessages(nextHistory);
    setQuery("");
    setSending(true);
    setNotice("");

    try {
      const response = await fetch("/api/shanghai-guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationId: sessionId,
          history: nextHistory.slice(0, -1).map((item) => ({ role: item.role, text: item.text })),
        }),
      });
      const result = await response.json() as AssistantResponse & { error?: string };
      if (!response.ok || !result.answer) throw new Error(result.error ?? "小魔丸没接到这句话。");
      setMessages((current) => [...current, {
        role: "assistant",
        text: result.answer,
        sources: result.sources,
        status: result.sourceStatus,
        checkedAt: result.checkedAt,
      }].slice(-8));
    } catch (error) {
      setMessages((current) => [...current, {
        role: "assistant",
        text: "这次我没查明白。换个说法问我，或者直接问大魔王也行。",
        status: error instanceof Error && error.message ? error.message : "暂时没连上",
      }].slice(-8));
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask();
  }

  function share(message: AssistantMessage) {
    if (!member) {
      setNotice("先登录，再把这段话留给对方。 ");
      return;
    }
    try {
      window.sessionStorage.setItem("mozu-message-draft-v1", JSON.stringify({
        text: "小魔丸刚刚说：\n" + tidyText(message.text),
      }));
      window.location.href = "/messages";
    } catch {
      setNotice("没能把这段话带过去，复制一下再发吧。");
    }
  }

  return (
    <section className="magic-console magic-console--page" aria-labelledby="magic-title">
      <div className="magic-console__heading">
        <span className="magic-console__orb" aria-hidden="true">丸</span>
        <div><p>小魔丸</p><h2 id="magic-title">小魔丸，帮我看看这个事儿？</h2></div>
        <span className="magic-console__status"><i />{member ? "准备好了" : "登录后就能问"}</span>
      </div>
      <p className="magic-console__intro">题不会、事儿拿不准，或者想查点啥，都扔给它。</p>
      <form onSubmit={submit} className="magic-console__form">
        <label className="sr-only" htmlFor="magic-question">输入问题</label>
        <input id="magic-question" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="比如：魔丸，你帮我看看这题？" autoComplete="off" />
        <button type="submit" disabled={sending || !member}>{sending ? "我看看…" : "问问魔丸 →"}</button>
      </form>
      <div className="magic-console__prompts">
        {quickPrompts.map((prompt) => <button type="button" onClick={() => void ask(prompt)} key={prompt}>{prompt}</button>)}
      </div>
      {notice && <p className="magic-console__privacy" role="status">{notice}</p>}
      {messages.length > 0 && (
        <div className="magic-console__conversation" aria-live="polite">
          <div className="magic-console__conversation-head"><span>这次聊的</span><button type="button" onClick={() => setMessages([])}>清掉这段</button></div>
          {messages.slice(-6).map((message, index) => (
            <article className={"magic-message magic-message--" + message.role} key={message.role + "-" + index + "-" + message.text.slice(0, 18)}>
              <p>{message.role === "user" ? (member || "你") : "小魔丸"}</p>
              <div className={"magic-answer " + (message.role === "user" ? "magic-answer--user" : "")}>
                {message.role === "assistant" ? displayBlocks(message.text).map((block, blockIndex) => <p key={blockIndex}>{block}</p>) : message.text}
              </div>
              {visibleStatus(message.status) && <small>{visibleStatus(message.status)}</small>}
              {message.sources && message.sources.length > 0 && <footer><span>刚查到的资料{message.checkedAt ? ` · ${message.checkedAt}` : ""}</span>{message.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.label} ↗</a>)}</footer>}
              {message.role === "assistant" && <div className="magic-message__share-box"><button className="magic-message__share" type="button" onClick={() => share(message)}>带去留言板</button><small>会先放进草稿，不会直接发出去。</small></div>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
