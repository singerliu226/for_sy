import type { Metadata } from "next";
import Link from "next/link";
import { MessageBoard } from "@/components/MessageBoard";
import { MemberIdentity } from "@/components/MemberIdentity";

export const metadata: Metadata = {
  title: "最近的事儿｜魔族小窝",
  description: "大魔王和小魔王留给彼此的话、照片和语音。",
};

export default function MessagesPage() {
  return (
    <main className="molwan-site message-site">
      <header className="molwan-nav guide-nav">
        <Link href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔族小窝</span></Link>
        <nav aria-label="主导航"><a href="/first-year">小约定</a><a href="/assistant">小魔丸</a><a className="is-current" href="/messages">最近的事儿</a><a href="/anniversaries">纪念日</a></nav>
        <MemberIdentity />
      </header>

      <section className="message-hero">
        <p className="molwan-kicker">最近的事儿</p>
        <h1>记一记最近的事儿。<br /><em>没来得及说的，也放这儿。</em></h1>
      </section>

      <MessageBoard />
    </main>
  );
}
