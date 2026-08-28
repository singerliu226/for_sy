import type { Metadata } from "next";
import { MessageInbox } from "@/components/MessageInbox";

export const metadata: Metadata = {
  title: "魔王的收信看板｜魔丸小助手",
  description: "思怡发来的留言、图片和语音。",
  robots: { index: false, follow: false },
};

export default function MessageBoardPage() {
  return (
    <main className="molwan-site message-site message-inbox-site">
      <header className="molwan-nav guide-nav">
        <a href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔丸小助手</span></a>
        <nav aria-label="主导航"><a href="/assistant">小助手</a><a href="/guide">魔都攻略</a><a href="/messages">留言板</a><a href="/anniversaries">纪念日</a></nav>
      </header>

      <section className="message-inbox-hero">
        <p className="molwan-kicker">FOR THE KING</p>
        <h1>魔王的<br /><em>收信看板。</em></h1>
      </section>

      <MessageInbox />
    </main>
  );
}
