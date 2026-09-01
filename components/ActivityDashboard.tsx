"use client";

import { useCallback, useEffect, useState } from "react";

type ActivityEvent = {
  id: string;
  visitor: string;
  type: "pageview" | "click";
  path: string;
  label?: string;
  destination?: string;
  createdAt: string;
  source?: "live" | "history";
  attribution?: { label: string; confidence: "高" | "中" | "低"; basis: string };
};

type ActivityData = {
  summary: { visitsToday: number; visitorsThisWeek: number; clicksToday: number };
  events: ActivityEvent[];
  privateView?: boolean;
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

function visitorLabel(event: ActivityEvent, privateView: boolean) {
  if (event.attribution) return `${event.attribution.label} · ${event.attribution.confidence}置信`;
  if (privateView) return "待识别";
  return `访客 ${event.visitor.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function eventCopy(event: ActivityEvent) {
  if (event.type === "pageview") return `打开 ${event.path}`;
  return `点击“${event.label || "未命名按钮"}”${event.destination ? ` · ${event.destination}` : ""}`;
}

export function ActivityDashboard() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    setError("");
    try {
      const response = await fetch("/api/activity", { cache: "no-store" });
      const next = await response.json() as ActivityData & { error?: string };
      if (!response.ok || !next.summary || !Array.isArray(next.events)) throw new Error(next.error ?? "load failed");
      setData(next);
    } catch (loadError) {
      setError(loadError instanceof Error && loadError.message ? loadError.message : "访问记录暂时打不开。");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="activity-dashboard" aria-labelledby="activity-dashboard-title" data-activity-ignore>
      <header className="activity-dashboard__header">
        <div><p>ACTIVITY</p><h2 id="activity-dashboard-title">访问与点击</h2><small>历史部分来自服务器保留的独立页面日志；访客以不可逆编号显示。</small></div>
        <button type="button" onClick={() => void load(true)} disabled={refreshing}>{refreshing ? "正在刷新…" : "刷新记录"}</button>
      </header>
      {error && <p className="activity-dashboard__feedback" role="status">{error}</p>}
      {data === null ? <p className="activity-dashboard__empty">正在打开记录…</p> : (
        <>
          <div className="activity-dashboard__summary">
            <article><span>今天打开</span><strong>{data.summary.visitsToday}</strong></article>
            <article><span>近七天访客</span><strong>{data.summary.visitorsThisWeek}</strong></article>
            <article><span>今天点击</span><strong>{data.summary.clicksToday}</strong></article>
          </div>
          {data.events.length === 0 ? <p className="activity-dashboard__empty">从现在开始记录访问和点击。</p> : (
            <div className="activity-dashboard__list">
              {data.events.map((event) => (
                <article key={event.id}>
                  <time dateTime={event.createdAt}>{displayTime(event.createdAt)}</time>
                  <span>{visitorLabel(event, Boolean(data.privateView))}</span>
                  <p>{eventCopy(event)}{event.source === "history" && <b className="activity-dashboard__history">历史日志</b>}{event.attribution && <small className="activity-dashboard__basis">{event.attribution.basis}</small>}</p>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
