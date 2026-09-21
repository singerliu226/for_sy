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

  return (
    <section className="home-room-status" aria-label="小窝近况">
      <a href={page ? "/first-year?entry=" + encodeURIComponent(page.id) : "/first-year"}>
        <span>书桌上的本子</span>
        <strong>{page ? page.title : "还没翻开"}</strong>
        <small>{page ? page.createdBy + "刚开了这一页" : "写一句今天的小事就行"}</small>
      </a>
      <a href="/first-year#little-promises">
        <span>一起做的小事</span>
        <strong>{promise ? promise.title : "还没有约定"}</strong>
        <small>{promise ? displayDate(promise.date) + (promise.checkedBy.length === 2 ? " · 你们都打过勾了" : " · 等对方也打个勾") : "想约就约一件小事"}</small>
      </a>
    </section>
  );
}
