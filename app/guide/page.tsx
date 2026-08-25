"use client";

import { useEffect, useState } from "react";
import {
  campusContacts,
  GuideCard,
  GuideSectionId,
  essentialApps,
  guideCards,
} from "@/data/guide";

const freshnessCopy = {
  "长期有效": "可以先放心记着",
  "开学季核验": "开学前再看一眼",
  "请实时查询": "出发前再确认",
} as const;

const guideViews = [
  { id: "arrival", index: "01", title: "落地通勤", description: "从机场到学校，先把这段路走稳。", sections: ["arrival"] },
  { id: "report", index: "02", title: "新生报到", description: "报到、进校、宿舍、校园卡和网络，只做眼前需要的。", sections: ["campus"] },
  { id: "daily", index: "03", title: "生活必需", description: "常用入口，名字和用途留在这儿。", sections: ["nearby", "daily"] },
  { id: "emergency", index: "04", title: "紧急求助", description: "四平路校区常用号码。", sections: ["emergency"] },
] as const satisfies ReadonlyArray<{
  id: "arrival" | "report" | "daily" | "emergency";
  index: string;
  title: string;
  description: string;
  sections: readonly GuideSectionId[];
}>;

type GuideViewId = typeof guideViews[number]["id"];

function guideCopyText(card: GuideCard) {
  return [
    card.title,
    "",
    `一句话结论：${card.summary}`,
    "操作步骤：",
    ...card.steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    `临时有变：${card.backup}`,
    `注意：${card.tip}`,
    `时间判断：${card.time}`,
    `官方入口：${card.actionLabel} ${card.actionUrl}`,
    `来源：${card.source.label} ${card.source.url}`,
    `核验日期：${card.verifiedAt}`,
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
  const [copyFeedback, setCopyFeedback] = useState<{ id: string; message: string } | null>(null);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);

  function copyGuide(card: GuideCard) {
    void copyText(guideCopyText(card))
      .then(() => {
        setCopyFeedback({ id: card.id, message: "已复制" });
        window.setTimeout(() => setCopyFeedback((current) => current?.id === card.id ? null : current), 2200);
      })
      .catch(() => setCopyFeedback({ id: card.id, message: "没复制上，长按这条也可以" }));
  }

  function copyContact(contactId: string, phone: string) {
    void copyText(phone)
      .then(() => {
        setCopyFeedback({ id: contactId, message: "已复制" });
        window.setTimeout(() => setCopyFeedback((current) => current?.id === contactId ? null : current), 2200);
      })
      .catch(() => setCopyFeedback({ id: contactId, message: "再试一次" }));
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
        <h1>思怡的<br /><em>魔都攻略</em></h1>
        <p>按现在要解决的事进入对应板块。</p>
        <div className="guide-hero__choices" aria-label="快速进入攻略">
          {guideViews.map((view) => <button type="button" key={view.id} onClick={() => chooseSection(view.id)}>{view.title} →</button>)}
          <a href="/assistant">临时问题，使用小助手 →</a>
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
          const cards = guideCards.filter((card) => (view.sections as readonly GuideSectionId[]).includes(card.section));
          const isEmergency = view.id === "emergency";
          const isDaily = view.id === "daily";
          return (
            <section className={`guide-section guide-section--${view.id}`} id={`guide-${view.id}`} key={view.id}>
              <header className="guide-section__header"><p>先解决眼前这件 · {view.index}</p><h2>{view.title}</h2><span>{view.description}</span></header>
              {isDaily ? (
                <section className="app-list" aria-label="上海常用 App">
                  {essentialApps.map((app) => (
                    <article className="app-list__item" key={app.id}>
                      <h3>{app.name}</h3>
                      <p>{app.summary}</p>
                    </article>
                  ))}
                </section>
              ) : isEmergency ? (
                <div className="campus-contact-list" aria-label="四平路校区常用号码">
                  {campusContacts.map((contact) => (
                    <article className="campus-contact" key={contact.id}>
                      <span>{contact.name}</span>
                      <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>{contact.phone}</a>
                      <button type="button" onClick={() => copyContact(contact.id, contact.phone)} aria-label={`复制${contact.name}号码`}>
                        {copyFeedback?.id === contact.id ? copyFeedback.message : "复制"}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="guide-cards guide-cards--compact">
                  {cards.map((card) => (
                    <article className="guide-card guide-card--compact" key={card.id}>
                      <div className="guide-card__top"><span className={`freshness freshness--${card.freshness}`}>{freshnessCopy[card.freshness]}</span></div>
                      <h3>{card.title}</h3>
                      <p className="guide-card__summary">{card.summary}</p>
                      <a className="guide-card__go" href={card.actionUrl} target="_blank" rel="noreferrer">{card.actionLabel} ↗</a>
                      <button className="guide-card__details-toggle" type="button" onClick={() => toggleCard(card.id)}>{expandedCards.includes(card.id) ? "收起细节" : "需要再看细一点"}</button>
                      {expandedCards.includes(card.id) && (
                        <div className="guide-card__details">
                          <section className="guide-card__route" aria-label="照着走">
                            <p className="guide-card__detail-label">照着走</p>
                            <ol>{card.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                          </section>
                          <div className="guide-card__note-grid">
                            <section><p className="guide-card__detail-label">时间判断</p><p>{card.time}</p></section>
                            <section><p className="guide-card__detail-label">注意</p><p>{card.tip}</p></section>
                          </div>
                          <aside className="guide-card__backup"><p>临时有变</p><span>{card.backup}</span></aside>
                          <div className="guide-card__detail-actions">
                            <button type="button" onClick={() => copyGuide(card)}>{copyFeedback?.id === card.id ? copyFeedback.message : "复制路线"}</button>
                          </div>
                          <details className="guide-card__sources">
                            <summary>查看来源与核验日期</summary>
                            <div>
                              <a href={card.source.url} target="_blank" rel="noreferrer"><span>官方来源</span>{card.source.label} ↗</a>
                              {card.crossChecks?.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}><span>{source.kind === "经验旁证" ? "实测核验" : "交叉核验"}</span>{source.label} ↗</a>)}
                              <small>核验日期 · {card.verifiedAt}</small>
                            </div>
                          </details>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </section>

      <footer className="molwan-footer guide-footer"><span>临时信息用小助手，固定问题查看攻略。</span><a href="/anniversaries">查看纪念日 →</a></footer>
    </main>
  );
}
