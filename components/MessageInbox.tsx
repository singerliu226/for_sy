"use client";

import { useCallback, useEffect, useState } from "react";

type Attachment = {
  fileName: string;
  mimeType: string;
};

type BoardMessage = {
  id: string;
  author: "思怡" | "魔王";
  recipient: "思怡" | "魔王";
  body: string;
  createdAt: string;
  image?: Attachment;
  audio?: Attachment;
};

function displayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function mediaUrl(attachment: Attachment) {
  return `/api/messages/media/${encodeURIComponent(attachment.fileName)}`;
}

export function MessageInbox() {
  const [messages, setMessages] = useState<BoardMessage[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadMessages = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    setError("");
    try {
      const response = await fetch("/api/messages", { cache: "no-store" });
      const data = await response.json() as { messages?: BoardMessage[]; error?: string };
      if (!response.ok || !Array.isArray(data.messages)) throw new Error(data.error ?? "load failed");
      setMessages(data.messages);
    } catch (loadError) {
      setMessages([]);
      setError(loadError instanceof Error && loadError.message ? loadError.message : "收信看板暂时打不开。")
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadMessages(); }, [loadMessages]);

  return (
    <section className="message-inbox" aria-labelledby="message-inbox-title">
      <div className="message-inbox__heading">
        <div><p>INBOX</p><h2 id="message-inbox-title">思怡写来的</h2></div>
        <button type="button" onClick={() => void loadMessages(true)} disabled={refreshing}>{refreshing ? "正在刷新…" : "刷新留言"}</button>
      </div>
      {error && <p className="message-inbox__feedback" role="status">{error}</p>}
      {messages === null ? <p className="message-inbox__empty">正在打开收信箱…</p> : messages.length === 0 ? (
        <p className="message-inbox__empty">还没有新留言。</p>
      ) : (
        <div className="message-inbox__list">
          {messages.map((message) => (
            <article className="message-inbox__note" key={message.id}>
              <div className="message-inbox__meta"><span>{message.author}</span><time dateTime={message.createdAt}>{displayTime(message.createdAt)}</time></div>
              {message.body && <p>{message.body}</p>}
              {message.image && <img src={mediaUrl(message.image)} alt={`${message.author}附上的图片`} />}
              {message.audio && <audio controls preload="metadata" src={mediaUrl(message.audio)}>你的浏览器暂时不能播放这段语音。</audio>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
