"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  GuideCard,
  GuideSectionId,
  GuideSource,
  guideCards,
  guideSections,
  quickPrompts,
  findGuideCards,
} from "@/data/guide";

type AssistantMessage = {
  role: "user" | "assistant";
  text: string;
  sources?: GuideSource[];
  status?: string;
  cards?: GuideCard[];
};

type AssistantResponse = {
  answer: string;
  sources: GuideSource[];
  sourceStatus: string;
  cards?: GuideCard[];
};

const storageKeys = {
  saved: "molwan-saved-guides",
  done: "molwan-done-guides",
  note: "molwan-personal-note",
  history: "molwan-assistant-history",
  shortcuts: "molwan-personal-shortcuts",
  recent: "molwan-recent-guides",
};

type PersonalShortcut = { id: string; title: string; detail: string };

function readList(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function readMessages() {
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKeys.history) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is AssistantMessage => (
      item && (item.role === "user" || item.role === "assistant") && typeof item.text === "string"
    )).slice(-8);
  } catch {
    return [];
  }
}

function readShortcuts() {
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKeys.shortcuts) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is PersonalShortcut => (
      item && typeof item.id === "string" && typeof item.title === "string" && typeof item.detail === "string"
    )).slice(0, 12);
  } catch {
    return [];
  }
}

function splitAnswer(answer: string) {
  return answer.split("\n").filter(Boolean);
}

