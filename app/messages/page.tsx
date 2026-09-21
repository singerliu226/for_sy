import type { Metadata } from "next";
import Link from "next/link";
import { MessageBoard } from "@/components/MessageBoard";
import { MemberIdentity } from "@/components/MemberIdentity";

export const metadata: Metadata = {
  title: "小留言｜魔族小窝",
  description: "大魔王和小魔王留给彼此的话。",
};

export default function MessagesPage() {
  return (
    <main className="molwan-site message-site">
      <header className="molwan-nav guide-nav">
        <Link href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔族小窝</span></Link>
        <nav aria-label="主导航"><a href="/first-year">第一年</a><a href="/assistant">小魔丸</a><a className="is-current" href="/messages">小留言</a><a href="/anniversaries">纪念日</a></nav>
        <MemberIdentity />
      </header>

      <section className="message-hero">
        <p className="molwan-kicker">A NOTE FOR US</p>
        <h1>想说的话，<br /><em>就留在这儿。</em></h1>
      </section>

      <MessageBoard />
    </main>
  );
}
