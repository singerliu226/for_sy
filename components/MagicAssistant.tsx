"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useMemberIdentity } from "@/components/MemberIdentity";
import { otherMember, type Member } from "@/lib/members";

type AssistantMessage = { role: "user" | "assistant"; text: string };
type AssistantResponse = { answer: string; relayDraft?: string; saved: boolean; memoryAvailable: boolean };

const quickPrompts = ["我今天有点烦，想说两句。", "这道题我卡住了。", "我有件事拿不准。"];

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "m-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}

function displayBlocks(value: string) {
  return value.replace(/\*\*/g, "").replace(/^\s*#{1,6}\s*/gm, "").replace(/^\s*[-•]\s+/gm, "").trim().split(/\n{2,}/).filter(Boolean);
}

function isAssistantMessage(value: unknown): value is AssistantMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<AssistantMessage>;
  return (item.role === "user" || item.role === "assistant") && typeof item.text === "string";
}

export function MagicAssistant() {
  const { member, loading } = useMemberIdentity();
  const activeMember = useRef<Member | null>(null);
  const [loadedFor, setLoadedFor] = useState<Member | null>(null);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [sessionId, setSessionId] = useState(newId);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [relaying, setRelaying] = useState(false);
  const [relayDraft, setRelayDraft] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    activeMember.current = member;
  }, [member]);

  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => {
      setMessages([]);
      setQuery("");
      setRelayDraft("");
      setNotice("");
      setSessionId(newId());
      setLoadedFor(null);
    }, 0);
    if (!member) return () => window.clearTimeout(timer);

    const controller = new AbortController();
    void fetch("/api/shanghai-guide/chat", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { messages?: unknown; error?: string };
        if (!response.ok || !Array.isArray(result.messages)) throw new Error(result.error ?? "聊天记录暂时打不开。");
        if (activeMember.current !== member) return;
        setMessages(result.messages.filter(isAssistantMessage));
        setLoadedFor(member);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || activeMember.current !== member) return;
        setLoadedFor(member);
        setNotice(error instanceof Error ? error.message : "聊天记录暂时打不开。");
      });
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [member, loading]);

  const ready = Boolean(member && loadedFor === member && !loading);
  const recipient = member ? otherMember(member) : "对方";

  async function ask(question?: string) {
    const message = (question ?? query).trim();
    if (!message || !member || !ready || sending || deleting || relaying) return;
    const account = member;
    setSending(true);
    setNotice("");
    try {
      const response = await fetch("/api/shanghai-guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId: sessionId }),
      });
      const result = await response.json() as AssistantResponse & { error?: string };
      if (!response.ok || !result.answer) throw new Error(result.error ?? "小魔丸没接到这句话。");
      if (activeMember.current !== account) return;
      setMessages((current) => [...current, { role: "user" as const, text: message }, { role: "assistant" as const, text: result.answer }].slice(-24));
      setQuery("");
      setRelayDraft(result.relayDraft ?? "");
      if (!result.saved) setNotice("这次聊完了，但聊天记录没存好。刷新后可能找不到刚才这段。");
      else if (!result.memoryAvailable) setNotice("这次聊天存好了，但刚才没读到以前的对话；你可以补一句背景。");
    } catch (error) {
      if (activeMember.current === account) setNotice(error instanceof Error && error.message ? error.message : "小魔丸这会儿没连上，请稍后再试。");
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
    if (!member || !relayDraft.trim() || relaying || sending) return;
    const account = member;
    setRelaying(true);
    setNotice("");
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: relayDraft.trim() }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "这句话没能递过去。");
      if (activeMember.current !== account) return;
      setRelayDraft("");
      setNotice(`已经发给${otherMember(account)}了，可以在“最近的事儿”里找到。`);
    } catch (error) {
      if (activeMember.current === account) setNotice(error instanceof Error && error.message ? error.message : "这句话没能递过去。");
    } finally {
      setRelaying(false);
    }
  }

  async function forget() {
    if (!member || !ready || sending || relaying || deleting) return;
    if (!window.confirm("要删除你和小魔丸的全部聊天吗？网站上的记录也会一起删掉，不能恢复。留言板里已经发出的传话不会删除。")) return;
    const account = member;
    setDeleting(true);
    setNotice("");
    try {
      const response = await fetch("/api/shanghai-guide/chat", { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "这次没删掉聊天记录。");
      if (activeMember.current !== account) return;
      setMessages([]);
      setRelayDraft("");
      setSessionId(newId());
      setNotice("你和小魔丸的聊天已从网站删除。它不会再拿这些话接着聊。");
    } catch (error) {
      if (activeMember.current === account) setNotice(error instanceof Error ? error.message : "这次没删掉聊天记录。");
    } finally {
      setDeleting(false);
    }
  }

  const visibleMessages = ready ? messages : [];

  return (
    <section className="magic-console magic-console--page" aria-labelledby="magic-title">
      <div className="magic-console__heading">
        <span className="magic-console__orb" aria-hidden="true">丸</span>
        <div><p>小魔丸</p><h2 id="magic-title">想问什么，或者想说什么？</h2></div>
        <span className="magic-console__status"><i />{member ? "我在" : "登录后就能说"}</span>
      </div>
      <p className="magic-console__intro">题不会、心里堵着、事情拿不准，都可以慢慢说。小魔丸知道你是谁，也能接上最近聊过的话；更早的事可能记不住。</p>
      <form onSubmit={submit} className="magic-console__form">
        <label className="sr-only" htmlFor="magic-question">想对小魔丸说的话</label>
        <input id="magic-question" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={member ? `比如：今天有点烦；或者“帮我告诉${recipient}…”` : "先登录，再和小魔丸说话"} autoComplete="off" disabled={!ready || sending || deleting} />
        <button type="submit" disabled={!ready || !query.trim() || sending || deleting}>{sending ? "我在听…" : "说给魔丸听 →"}</button>
      </form>
      <div className="magic-console__prompts">
        {quickPrompts.map((prompt) => <button type="button" onClick={() => void ask(prompt)} disabled={!ready || sending || deleting} key={prompt}>{prompt}</button>)}
      </div>
      {member && <p className="magic-console__privacy">聊天会保存在网站上，大魔王可以在后台查看。想删掉聊天，点下面的“删除我的聊天”；已经发到留言板的话要另行处理。</p>}

      {relayDraft && ready && (
        <form className="magic-console__relay-draft" onSubmit={relay}>
          <div><strong>发给{recipient}之前，你先看看</strong><span>可以改字。只有点“确认传话”后，对方才会收到。</span></div>
          <label className="sr-only" htmlFor="magic-relay-draft">发给{recipient}的话</label>
          <textarea id="magic-relay-draft" value={relayDraft} onChange={(event) => setRelayDraft(event.target.value)} maxLength={280} rows={3} />
          <div className="magic-console__relay-actions"><button type="button" onClick={() => setRelayDraft("")} disabled={relaying}>不发了</button><button type="submit" disabled={!relayDraft.trim() || relaying}>{relaying ? "正在传话…" : "确认传话 →"}</button></div>
        </form>
      )}

      {notice && <p className="magic-console__notice" role="status">{notice} {notice.includes("最近的事儿") && <a href="/messages">去看看 →</a>}</p>}
      {member && !ready && !loading && <p className="magic-console__notice" role="status">正在打开你的聊天记录…</p>}
      {visibleMessages.length > 0 && (
        <div className="magic-console__conversation" aria-live="polite">
          <div className="magic-console__conversation-head"><span>最近聊过的</span><button type="button" disabled={deleting || sending || relaying} onClick={() => void forget()}>{deleting ? "正在删除…" : "删除我的聊天"}</button></div>
          {visibleMessages.map((message, index) => (
            <article className={"magic-message magic-message--" + message.role} key={message.role + "-" + index + "-" + message.text.slice(0, 18)}>
              <p>{message.role === "user" ? member : "小魔丸"}</p>
              <div className={"magic-answer " + (message.role === "user" ? "magic-answer--user" : "")}>{message.role === "assistant" ? displayBlocks(message.text).map((block, blockIndex) => <p key={blockIndex}>{block}</p>) : message.text}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
