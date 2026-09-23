"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Member } from "@/lib/members";

type AuthStatus = { member?: Member | null; setupNeeded?: boolean; error?: string };

async function request(body: Record<string, unknown>) {
  const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json() as AuthStatus;
  if (!response.ok || !data.member) throw new Error(data.error ?? "这次没能完成。");
  return data.member;
}

export function AuthForms() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [member, setMember] = useState<Member>("小魔王");
  const [password, setPassword] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [bigPassword, setBigPassword] = useState("");
  const [smallPassword, setSmallPassword] = useState("");
  const [confirmBig, setConfirmBig] = useState("");
  const [confirmSmall, setConfirmSmall] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/auth", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as AuthStatus;
        if (!response.ok) throw new Error(data.error ?? "登录状态暂时打不开。");
        if (data.member) window.location.replace("/");
        else setStatus(data);
      })
      .catch((error) => setFeedback(error instanceof Error ? error.message : "登录状态暂时打不开。"));
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback("");
    try {
      await request({ action: "login", member, password });
      window.location.replace("/");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "没能登录，再试一次。");
    } finally {
      setSaving(false);
    }
  }

  async function setup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bigPassword !== confirmBig || smallPassword !== confirmSmall) {
      setFeedback("两次输入的密码没有对上。");
      return;
    }
    setSaving(true);
    setFeedback("");
    try {
      await request({ action: "setup", setupToken, bigPassword, smallPassword });
      window.location.replace("/");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "没能设置好，再试一次。");
    } finally {
      setSaving(false);
    }
  }

  if (status?.setupNeeded) {
    return (
      <section className="auth-card" aria-labelledby="setup-title">
        <p>第一次开门</p>
        <h1 id="setup-title">先把两把钥匙配好。</h1>
        <span>设置码只用这一次；两个密码分别留给大魔王和小魔王。</span>
        <form onSubmit={setup}>
          <label>设置码<input value={setupToken} onChange={(event) => setSetupToken(event.target.value)} autoComplete="one-time-code" required /></label>
          <label>大魔王的密码<input type="password" value={bigPassword} onChange={(event) => setBigPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
          <label>再输一次<input type="password" value={confirmBig} onChange={(event) => setConfirmBig(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
          <label>小魔王的密码<input type="password" value={smallPassword} onChange={(event) => setSmallPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
          <label>再输一次<input type="password" value={confirmSmall} onChange={(event) => setConfirmSmall(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
          <button type="submit" disabled={saving}>{saving ? "正在配钥匙…" : "设置好，进屋 →"}</button>
        </form>
        {feedback && <p className="auth-card__feedback" role="alert">{feedback}</p>}
      </section>
    );
  }

  return (
    <section className="auth-card" aria-labelledby="login-title">
      <p>进屋</p>
      <h1 id="login-title">回来啦。</h1>
      <span>登录一次就行，之后会一直记得你是谁。</span>
      <form onSubmit={login}>
        <fieldset><legend>谁在用？</legend>{(["小魔王", "大魔王"] as Member[]).map((name) => <label className={member === name ? "is-picked" : ""} key={name}><input type="radio" checked={member === name} onChange={() => setMember(name)} name="member" />{name}</label>)}</fieldset>
        <label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
        <button type="submit" disabled={saving}>{saving ? "正在开门…" : "进屋 →"}</button>
      </form>
      {feedback && <p className="auth-card__feedback" role="alert">{feedback}</p>}
    </section>
  );
}
