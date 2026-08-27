"use client";

import { FormEvent, useEffect, useState } from "react";

type BoardMessage = {
  id: string;
  author: "思怡";
  body: string;
  createdAt: string;
};

const MESSAGE_LENGTH_LIMIT = 280;

function displayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function MessageBoard() {
  const [messages, setMessages] = useState<BoardMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void fetch("/api/messages", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { messages?: BoardMessage[] };
        if (!response.ok || !Array.isArray(data.messages)) throw new Error("load failed");
        setMessages(data.messages);
      })
      .catch(() => setMessages([]));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;

    setSending(true);
    setFeedback("");
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, website: "" }),
      });
      const data = await response.json() as { message?: BoardMessage; error?: string };
      if (!response.ok || !data.message) throw new Error(data.error ?? "submit failed");
      setMessages((current) => [data.message!, ...(current ?? [])].slice(0, 50));
      setDraft("");
      setFeedback("我收到啦。");
    } catch (error) {
      setFeedback(error instanceof Error && error.message ? error.message : "这次没能留住，稍后再试一次。");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="message-board" aria-labelledby="message-board-title">
      <div className="message-board__write">
        <div className="message-board__heading">
          <p>WRITE TO ME</p>
          <h2 id="message-board-title">给魔王留一句话</h2>
        </div>
        <form onSubmit={submit}>
          <label className="sr-only" htmlFor="board-message">留言内容</label>
          <textarea
            id="board-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MESSAGE_LENGTH_LIMIT}
            placeholder="今天想跟我说什么？"
            rows={5}
          />
          <div className="message-board__form-footer">
            <span>{draft.length}/{MESSAGE_LENGTH_LIMIT} · 别留密码、验证码或地址</span>
            <button type="submit" disabled={sending || !draft.trim()}>{sending ? "送过去了…" : "留在这里 →"}</button>
          </div>
          <p className="message-board__feedback" aria-live="polite">{feedback}</p>
        </form>
      </div>

      <section className="message-board__history" aria-label="已收到的留言">
        <div className="message-board__heading"><p>RECEIVED</p><h2>我会看到的</h2></div>
        {messages === null ? <p className="message-board__empty">正在打开收信箱…</p> : messages.length === 0 ? (
          <p className="message-board__empty">第一句话，等你来写。</p>
        ) : (
          <div className="message-board__list">
            {messages.map((message) => (
              <article className="message-note" key={message.id}>
                <p>{message.body}</p>
                <span>思怡 · {displayTime(message.createdAt)}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
