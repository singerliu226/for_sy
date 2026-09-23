"use client";

import { useEffect, useState } from "react";

type RoomData = {
  pages: Array<{ id: string; title: string; createdBy: string; eventDate?: string }>;
  promises: Array<{ id: string; title: string; date: string; checkedBy: string[]; completedAt?: string }>;
};

function displayDate(value?: string) {
  if (!value) return "";
  const date = new Date(value + "T12:00:00");
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(date);
}

export function HomeRoomStatus() {
  const [data, setData] = useState<RoomData | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch("/api/first-year", { cache: "no-store" })
        .then(async (response) => {
          const result = await response.json() as RoomData;
          if (response.ok && Array.isArray(result.pages) && Array.isArray(result.promises)) setData(result);
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const page = data?.pages[0];
  const promise = data?.promises.find((item) => item.checkedBy.length === 2 && !item.completedAt) ?? data?.promises.find((item) => !item.completedAt);
  const pageHint = page
    ? `${page.createdBy}刚写下这页。点进来能看全文，也能在下面接着写。`
    : "点进「第一年」→ 找到“随手记”→ 点“写一条”。今天发生的一件小事，写一句也行。";
  const promiseHint = promise
    ? `${displayDate(promise.date)}${promise.checkedBy.length === 2 ? "，你们都点过“我也打勾”了。" : "，等对方也点一次“我也打勾”就算约好了。"}`
    : "点进「第一年」→ 往下找到“小约定”。写想一起做什么、选好日期；两个人各点一次“我也打勾”就行。";

  return (
    <section className="home-room-status" aria-label="小窝近况">
      <a href={page ? "/first-year?entry=" + encodeURIComponent(page.id) : "/first-year"}>
        <span>{page ? "最近写的" : "想留下一点今天"}</span>
        <strong>{page ? page.title : "去写一页小随手记"}</strong>
        <small>{pageHint}</small>
        {!page && <b>现在去写 →</b>}
      </a>
      <a href="/first-year#little-promises">
        <span>{promise ? "接下来要干啥" : "想约一件小事"}</span>
        <strong>{promise ? promise.title : "去定一个小约定"}</strong>
        <small>{promiseHint}</small>
        {!promise && <b>去约一下 →</b>}
      </a>
    </section>
  );
}
