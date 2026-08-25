"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  GuideCard,
  GuideSectionId,
  essentialApps,
  guideCards,
} from "@/data/guide";

const storageKeys = {
  note: "molwan-personal-note",
  shortcuts: "molwan-personal-shortcuts",
  recent: "molwan-recent-guides",
};

type PersonalShortcut = { id: string; title: string; detail: string };

const freshnessCopy = {
  "长期有效": "可以先放心记着",
  "开学季核验": "开学前再看一眼",
  "请实时查询": "出发前再确认",
} as const;

const guideViews = [
  { id: "arrival", index: "01", title: "刚到上海", description: "落地、进学校、报到这些事，先把最要紧的做完。", sections: ["arrival", "campus"] },
  { id: "daily", index: "02", title: "把日常过好", description: "找路、买东西、坐地铁，先让生活顺起来。", sections: ["nearby", "daily"] },
  { id: "emergency", index: "03", title: "现在有事", description: "别看长篇解释，先点最下面那个能帮到你的按钮。", sections: ["emergency"] },
  { id: "saved", index: "04", title: "我的常用", description: "慢慢把你真正用得上的地方留在这里。", sections: ["saved"] },
] as const satisfies ReadonlyArray<{
  id: "arrival" | "daily" | "emergency" | "saved";
  index: string;
  title: string;
  description: string;
  sections: readonly GuideSectionId[];
}>;

type GuideViewId = typeof guideViews[number]["id"];

function viewForSection(section: GuideSectionId): GuideViewId {
  if (section === "arrival" || section === "campus") return "arrival";
  if (section === "nearby" || section === "daily") return "daily";
  if (section === "emergency") return "emergency";
  return "saved";
}

