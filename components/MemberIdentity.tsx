"use client";

import { useCallback, useEffect, useState } from "react";
import type { Member } from "@/lib/members";

export const memberStorageKey = "mozu-member-account-v1";

export function readMember() {
  try {
    const value = window.localStorage.getItem(memberStorageKey);
    return value === "大魔王" || value === "小魔王" ? value : null;
  } catch {
    return null;
  }
}

export function saveMember(member: Member) {
  try {
    window.localStorage.setItem(memberStorageKey, member);
    window.dispatchEvent(new CustomEvent("mozu-member-change", { detail: member }));
  } catch {
    // The page still works in private browsing; the member will simply be asked again.
  }
}

export function useMemberIdentity() {
  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    const sync = () => setMember(readMember());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("mozu-member-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("mozu-member-change", sync);
    };
  }, []);

  const chooseMember = useCallback((next: Member) => {
    saveMember(next);
    setMember(next);
  }, []);

  return { member, chooseMember };
}

export function MemberIdentity({ className = "" }: { className?: string }) {
  const { member, chooseMember } = useMemberIdentity();

  return (
    <div className={"member-identity " + className} aria-label="当前使用者">
      <span>{member ? "现在是" + member : "你是谁？"}</span>
      <div role="group" aria-label="选择身份">
        {(["大魔王", "小魔王"] as Member[]).map((name) => (
          <button
            className={member === name ? "is-active" : ""}
            key={name}
            type="button"
            onClick={() => chooseMember(name)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
