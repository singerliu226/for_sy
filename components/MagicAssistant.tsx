"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMemberIdentity } from "@/components/MemberIdentity";
import { otherMember } from "@/lib/members";

type AssistantMessage = { role: "user" | "assistant"; text: string };
type AssistantResponse = { answer: string };

const historyKey = "mozu-little-marble-history-v2";
const oldHistoryKeys = ["mozu-little-marble-history-v1", "molwan-assistant-history-v3", "molwan-assistant-history-v2"];
const quickPrompts = ["我今天有点烦，想说两句。", "这道题我卡住了。", "我有件事拿不准。"];

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

export function MagicAssistant() {
  const { member } = useMemberIdentity();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [sessionId] = useState(newId);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [relayOpen, setRelayOpen] = useState(false);
  const [relayText, setRelayText] = useState("");
  const [relaying, setRelaying] = useState(false);

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
      // The server keeps the actual memory; this only keeps the current screen smooth.
    }
  }, [messages]);

  async function ask(question?: string) {
    const message = (question ?? query).trim();
    if (!message || !member || sending) {
      if (!member) setNotice("先登录，再来找小魔丸。 ");
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
          history: nextHistory.slice(0, -1),
        }),
      });
      const result = await response.json() as AssistantResponse & { error?: string };
      if (!response.ok || !result.answer) throw new Error(result.error ?? "小魔丸没接到这句话。");
      setMessages((current) => [...current, { role: "assistant", text: result.answer }].slice(-8));
    } catch (error) {
      setMessages((current) => [...current, {
        role: "assistant",
        text: error instanceof Error && error.message ? error.message : "这会儿有点没连上，等一下再说。",
      }].slice(-8));
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask();
  }

  async function relay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member || !relayText.trim() || relaying) return;
    setRelaying(true);
    setNotice("");
    try {
      const form = new FormData();
      form.append("message", relayText.trim());
      form.append("website", "");
      const response = await fetch("/api/messages", { method: "POST", body: form });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "这句话没能递过去。");
      setRelayText("");
      setRelayOpen(false);
      setNotice(`已经递给${otherMember(member)}了。`);
    } catch (error) {
      setNotice(error instanceof Error && error.message ? error.message : "这句话没能递过去。");
    } finally {
      setRelaying(false);
    }
  }

  const recipient = member ? otherMember(member) : "对方";

  return (
    <section className="magic-console magic-console--page" aria-labelledby="magic-title">
      <div className="magic-console__heading">
        <span className="magic-console__orb" aria-hidden="true">丸</span>
        <div><p>小魔丸</p><h2 id="magic-title">想问什么，或者想说什么？</h2></div>
        <span className="magic-console__status"><i />{member ? "我在" : "登录后就能说"}</span>
      </div>
      <p className="magic-console__intro">题不会、心里堵着、事情拿不准，都可以慢慢说。上次聊到的事，小魔丸也会接着记着。</p>
      <form onSubmit={submit} className="magic-console__form">
        <label className="sr-only" htmlFor="magic-question">想对小魔丸说的话</label>
        <input id="magic-question" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="比如：我今天有点烦。" autoComplete="off" />
        <button type="submit" disabled={sending || !member}>{sending ? "我在听…" : "说给魔丸听 →"}</button>
      </form>
      <div className="magic-console__prompts">
        {quickPrompts.map((prompt) => <button type="button" onClick={() => void ask(prompt)} key={prompt}>{prompt}</button>)}
      </div>

      <section className="magic-console__relay" aria-label={`给${recipient}留话`}>
        <div><strong>想让{recipient}知道点什么？</strong><span>写一句，小魔丸会帮你递过去。</span></div>
        <button type="button" onClick={() => setRelayOpen((current) => !current)}>{relayOpen ? "先不写了" : `给${recipient}留句话`}</button>
        {relayOpen && <form onSubmit={relay}><label className="sr-only" htmlFor="magic-relay">留给对方的话</label><textarea id="magic-relay" value={relayText} onChange={(event) => setRelayText(event.target.value)} placeholder={`想跟${recipient}说什么？`} maxLength={280} rows={3} /><div><small>发出去后，${recipient}打开“最近的事儿”就能看到。</small><button type="submit" disabled={!relayText.trim() || relaying}>{relaying ? "正在递过去…" : "帮我递过去 →"}</button></div></form>}
      </section>

      {notice && <p className="magic-console__privacy" role="status">{notice}</p>}
      {messages.length > 0 && (
        <div className="magic-console__conversation" aria-live="polite">
          <div className="magic-console__conversation-head"><span>刚才聊的</span><button type="button" onClick={() => setMessages([])}>清掉这段</button></div>
          {messages.slice(-6).map((message, index) => (
            <article className={"magic-message magic-message--" + message.role} key={message.role + "-" + index + "-" + message.text.slice(0, 18)}>
              <p>{message.role === "user" ? (member || "你") : "小魔丸"}</p>
              <div className={"magic-answer " + (message.role === "user" ? "magic-answer--user" : "")}>{message.role === "assistant" ? displayBlocks(message.text).map((block, blockIndex) => <p key={blockIndex}>{block}</p>) : message.text}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
