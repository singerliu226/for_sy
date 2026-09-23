"use client";

import { useEffect } from "react";

const visitorStorageKey = "molwan-anonymous-visitor";
let temporaryVisitorId = "";

type ActivityKind = "pageview" | "click";

function makeVisitorId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `v-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function visitorId() {
  try {
    const saved = window.localStorage.getItem(visitorStorageKey);
    if (saved && /^[a-z0-9-]{16,64}$/i.test(saved)) return saved;
    const next = makeVisitorId();
    window.localStorage.setItem(visitorStorageKey, next);
    return next;
  } catch {
    if (!temporaryVisitorId) temporaryVisitorId = makeVisitorId();
    return temporaryVisitorId;
  }
}

function cleanText(value: string, limit: number) {
  return value.replace(/[\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

function currentPath() {
  return window.location.pathname.slice(0, 160) || "/";
}

function clickDestination(control: HTMLElement) {
  if (!(control instanceof HTMLAnchorElement) || !control.href) return "";
  try {
    const url = new URL(control.href, window.location.href);
    return url.origin === window.location.origin ? url.pathname.slice(0, 160) : url.hostname.slice(0, 90);
  } catch {
    return "";
  }
}

function sendActivity(visitor: string, type: ActivityKind, label = "", destination = "") {
  void fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitor, type, path: currentPath(), label, destination }),
    keepalive: true,
  }).catch(() => undefined);
}

export function ActivityTracker() {
  useEffect(() => {
    if (window.location.pathname === "/dashboard" || window.location.pathname.startsWith("/owner")) return;

    const visitor = visitorId();
    sendActivity(visitor, "pageview");

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest<HTMLElement>("a, button, [role='button']");
      if (!control || control.closest("[data-activity-ignore], input, textarea, select, [contenteditable='true']")) return;
      const label = cleanText(control.getAttribute("data-activity-label") ?? control.getAttribute("aria-label") ?? control.textContent ?? "", 90);
      if (!label) return;
      sendActivity(visitor, "click", label, clickDestination(control));
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
