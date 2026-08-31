"use client";

import { useEffect, useState } from "react";

type Attachment = {
  fileName: string;
  mimeType: string;
};

type MessageForSiyi = {
  id: string;
  author: "魔王";
  recipient: "思怡";
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

export function MessageForSiyi() {
  const [messages, setMessages] = useState<MessageForSiyi[] | null>(null);

  useEffect(() => {
    void fetch("/api/messages?recipient=%E6%80%9D%E6%80%A1", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { messages?: MessageForSiyi[] };
        if (!response.ok || !Array.isArray(data.messages)) throw new Error("load failed");
        setMessages(data.messages.slice(0, 6));
      })
      .catch(() => setMessages([]));
  }, []);

  return (
    <section className="message-for-siyi" aria-labelledby="message-for-siyi-title">
      <div className="message-for-siyi__heading">
        <p>FROM THE KING</p>
        <h2 id="message-for-siyi-title">魔王留给你的</h2>
      </div>
      {messages === null ? <p className="message-for-siyi__empty">正在打开这封信…</p> : messages.length === 0 ? (
        <p className="message-for-siyi__empty">这里会放我想让你一打开就看到的话。<a href="/messages">去留句话 →</a></p>
      ) : (
        <div className="message-for-siyi__list">
          {messages.map((message) => (
            <article className="message-for-siyi__note" key={message.id}>
              {message.body && <p>{message.body}</p>}
              {message.image && <img src={mediaUrl(message.image)} alt="魔王留给思怡的图片" />}
              {message.audio && <audio controls preload="metadata" src={mediaUrl(message.audio)}>你的浏览器暂时不能播放这段语音。</audio>}
              <time dateTime={message.createdAt}>魔王 · {displayTime(message.createdAt)}</time>
            </article>
          ))}
        </div>
      )}
      {messages && messages.length > 0 && <a className="message-for-siyi__link" href="/messages">去我们的小留言回复 →</a>}
    </section>
  );
}