function readList(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
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

function guideCopyText(card: GuideCard) {
  return [
    card.title,
    "",
    `我先跟你说：${card.summary}`,
    "我帮你顺好的路：",
    ...card.steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    `要是临时有变：${card.backup}`,
    `我想提醒你：${card.tip}`,
    `大概多久：${card.time}`,
    `现在就看：${card.actionLabel} ${card.actionUrl}`,
    `我留的来源：${card.source.label} ${card.source.url}`,
    `我上次核对：${card.verifiedAt}`,
  ].join("\n");
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error("copy failed");
}

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState<GuideViewId>("arrival");
  const [note, setNote] = useState("");
  const [shortcuts, setShortcuts] = useState<PersonalShortcut[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [shortcutTitle, setShortcutTitle] = useState("");
  const [shortcutDetail, setShortcutDetail] = useState("");
  const [shortcutFeedback, setShortcutFeedback] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<{ id: string; message: string } | null>(null);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setNote(window.localStorage.getItem(storageKeys.note) ?? "");
    setShortcuts(readShortcuts());
    setRecent(readList(storageKeys.recent));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKeys.note, note);
  }, [ready, note]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKeys.shortcuts, JSON.stringify(shortcuts));
  }, [ready, shortcuts]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKeys.recent, JSON.stringify(recent.slice(0, 6)));
  }, [ready, recent]);

  const recentCards = recent.map((id) => guideCards.find((card) => card.id === id)).filter((card): card is GuideCard => Boolean(card));

  function recordRecent(id: string) {
    setRecent((current) => [id, ...current.filter((item) => item !== id)].slice(0, 6));
  }

  function addShortcut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = shortcutTitle.trim();
    const detail = shortcutDetail.trim();
    if (!title || !detail) {
      setShortcutFeedback("先把名字和提醒写上，我才能替你留住它。");
      return;
    }
    setShortcuts((current) => [{ id: `${Date.now()}-${title}`, title: title.slice(0, 36), detail: detail.slice(0, 100) }, ...current].slice(0, 12));
    setShortcutTitle("");
    setShortcutDetail("");
    setShortcutFeedback("替你留好了，下次不用重新想。");
  }

  function copyGuide(card: GuideCard) {
    void copyText(guideCopyText(card))
      .then(() => {
        setCopyFeedback({ id: card.id, message: "已复制" });
        recordRecent(card.id);
        window.setTimeout(() => setCopyFeedback((current) => current?.id === card.id ? null : current), 2200);
      })
      .catch(() => setCopyFeedback({ id: card.id, message: "没复制上，长按这条也可以" }));
  }

  useEffect(() => {
    function updateActiveSection() {
      const marker = window.innerHeight * 0.4;
      const closest = guideViews
        .map((section) => ({ section, element: document.getElementById(`guide-${section.id}`) }))
        .filter((item): item is { section: typeof guideViews[number]; element: HTMLElement } => Boolean(item.element))
        .reduce<{ section: typeof guideViews[number]; distance: number } | null>((best, item) => {
          const distance = Math.abs(item.element.getBoundingClientRect().top - marker);
          return !best || distance < best.distance ? { section: item.section, distance } : best;
        }, null);
      if (closest) setActiveSection(closest.section.id);
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  function chooseSection(section: GuideViewId) {
    setActiveSection(section);
    window.setTimeout(() => document.getElementById(`guide-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function toggleCard(cardId: string) {
    setExpandedCards((current) => current.includes(cardId) ? current.filter((id) => id !== cardId) : [...current, cardId]);
  }

  return (
    <main className="molwan-site guide-site">
      <header className="molwan-nav guide-nav">
        <a href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔丸小助手</span></a>
        <nav aria-label="主导航"><a href="/assistant">小助手</a><a className="is-current" href="/guide">魔都攻略</a><a href="/anniversaries">纪念日</a></nav>
      </header>

      <section className="guide-hero">
        <div className="guide-hero__train" aria-hidden="true"><i /><i /><i /><span /></div>
        <p className="molwan-kicker">SIYI&apos;S SHANGHAI GUIDE</p>
        <h1>我给你留的<br /><em>魔都攻略</em></h1>
        <p>不用把所有事都看完。你现在要解决哪件，就点哪一块。</p>
        <div className="guide-hero__choices" aria-label="快速进入攻略">
          {guideViews.slice(0, 3).map((view) => <button type="button" key={view.id} onClick={() => chooseSection(view.id)}>{view.title} →</button>)}
          <a href="/assistant">还不知道怎么办，就跟我说 →</a>
        </div>
      </section>

      <nav className="guide-float-nav" aria-label="攻略分区">
        {guideViews.map((section) => (
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

      <section className="guide-content" aria-label="魔都攻略内容">
        {guideViews.map((view) => {
          if (view.id === "saved") {
            return (
              <section className="guide-section guide-section--saved" id="guide-saved" key={view.id}>
                <header className="guide-section__header"><p>留给自己 · {view.index}</p><h2>{view.title}</h2><span>{view.description}</span></header>
                <div className="personal-desk">
                  <article className="personal-desk__note">
                    <p>给以后的自己留句话</p>
                    <label className="sr-only" htmlFor="personal-note">给以后的自己留句话</label>
                    <textarea id="personal-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={180} placeholder="比如：常用快递点在…… / 这条回宿舍的路晚上更亮。" />
                    <small>悄悄留在这台设备里</small>
                  </article>
                  <article className="personal-desk__shortcut">
                    <p>我的地点 / 小提醒</p>
                    <form onSubmit={addShortcut}>
                      <label className="sr-only" htmlFor="shortcut-title">地点或事项名称</label>
                      <input id="shortcut-title" value={shortcutTitle} onChange={(event) => setShortcutTitle(event.target.value)} maxLength={36} placeholder="例如：常用快递点" />
                      <label className="sr-only" htmlFor="shortcut-detail">地点或事项说明</label>
                      <input id="shortcut-detail" value={shortcutDetail} onChange={(event) => setShortcutDetail(event.target.value)} maxLength={100} placeholder="地址、路线或一句提醒" />
                      <button type="submit">保存提醒</button>
                    </form>
                    {shortcutFeedback && <small className="personal-desk__feedback" aria-live="polite">{shortcutFeedback}</small>}
                    {shortcuts.length > 0 && <ul>{shortcuts.slice(0, 3).map((shortcut) => <li key={shortcut.id}><span><b>{shortcut.title}</b>{shortcut.detail}</span><button type="button" onClick={() => setShortcuts((current) => current.filter((item) => item.id !== shortcut.id))}>移除</button></li>)}</ul>}
                  </article>
                  <article className="personal-desk__recent"><p>你最近翻过</p>{recentCards.length ? <ul>{recentCards.slice(0, 3).map((card) => <li key={card.id}><button type="button" onClick={() => chooseSection(viewForSection(card.section))}>{card.title} →</button></li>)}</ul> : <span>你问过或点开过的，会留在这里。</span>}</article>
                </div>
              </section>
            );
          }

          const cards = guideCards.filter((card) => (view.sections as readonly GuideSectionId[]).includes(card.section));
          const isEmergency = view.id === "emergency";
          return (
            <section className={`guide-section guide-section--${view.id}`} id={`guide-${view.id}`} key={view.id}>
              <header className="guide-section__header"><p>先解决眼前这件 · {view.index}</p><h2>{view.title}</h2><span>{view.description}</span></header>
              {isEmergency && <div className="emergency-intro"><strong>真的着急时，先点电话。</strong><span>别看细节，先让身边有人知道你在哪里、发生了什么。</span></div>}
              {view.id === "daily" && (
                <section className="app-kit" aria-labelledby="app-kit-title">
                  <details className="app-kit__details">
                    <summary><p>别为了“必备”瞎下载</p><h3 id="app-kit-title">上海刚来，只留这 3 个入口</h3><span>支付宝、微信、高德和外卖 App 已经有就继续用；真正能补上信息差的，是上海交通、城市办事和同济官方入口。</span><b>展开 →</b></summary>
                    <div className="app-kit__grid">
                      {essentialApps.map((app) => (
                        <article className="app-kit__card" key={app.id}>
                          <span>{app.badge}</span><h4>{app.name}</h4><p>{app.summary}</p><dl><div><dt>什么时候用</dt><dd>{app.when}</dd></div><div><dt>小提醒</dt><dd>{app.tip}</dd></div></dl>
                          <footer>
                            <a href={app.actionUrl} target="_blank" rel="noreferrer">{app.actionLabel} ↗</a>
                            <a href={app.source.url} target="_blank" rel="noreferrer">我查到的官方入口 ↗</a>
                            {app.crossChecks?.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.kind === "经验旁证" ? "顺手看过的经验" : "我再核了一遍"} · {source.label} ↗</a>)}
                          </footer><small>我上次核对 · {app.verifiedAt}</small>
                        </article>
                      ))}
                    </div>
                  </details>
                </section>
              )}
              <div className={`guide-cards guide-cards--compact ${isEmergency ? "guide-cards--emergency" : ""}`}>
                {cards.map((card) => (
                  <article className={`guide-card guide-card--compact ${isEmergency ? "guide-card--emergency" : ""}`} key={card.id}>
                    <div className="guide-card__top"><span className={`freshness freshness--${card.freshness}`}>{freshnessCopy[card.freshness]}</span></div>
                    <h3>{card.title}</h3>
                    <p className="guide-card__summary">{card.summary}</p>
                    {isEmergency && card.quickActions?.length ? (
                      <div className="emergency-card__actions">{card.quickActions.map((action) => <a href={action.url} key={action.url}>{action.label}</a>)}</div>
                    ) : (
                      <a className="guide-card__go" href={card.actionUrl} target="_blank" rel="noreferrer" onClick={() => recordRecent(card.id)}>{isEmergency ? "现在就处理 ↗" : `${card.actionLabel} ↗`}</a>
                    )}
                    <button className="guide-card__details-toggle" type="button" onClick={() => toggleCard(card.id)}>{expandedCards.includes(card.id) ? "收起细节" : "需要再看细一点"}</button>
                    {expandedCards.includes(card.id) && (
                      <div className="guide-card__details">
                        <ol>{card.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                        <dl><div><dt>大概多久</dt><dd>{card.time}</dd></div><div><dt>我想提醒你</dt><dd>{card.tip}</dd></div></dl>
                        <p className="guide-card__backup"><b>要是临时有变：</b>{card.backup}</p>
                        <footer className="guide-card__footer">
                          <button type="button" onClick={() => copyGuide(card)}>{copyFeedback?.id === card.id ? copyFeedback.message : "复制这条"}</button>
                          <a href={card.source.url} target="_blank" rel="noreferrer">我帮你留的官方链接 · {card.source.label} ↗</a>
                          {card.crossChecks?.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.kind === "经验旁证" ? "顺手看过的经验" : "我再核了一遍"} · {source.label} ↗</a>)}
                        </footer>
                        <small className="guide-card__verified">我上次核对 · {card.verifiedAt}</small>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </section>

      <footer className="molwan-footer guide-footer"><span>路会越走越熟，你也会越来越像在这里生活。</span><a href="/anniversaries">去看看我们记下的日子 →</a></footer>
    </main>
  );
}
