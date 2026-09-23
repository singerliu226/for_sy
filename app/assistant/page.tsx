import type { Metadata } from "next";
import Link from "next/link";
import { MagicAssistant } from "@/components/MagicAssistant";
import { MemberIdentity } from "@/components/MemberIdentity";

export const metadata: Metadata = {
  title: "小魔丸｜魔族小窝",
  description: "大魔王和小魔王共用的小问答。",
};

export default function AssistantPage() {
  return (
    <main className="molwan-site assistant-site">
      <header className="molwan-nav guide-nav">
        <Link href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔族小窝</span></Link>
        <nav aria-label="主导航"><a href="/first-year">小约定</a><a className="is-current" href="/assistant">小魔丸</a><a href="/messages">最近的事儿</a><a href="/anniversaries">纪念日</a></nav>
        <MemberIdentity />
      </header>

      <section className="assistant-hero">
        <p className="molwan-kicker">小魔丸</p>
        <h1>有事拿不准，<br /><em>就来问小魔丸。</em></h1>
        <p>题不会、日常小事卡住了，先把情况告诉它。</p>
      </section>

      <MagicAssistant />

      <footer className="molwan-footer guide-footer"><span>没说清也没事，接着聊。</span><a href="/messages">去留句话 →</a></footer>
    </main>
  );
}
