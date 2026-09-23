"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMemberIdentity } from "@/components/MemberIdentity";
import type { Member } from "@/lib/members";

type LittlePromise = {
  id: string;
  title: string;
  date: string;
  createdBy: Member;
  createdAt: string;
  checkedBy: Member[];
  approvedAt?: string;
};

type FirstYearData = { promises: LittlePromise[] };

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function displayDate(value: string) {
  const date = new Date(value + "T12:00:00");
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(date);
}

function monthName(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(date);
}

function shiftMonth(current: Date, by: number) {
  return new Date(current.getFullYear(), current.getMonth() + by, 1);
}

function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = first.getDay();
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: start + count }, (_, index) => index < start ? null : new Date(month.getFullYear(), month.getMonth(), index - start + 1));
}

function isApproved(item: LittlePromise) {
  return Boolean(item.approvedAt) || item.checkedBy.length === 2;
}

export function FirstYearJournal() {
  const { member, loading } = useMemberIdentity();
  const [data, setData] = useState<FirstYearData | null>(null);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [promiseTitle, setPromiseTitle] = useState("");
  const [promiseDate, setPromiseDate] = useState(dateKey(new Date()));
  const [saving, setSaving] = useState("");

  async function load() {
    const response = await fetch("/api/first-year", { cache: "no-store" });
    const next = await response.json() as FirstYearData & { error?: string };
    if (!response.ok || !Array.isArray(next.promises)) throw new Error(next.error ?? "共同日程暂时打不开。");
    setData(next);
    setError("");
  }

  useEffect(() => {
    if (loading || !member) return;
    const task = window.setTimeout(() => void load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "共同日程暂时打不开。")), 0);
    return () => window.clearTimeout(task);
  }, [loading, member]);

  const approved = useMemo(() => (data?.promises ?? []).filter(isApproved), [data]);
  const waiting = useMemo(() => (data?.promises ?? []).filter((item) => !isApproved(item)), [data]);
  const monthDays = useMemo(() => calendarDays(month), [month]);
  const selectedDayItems = useMemo(() => approved.filter((item) => item.date === selectedDate), [approved, selectedDate]);

  async function post(body: Record<string, unknown>) {
    const response = await fetch("/api/first-year", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json() as { error?: string };
    if (!response.ok) throw new Error(result.error ?? "这次没能记下来。");
    await load();
  }

  async function createPromise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member || saving) return;
    setSaving("new");
    setError("");
    try {
      await post({ action: "create-promise", title: promiseTitle, date: promiseDate });
      setPromiseTitle("");
      setSelectedDate(promiseDate);
      const selected = new Date(promiseDate + "T12:00:00");
      setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "这件事没能记下来。");
    } finally {
      setSaving("");
    }
  }

  async function vote(id: string) {
    if (!member || saving) return;
    setSaving(id);
    setError("");
    try {
      await post({ action: "check-promise", id });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "这次没能同意。");
    } finally {
      setSaving("");
    }
  }

  if (loading) return <section className="first-year-journal"><p className="first-year-journal__feedback">正在打开小约定…</p></section>;
  if (!member) return <section className="first-year-journal"><section className="first-year-journal__intro"><p>我们的小约定</p><h2>先登录，<em>再把日子约起来。</em></h2><span>登录后，发起和同意都会自动记在自己的名字下。</span></section><a className="first-year-login" href="/login">去登录 →</a></section>;

  return (
    <section className="first-year-journal" aria-labelledby="first-year-journal-title">
      <section className="first-year-journal__intro">
        <p>我们的小约定</p>
        <h2 id="first-year-journal-title">想一起做的事，<em>先在这儿约好。</em></h2>
        <span>写下日期和这件事；两个人都点“同意”后，它才会放进共同日程。</span>
      </section>
      {error && <p className="first-year-journal__feedback" role="status">{error}</p>}

      <section className="promise-create" aria-labelledby="promise-create-title">
        <div><p>先提一件事</p><h3 id="promise-create-title">我们哪天去做什么？</h3><span>你发起以后，会先等对方点头；没通过前，不会挤进日程。</span></div>
        <form className="promise-form" onSubmit={createPromise}>
          <label>想一起做什么？<input value={promiseTitle} onChange={(event) => setPromiseTitle(event.target.value)} placeholder="比如：中秋晚上一起看月亮" maxLength={100} /></label>
          <label>哪一天？<input type="date" value={promiseDate} onChange={(event) => setPromiseDate(event.target.value)} /></label>
          <button type="submit" disabled={!promiseTitle.trim() || saving === "new"}>{saving === "new" ? "正在发出…" : "发起这个约定"}</button>
        </form>
      </section>

      <section className="promise-waiting" aria-labelledby="promise-waiting-title">
        <header><p>等你们点头的</p><h3 id="promise-waiting-title">还没约好的事</h3></header>
        {data === null ? <p className="promise-list__empty">正在看看有没有新约定…</p> : waiting.length ? <div className="promise-list">{waiting.map((item) => {
          const mineVoted = item.checkedBy.includes(member);
          return <article key={item.id}><time>{displayDate(item.date)}</time><strong>{item.title}</strong><span>{mineVoted ? "你已经同意了，等对方。" : `${item.createdBy}想和你约这件事。`}</span><button type="button" disabled={mineVoted || saving === item.id} onClick={() => void vote(item.id)}>{mineVoted ? "等对方同意" : saving === item.id ? "正在确认…" : "我同意"}</button></article>;
        })}</div> : <p className="promise-list__empty">还没有。想到了就先提一件。</p>}
      </section>

      <section className="little-promises" id="little-promises" aria-labelledby="little-promises-title">
        <div className="little-promises__heading"><p>两个人都点过头的</p><h3 id="little-promises-title">共同<em>日程</em></h3></div>
        <div className="little-promises__layout">
          <section className="promise-calendar" aria-label={monthName(month) + "日历"}>
            <header><button type="button" onClick={() => setMonth((current) => shiftMonth(current, -1))} aria-label="上个月">←</button><strong>{monthName(month)}</strong><button type="button" onClick={() => setMonth((current) => shiftMonth(current, 1))} aria-label="下个月">→</button></header>
            <div className="promise-calendar__week"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
            <div className="promise-calendar__days">{monthDays.map((day, index) => {
              if (!day) return <span className="is-blank" key={`blank-${index}`} />;
              const key = dateKey(day);
              const hasItem = approved.some((item) => item.date === key);
              return <button type="button" className={(selectedDate === key ? "is-selected " : "") + (hasItem ? "has-item" : "")} key={key} onClick={() => setSelectedDate(key)}><span>{day.getDate()}</span></button>;
            })}</div>
          </section>
          <section className="promise-day"><p>{displayDate(selectedDate)}</p>{selectedDayItems.length ? selectedDayItems.map((item) => <article key={item.id}><span>已约好</span><strong>{item.title}</strong><small>你们都同意了。</small></article>) : <span>这天还没有约定。</span>}</section>
        </div>
      </section>
    </section>
  );
}
