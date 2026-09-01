"use client";

import { useCallback, useEffect, useState } from "react";

type AuditRecord = {
  id: string;
  conversationId: string;
  initiator: "思怡" | "魔王";
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  origin: "live" | "browser-recovery";
  timeKnown: boolean;
  status?: string;
};

function displayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间未知";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function AssistantAuditDashboard() {
  const [records, setRecords] = useState<AuditRecord[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    setError("");
    try {
      const response = await fetch("/api/owner/assistant-records", { cache: "no-store" });
      const data = await response.json() as { records?: AuditRecord[]; error?: string };
      if (!response.ok || !Array.isArray(data.records)) throw new Error(data.error ?? "load failed");
      setRecords(data.records);
    } catch (loadError) {
      setError(loadError instanceof Error && loadError.message ? loadError.message : "对话档案暂时打不开。");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="assistant-audit" aria-labelledby="assistant-audit-title" data-activity-ignore>
      <header className="assistant-audit__header">
        <div><p>CONVERSATIONS</p><h2 id="assistant-audit-title">小助手对话档案</h2><small>每次新对话记录发起人、提问、回答与保存时间；浏览器旧缓存不含原始时间，会单独标记。</small></div>
        <button type="button" onClick={() => void load(true)} disabled={refreshing}>{refreshing ? "正在刷新…" : "刷新记录"}</button>
      </header>
      {error && <p className="assistant-audit__feedback" role="status">{error}</p>}
      {records === null ? <p className="assistant-audit__empty">正在打开对话档案…</p> : records.length === 0 ? <p className="assistant-audit__empty">新对话会从现在开始保存在这里；打开小助手页后，会自动尝试收回这台设备尚存的旧记录。</p> : (
        <div className="assistant-audit__list">
          {records.map((record) => (
            <article className={`assistant-audit__item assistant-audit__item--${record.role}`} key={record.id}>
              <header><span>{record.initiator} · {record.role === "user" ? "提问" : "小助手回答"}</span><time dateTime={record.createdAt}>{record.timeKnown ? displayTime(record.createdAt) : `导入时间 · ${displayTime(record.createdAt)}`}</time></header>
              <p>{record.text}</p>
              {record.status && <small>{record.status}</small>}
              {record.origin === "browser-recovery" && <b>此浏览器旧缓存</b>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