export default function GuidePage() {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<GuideSectionId>("arrival");
  const [saved, setSaved] = useState<string[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [shortcuts, setShortcuts] = useState<PersonalShortcut[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [shortcutTitle, setShortcutTitle] = useState("");
  const [shortcutDetail, setShortcutDetail] = useState("");
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSaved(readList(storageKeys.saved));
    setDone(readList(storageKeys.done));
    setNote(window.localStorage.getItem(storageKeys.note) ?? "");
    setMessages(readMessages());
    setShortcuts(readShortcuts());
    setRecent(readList(storageKeys.recent));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKeys.saved, JSON.stringify(saved));
  }, [ready, saved]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKeys.done, JSON.stringify(done));
  }, [ready, done]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKeys.note, note);
  }, [ready, note]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKeys.history, JSON.stringify(messages.slice(-8)));
  }, [ready, messages]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKeys.shortcuts, JSON.stringify(shortcuts));
  }, [ready, shortcuts]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKeys.recent, JSON.stringify(recent.slice(0, 6)));
  }, [ready, recent]);

  const searchResults = useMemo(() => findGuideCards(query), [query]);
  const savedCards = guideCards.filter((card) => saved.includes(card.id));
  const recentCards = recent.map((id) => guideCards.find((card) => card.id === id)).filter((card): card is GuideCard => Boolean(card));
  const completedCount = done.length;

  function toggleSaved(id: string) {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleDone(id: string) {
    setDone((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    recordRecent(id);
  }

  function recordRecent(id: string) {
    setRecent((current) => [id, ...current.filter((item) => item !== id)].slice(0, 6));
  }

  function addShortcut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = shortcutTitle.trim();
    const detail = shortcutDetail.trim();
    if (!title || !detail) return;
    setShortcuts((current) => [{ id: `${Date.now()}-${title}`, title: title.slice(0, 36), detail: detail.slice(0, 100) }, ...current].slice(0, 12));
    setShortcutTitle("");
    setShortcutDetail("");
  }

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
        { role: "assistant", text: data.answer, sources: data.sources, status: data.sourceStatus, cards: data.cards },
      ].slice(-8));
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "魔丸刚刚没有接上网。先从下面的攻略卡里找最接近的一条，重要的实时信息请点开官方来源确认。",
          status: "已回退到本地攻略",
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

  function chooseSection(section: GuideSectionId) {
    setActiveSection(section);
    window.setTimeout(() => document.getElementById(`guide-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  return (
    <main className="molwan-site guide-site">
      <header className="molwan-nav guide-nav">
        <a href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔丸小助手</span></a>
        <nav aria-label="主导航"><a className="is-current" href="/guide">日常攻略</a><a href="/anniversaries">纪念日</a></nav>
      </header>

      <section className="guide-hero">
        <div className="guide-hero__train" aria-hidden="true"><i /><i /><i /><span /></div>
        <p className="molwan-kicker">SIYI&apos;S SHANGHAI MAP</p>
        <h1>思怡的<br /><em>魔都小助手</em></h1>
        <p>从第一次落地，到后来熟门熟路的每一次出门，魔丸都在这里。</p>
      </section>

      <section className="magic-console" aria-labelledby="magic-title">
        <div className="magic-console__heading">
          <span className="magic-console__orb" aria-hidden="true">丸</span>
          <div><p>MAGIC HELPER</p><h2 id="magic-title">魔丸小助手</h2></div>
          <span className="magic-console__status"><i />优先使用已核验攻略</span>
        </div>
        <form onSubmit={submitQuestion} className="magic-console__form">
          <label className="sr-only" htmlFor="magic-question">问问魔丸小助手</label>
          <input
            id="magic-question"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="比如：我在虹桥 T2，带行李怎么去同济？"
            autoComplete="off"
          />
          <button type="submit" disabled={sending}>{sending ? "魔丸正在找路…" : "问问魔丸 ↗"}</button>
        </form>
        <div className="magic-console__prompts">
          {quickPrompts.map((prompt) => <button type="button" onClick={() => void askAssistant(prompt)} key={prompt}>{prompt}</button>)}
        </div>
        <p className="magic-console__privacy">涉及“今晚、附近、末班”等实时问题会请求联网查询；请不要输入住址、证件、银行卡或实时位置。收藏与备注只留在当前设备。</p>
        {query.trim() && searchResults.length > 0 && (
          <div className="magic-console__matches" aria-live="polite">
            <span>攻略里先找到了</span>
            {searchResults.slice(0, 3).map((card) => (
              <button type="button" onClick={() => chooseSection(card.section)} key={card.id}>{card.title} →</button>
            ))}
          </div>
        )}
        {messages.length > 0 && (
          <div className="magic-console__conversation" aria-live="polite">
            {messages.slice(-4).map((message, index) => (
              <article className={`magic-message magic-message--${message.role}`} key={`${message.role}-${index}-${message.text.slice(0, 18)}`}>
                <p>{message.role === "user" ? "思怡的问题" : "魔丸的回答"}</p>
                <div>{splitAnswer(message.text).map((line) => <span key={line}>{line}</span>)}</div>
                {message.status && <small>{message.status}</small>}
                {message.cards && message.cards.length > 0 && (
                  <div className="magic-message__cards">
                    {message.cards.map((card) => (
                      <button type="button" key={card.id} onClick={() => { recordRecent(card.id); chooseSection(card.section); }}>去看攻略 · {card.title} →</button>
                    ))}
                  </div>
                )}
                {message.sources && message.sources.length > 0 && (
                  <footer>{message.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>来源 · {source.label} ↗</a>)}</footer>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <nav className="guide-index" aria-label="攻略分区">
        {guideSections.map((section) => (
          <button
            className={activeSection === section.id ? "is-active" : ""}
            type="button"
            key={section.id}
            onClick={() => chooseSection(section.id)}
          >
            <span>{section.index}</span>{section.title}
          </button>
        ))}
      </nav>

      <section className="guide-content" aria-label="日常攻略内容">
        {guideSections.map((section) => {
          if (section.id === "saved") {
            return (
              <section className="guide-section guide-section--saved" id="guide-saved" key={section.id}>
                <header className="guide-section__header"><p>{section.eyebrow} · {section.index}</p><h2>{section.title}</h2><span>{section.description}</span></header>
                <div className="personal-desk">
                  <article className="personal-desk__note">
                    <p>给以后的自己留一句话</p>
                    <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={180} placeholder="比如：常用快递点在…… / 这条回宿舍的路晚上更亮。" />
                    <small>只保存在这台设备里</small>
                  </article>
                  <article className="personal-desk__stats"><p>慢慢熟悉的进度</p><strong>{completedCount}<i> / {guideCards.length}</i></strong><span>已经标记完成的攻略</span></article>
                  <article className="personal-desk__saved"><p>我收藏的常用</p>{savedCards.length ? <ul>{savedCards.slice(0, 4).map((card) => <li key={card.id}>{card.title}</li>)}</ul> : <span>看到有用的攻略，点一下“收进常用”就好。</span>}</article>
                  <article className="personal-desk__shortcut">
                    <p>我的地点 / 小提醒</p>
                    <form onSubmit={addShortcut}>
                      <label className="sr-only" htmlFor="shortcut-title">地点或事项名称</label>
                      <input id="shortcut-title" value={shortcutTitle} onChange={(event) => setShortcutTitle(event.target.value)} maxLength={36} placeholder="例如：常用快递点" />
                      <label className="sr-only" htmlFor="shortcut-detail">地点或事项说明</label>
                      <input id="shortcut-detail" value={shortcutDetail} onChange={(event) => setShortcutDetail(event.target.value)} maxLength={100} placeholder="地址、路线或一句提醒" />
                      <button type="submit">收进常用</button>
                    </form>
                    {shortcuts.length > 0 && <ul>{shortcuts.slice(0, 3).map((shortcut) => <li key={shortcut.id}><span><b>{shortcut.title}</b>{shortcut.detail}</span><button type="button" onClick={() => setShortcuts((current) => current.filter((item) => item.id !== shortcut.id))}>移除</button></li>)}</ul>}
                  </article>
                  <article className="personal-desk__recent"><p>最近用过</p>{recentCards.length ? <ul>{recentCards.slice(0, 3).map((card) => <li key={card.id}><button type="button" onClick={() => chooseSection(card.section)}>{card.title} →</button></li>)}</ul> : <span>问过或点开过的攻略，会留在这里。</span>}</article>
                </div>
              </section>
            );
          }

          const cards = guideCards.filter((card) => card.section === section.id);
          return (
            <section className="guide-section" id={`guide-${section.id}`} key={section.id}>
              <header className="guide-section__header"><p>{section.eyebrow} · {section.index}</p><h2>{section.title}</h2><span>{section.description}</span></header>
              <div className="guide-cards">
                {cards.map((card) => (
                  <article className="guide-card" key={card.id}>
                    <div className="guide-card__top"><span className={`freshness freshness--${card.freshness}`}>{card.freshness}</span><button type="button" onClick={() => toggleSaved(card.id)} aria-pressed={saved.includes(card.id)}>{saved.includes(card.id) ? "已收进常用" : "收进常用"}</button></div>
                    <h3>{card.title}</h3>
                    <p className="guide-card__summary">{card.summary}</p>
                    <ol>{card.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                    <dl><div><dt>大约需要</dt><dd>{card.time}</dd></div><div><dt>小提醒</dt><dd>{card.tip}</dd></div></dl>
                    <footer className="guide-card__footer">
                      <a href={card.actionUrl} target="_blank" rel="noreferrer" onClick={() => recordRecent(card.id)}>{card.actionLabel} ↗</a>
                      <a href={card.source.url} target="_blank" rel="noreferrer">来源 · {card.source.label} ↗</a>
                    </footer>
                    {card.quickActions && <div className="guide-card__quick-actions">{card.quickActions.map((action) => <a href={action.url} key={action.url}>{action.label}</a>)}</div>}
                    <small className="guide-card__verified">最近核验 · {card.verifiedAt}</small>
                    <button className={done.includes(card.id) ? "guide-card__done is-done" : "guide-card__done"} type="button" onClick={() => toggleDone(card.id)}>{done.includes(card.id) ? "已经办好啦" : "我已处理"}</button>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </section>

      <footer className="molwan-footer guide-footer"><span>资料会更新，真正走过的路会留下来。</span><a href="/anniversaries">去看看纪念日 →</a></footer>
    </main>
  );
}
