"use client";

import { useCallback, useEffect, useState } from "react";
import type { Member } from "@/lib/members";

export const memberStorageKey = "mozu-member-account-v1";

function saveMember(member: Member | null, notify = false) {
  try {
    if (member) window.localStorage.setItem(memberStorageKey, member);
    else window.localStorage.removeItem(memberStorageKey);
    if (notify) window.dispatchEvent(new CustomEvent("mozu-member-change", { detail: member }));
  } catch {
    // The signed cookie remains the source of truth even when local storage is unavailable.
  }
}

export function useMemberIdentity() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth", { cache: "no-store" });
      const data = await response.json() as { member?: unknown };
      const next = data.member === "大魔王" || data.member === "小魔王" ? data.member : null;
      setMember(next);
      saveMember(next);
    } catch {
      setMember(null);
      saveMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    const sync = () => void refresh();
    const syncStorage = (event: StorageEvent) => {
      if (event.key === memberStorageKey) void refresh();
    };
    const syncVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("mozu-member-change", sync);
    window.addEventListener("storage", syncStorage);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", syncVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mozu-member-change", sync);
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", syncVisible);
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }).catch(() => undefined);
    setMember(null);
    saveMember(null, true);
  }, []);

  return { member, loading, refresh, logout };
}

export function MemberIdentity({ className = "" }: { className?: string }) {
  const { member, loading, logout } = useMemberIdentity();

  if (loading) return <div className={"member-identity " + className}><span>正在确认登录…</span></div>;
  if (!member) return <div className={"member-identity " + className}><a href="/login">登录</a></div>;

  return (
    <div className={"member-identity " + className} aria-label="当前账号">
      <span>{member}</span>
      <button type="button" onClick={() => void logout()}>退出</button>
    </div>
  );
}
