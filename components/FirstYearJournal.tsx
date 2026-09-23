"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageBoard } from "@/components/MessageBoard";
import { useMemberIdentity } from "@/components/MemberIdentity";
import type { Member } from "@/lib/members";

type FirstYearPage = {
  id: string;
  title: string;
  prompt?: string;
  eventDate?: string;
  createdBy: Member;
  createdAt: string;
};

type LittlePromise = {
  id: string;
  title: string;
  date: string;
  createdBy: Member;
  createdAt: string;
  checkedBy: Member[];
  completedAt?: string;
};

type FirstYearData = {
  pages: FirstYearPage[];
  promises: LittlePromise[];
};

const prompts = [
  "给你看看我现在的桌子",
  "拍张现在看到的天空",
  "今天有件事想吐槽",
  "终于把这个搞定了",
  "这首歌你听一下",
  "下次见面想吃什么？",
];

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function displayDate(value: string) {
  const date = new Date(value + (value.length === 10 ? "T12:00:00" : ""));
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
  return Array.from({ length: start + count }, (_, index) => {
    if (index < start) return null;
    return new Date(month.getFullYear(), month.getMonth(), index - start + 1);
  });
}

export function FirstYearJournal() {
  const { member } = useMemberIdentity();
  const [data, setData] = useState<FirstYearData | null>(null);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(dateKey(new Date()));
  const [promiseTitle, setPromiseTitle] = useState("");
  const [promiseDate, setPromiseDate] = useState(dateKey(new Date()));
  const [saving, setSaving] = useState("");

  async function load() {
    const response = await fetch("/api/first-year", { cache: "no-store" });
    const next = await response.json() as FirstYearData & { error?: string };
    if (!response.ok || !Array.isArray(next.pages) || !Array.isArray(next.promises)) throw new Error(next.error ?? "load failed");
    setData(next);
    setSelectedId((current) => current || next.pages[0]?.id || "");
    setError("");
  }

  useEffect(() => {
    const task = window.setTimeout(() => {
      void load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "手账暂时打不开。"));
      try {
        const requested = new URLSearchParams(window.location.search).get("entry");
        if (requested) setSelectedId(requested);
      } catch {
        // The list view still works if the browser does not expose a URL.
      }
    }, 0);
    return () => window.clearTimeout(task);
  }, []);

  const selectedPage = useMemo(
    () => data?.pages.find((page) => page.id === selectedId) ?? data?.pages[0] ?? null,
    [data, selectedId],
  );
  const monthDays = useMemo(() => calendarDays(month), [month]);
  const selectedDayItems = useMemo(() => {
    if (!data) return [];
    return [
      ...data.promises.filter((item) => item.date === selectedDate).map((item) => ({ id: item.id, title: item.title, kind: "约定", done: Boolean(item.completedAt) })),
      ...data.pages.filter((item) => item.eventDate === selectedDate).map((item) => ({ id: item.id, title: item.title, kind: "手账", done: false })),
    ];
  }, [data, selectedDate]);

  async function post(body: Record<string, unknown>) {
    const response = await fetch("/api/first-year", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json() as { error?: string; page?: FirstYearPage; promise?: LittlePromise };
    if (!response.ok) throw new Error(result.error ?? "这次没能保存。");
    await load();
    return result;
  }

  async function createPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member || saving) return;
    setSaving("page");
    setError("");
    try {
      const result = await post({ action: "create-page", title, prompt: title, eventDate, author: member });
      if (result.page) setSelectedId(result.page.id);
      setTitle("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "这页没能打开。");
    } finally {
      setSaving("");
    }
  }

  async function createPromise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member || saving) return;
    setSaving("promise");
    setError("");
    try {
      await post({ action: "create-promise", title: promiseTitle, date: promiseDate, author: member });
      setPromiseTitle("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "这件事没能记下来。");
    } finally {
      setSaving("");
    }
  }

  async function checkPromise(id: string) {
    if (!member || saving) return;
    setSaving(id);
    setError("");
    try {
      await post({ action: "check-promise", id, author: member });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "这次没能打勾。");
    } finally {
      setSaving("");
    }
  }

  async function hidePage() {
    if (!member || !selectedPage || saving) return;
    if (!window.confirm("把这一页收起来？之后不会出现在手账里。")) return;
    setSaving(selectedPage.id);
    setError("");
    try {
      await post({ action: "hide-page", id: selectedPage.id, author: member });
      setSelectedId("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "这页没能收起来。");
    } finally {
      setSaving("");
    }
  }

  return (
    <section className="first-year-journal" aria-labelledby="first-year-journal-title">
      <section className="first-year-journal__intro">
        <p>随手记</p>
        <h2 id="first-year-journal-title">这周过得咋样？</h2>
        <span>想说啥就写两句。</span>
      </section>

      {error && <p className="first-year-journal__feedback" role="status">{error}</p>}

      <div className="first-year-journal__grid">
        <section className="journal-stack" aria-label="手账目录">
          <div className="journal-stack__heading">
            <div><p>随手记</p><h3>最近留下的</h3></div>
            <a href="#new-journal-page">写一条 →</a>
          </div>
          {data === null ? <p className="journal-stack__empty">正在翻开本子…</p> : data.pages.length === 0 ? (
            <p className="journal-stack__empty">还没人写。你先来一句？</p>
          ) : (
            <div className="journal-stack__list">
              {data.pages.map((page) => (
                <button className={selectedPage?.id === page.id ? "is-active" : ""} type="button" key={page.id} onClick={() => setSelectedId(page.id)}>
                  <span>{page.createdBy}</span><strong>{page.title}</strong><small>{displayDate(page.eventDate || page.createdAt)}</small>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="journal-page">
          {selectedPage ? (
            <>
              <header className="journal-page__header">
                <div><p>{selectedPage.createdBy}开的这一页 · {displayDate(selectedPage.eventDate || selectedPage.createdAt)}</p><h3>{selectedPage.title}</h3></div>
                {member && <div className="journal-page__actions"><a href={"/assistant?from=" + encodeURIComponent(selectedPage.title)}>问小魔丸</a><a href={"/anniversaries?from=" + encodeURIComponent(selectedPage.title) + "&date=" + encodeURIComponent(selectedPage.eventDate || selectedPage.createdAt.slice(0, 10)) + "&source=" + encodeURIComponent(selectedPage.id)}>收进纪念日</a><button type="button" onClick={hidePage} disabled={saving === selectedPage.id}>收起来</button></div>}
              </header>
              <p className="journal-page__note">想写字、发照片，或者留段语音，都可以。</p>
              <MessageBoard context={{ type: "first-year", id: selectedPage.id, title: selectedPage.title }} />
            </>
          ) : (
            <div className="journal-page__blank"><span>✦</span><h3>这儿还空着。</h3><p>左边点一条，或者自己写个开头。</p></div>
          )}
        </section>
      </div>

      <section className="first-year-create" id="new-journal-page">
        <div>
          <p>开一页</p>
          <h3>今天想写点什么？</h3>
          <div className="first-year-create__prompts">{prompts.map((prompt) => <button type="button" onClick={() => setTitle(prompt)} key={prompt}>{prompt}</button>)}</div>
        </div>
        <form onSubmit={createPage}>
          <label>这一页的名字<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="比如：今天终于把这题弄明白了" maxLength={80} /></label>
          <label>想记在哪天<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label>
          <button type="submit" disabled={!member || !title.trim() || saving === "page"}>{saving === "page" ? "正在打开…" : member ? "开这一页 →" : "先选一下你是谁"}</button>
        </form>
      </section>

      <section className="little-promises" id="little-promises" aria-labelledby="little-promises-title">
        <div className="little-promises__heading">
          <p>一起做的小事</p>
          <h3 id="little-promises-title">挑个日子，<em>打个勾。</em></h3>
        </div>
        <div className="little-promises__layout">
          <section className="promise-calendar" aria-label={monthName(month) + "日历"}>
            <header><button type="button" onClick={() => setMonth((current) => shiftMonth(current, -1))} aria-label="上个月">←</button><strong>{monthName(month)}</strong><button type="button" onClick={() => setMonth((current) => shiftMonth(current, 1))} aria-label="下个月">→</button></header>
            <div className="promise-calendar__week"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
            <div className="promise-calendar__days">
              {monthDays.map((day, index) => {
                if (!day) return <span className="is-blank" key={"blank-" + index} />;
                const key = dateKey(day);
                const hasItem = data ? data.promises.some((item) => item.date === key) || data.pages.some((item) => item.eventDate === key) : false;
                return <button type="button" className={(selectedDate === key ? "is-selected " : "") + (hasItem ? "has-item" : "")} key={key} onClick={() => setSelectedDate(key)}><span>{day.getDate()}</span></button>;
              })}
            </div>
          </section>
          <section className="promise-day">
            <p>{displayDate(selectedDate)}</p>
            {selectedDayItems.length ? selectedDayItems.map((item) => <article key={item.kind + item.id}><span>{item.kind}</span><strong>{item.title}</strong>{item.done && <small>已经一起打过勾了</small>}</article>) : <span>这天还空着。</span>}
          </section>
        </div>
        <div className="promise-list">
          {data?.promises.length ? data.promises.map((item) => {
            const bothChecked = item.checkedBy.length === 2;
            const mineChecked = member ? item.checkedBy.includes(member) : false;
            return <article className={bothChecked ? "is-done" : ""} key={item.id}><time>{displayDate(item.date)}</time><strong>{item.title}</strong><span>{bothChecked ? "你们都打过勾了" : item.checkedBy.join("、") + " 已打勾"}</span><button type="button" disabled={!member || mineChecked || Boolean(item.completedAt) || saving === item.id} onClick={() => void checkPromise(item.id)}>{bothChecked ? "✓" : mineChecked ? "已打勾" : "我也打勾"}</button></article>;
          }) : <p className="promise-list__empty">还没约好。一起听首歌、考完吃顿饭，都可以记下来。</p>}
        </div>
        <form className="promise-form" onSubmit={createPromise}>
          <label>想一起做什么？<input value={promiseTitle} onChange={(event) => setPromiseTitle(event.target.value)} placeholder="比如：周六晚上各挑一部电影" maxLength={100} /></label>
          <label>哪一天？<input type="date" value={promiseDate} onChange={(event) => setPromiseDate(event.target.value)} /></label>
          <button type="submit" disabled={!member || !promiseTitle.trim() || saving === "promise"}>{saving === "promise" ? "正在记下…" : "记到日历里"}</button>
        </form>
      </section>
    </section>
  );
}
