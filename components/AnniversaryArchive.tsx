"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMemberIdentity } from "@/components/MemberIdentity";

type SavedAnniversary = {
  id: string;
  date: string;
  title: string;
  line: string;
  createdBy: string;
  sourcePageId?: string;
};

const qixi = {
  slug: "qixi",
  date: "2026-08-19",
  title: "七夕",
  line: "今夜，银河为思怡降临。",
  note: "一封信、十个片刻，和一座想陪你一起走过的桥。",
};

function displayDate(value: string) {
  const date = new Date(value + "T12:00:00");
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export function AnniversaryArchive() {
  const { member } = useMemberIdentity();
  const [items, setItems] = useState<SavedAnniversary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [line, setLine] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sourcePageId, setSourcePageId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/anniversaries", { cache: "no-store" });
    const data = await response.json() as { items?: SavedAnniversary[]; error?: string };
    if (!response.ok || !Array.isArray(data.items)) throw new Error(data.error ?? "load failed");
    setItems(data.items);
  }

  useEffect(() => {
    const task = window.setTimeout(() => {
      void load().catch(() => setFeedback("纪念柜暂时打不开，刷新一下再试试。"));
      const query = new URLSearchParams(window.location.search);
      const from = query.get("from");
      if (from) {
        setTitle(from.slice(0, 80));
        setLine("从「" + from.slice(0, 80) + "」收进来的这一页。");
        setDate(query.get("date") || new Date().toISOString().slice(0, 10));
        setSourcePageId(query.get("source") || "");
        setShowForm(true);
      }
    }, 0);
    return () => window.clearTimeout(task);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member || saving) {
      if (!member) setFeedback("先在右上角选一下你是谁。");
      return;
    }
    setSaving(true);
    setFeedback("");
    try {
      const response = await fetch("/api/anniversaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, line, date, sourcePageId, author: member }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "这天没能收好。");
      await load();
      setShowForm(false);
      setFeedback("收好了。");
      window.history.replaceState({}, "", "/anniversaries");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "这天没能收好。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="anniversary-list" aria-label="纪念日记录">
      <div className="anniversary-list__top">
        <p className="anniversary-list__label">已收下的日子</p>
        <button type="button" onClick={() => setShowForm((current) => !current)}>{showForm ? "先不收了" : "收进一个日子 →"}</button>
      </div>
      {showForm && (
        <form className="anniversary-create" onSubmit={submit}>
          <label>哪一天？<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label>给它起个名字<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder="比如：一张考试后的晚霞" /></label>
          <label>留一句话<textarea value={line} onChange={(event) => setLine(event.target.value)} maxLength={180} rows={3} placeholder="这天为什么想记下来？" /></label>
          <button type="submit" disabled={!member || saving || !title.trim() || !line.trim()}>{saving ? "正在收好…" : "确认收好"}</button>
        </form>
      )}
      <a className="anniversary-card" href={"/anniversaries/" + qixi.slug}>
        <span className="anniversary-card__index">01</span>
        <div><p>{displayDate(qixi.date)}</p><h2>{qixi.title}</h2><strong>{qixi.line}</strong><span>{qixi.note}</span></div>
        <i aria-hidden="true">↗</i>
      </a>
      {items.map((item, index) => (
        <a className="anniversary-card anniversary-card--saved" href={item.sourcePageId ? "/first-year?entry=" + encodeURIComponent(item.sourcePageId) : "/anniversaries"} key={item.id}>
          <span className="anniversary-card__index">{String(index + 2).padStart(2, "0")}</span>
          <div><p>{displayDate(item.date)}</p><h2>{item.title}</h2><strong>{item.line}</strong><span>{item.createdBy}收进来的</span></div>
          <i aria-hidden="true">{item.sourcePageId ? "↗" : "✦"}</i>
        </a>
      ))}
      {feedback && <p className="anniversary-list__feedback" role="status">{feedback}</p>}
      {!items.length && <p className="anniversary-list__future">以后还有很多天，会慢慢长到这里。</p>}
    </section>
  );
}
