import type { Metadata } from "next";
import { MessageBoard } from "@/components/MessageBoard";

export const metadata: Metadata = {
  title: "给魔王留言｜魔丸小助手",
  description: "给魔王留一句想说的话。",
};

export default function MessagesPage() {
  return (
    <main className="molwan-site message-site">
      <header className="molwan-nav guide-nav">
        <a href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔丸小助手</span></a>
        <nav aria-label="主导航"><a href="/assistant">小助手</a><a href="/guide">魔都攻略</a><a className="is-current" href="/messages">留言板</a><a href="/anniversaries">纪念日</a></nav>
      </header>

      <section className="message-hero">
        <p className="molwan-kicker">A NOTE FOR THE KING</p>
        <h1>想说的话，<br /><em>留在这里。</em></h1>
      </section>

      <MessageBoard />
    </main>
  );
}
