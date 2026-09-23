"use client";

import { useEffect, useState } from "react";
import { useMemberIdentity } from "@/components/MemberIdentity";
import type { Member } from "@/lib/members";

type Attachment = {
  fileName: string;
  mimeType: string;
};

type MessageForSiyi = {
  id: string;
  author: Member;
  recipient: Member;
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
  const { member, loading } = useMemberIdentity();

  useEffect(() => {
    if (loading) return;
    if (!member) {
      const timer = window.setTimeout(() => setMessages(null), 0);
      return () => window.clearTimeout(timer);
    }
    void fetch("/api/messages?recipient=%E5%B0%8F%E9%AD%94%E7%8E%8B", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { messages?: MessageForSiyi[] };
        if (!response.ok || !Array.isArray(data.messages)) throw new Error("load failed");
        setMessages(data.messages.slice(0, 6));
      })
      .catch(() => setMessages([]));
  }, [member, loading]);

  return (
    <section className="message-for-siyi" aria-labelledby="message-for-siyi-title">
      <div className="message-for-siyi__heading">
        <p>MAILBOX</p>
        <h2 id="message-for-siyi-title">有你的信！</h2>
      </div>
      {!member && !loading ? <p className="message-for-siyi__empty">先<a href="/login">登录</a>，再看看这两天有没有新话。</p> : messages === null ? <p className="message-for-siyi__empty">正在打开这封信…</p> : messages.length === 0 ? (
        <p className="message-for-siyi__empty">信箱还是空的。<a href="/messages">去留一句 →</a></p>
      ) : (
        <div className="message-for-siyi__list">
          {messages.map((message) => (
            <article className="message-for-siyi__note" key={message.id}>
              {message.body && <p>{message.body}</p>}
              {message.image && <img src={mediaUrl(message.image)} alt="留在信箱里的图片" />}
              {message.audio && <audio controls preload="metadata" src={mediaUrl(message.audio)}>你的浏览器暂时不能播放这段语音。</audio>}
              <time dateTime={message.createdAt}>{message.author} · {displayTime(message.createdAt)}</time>
            </article>
          ))}
        </div>
      )}
      {messages && messages.length > 0 && <a className="message-for-siyi__link" href="/messages">去看看 →</a>}
    </section>
  );
}
