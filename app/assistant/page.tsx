import type { Metadata } from "next";
import { MagicAssistant } from "@/components/MagicAssistant";

export const metadata: Metadata = {
  title: "魔丸小助手｜上海即时查询",
  description: "面向同济与上海日常的即时查询和可验证攻略。",
};

export default function AssistantPage() {
  return (
    <main className="molwan-site assistant-site">
      <header className="molwan-nav guide-nav">
        <a href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔丸小助手</span></a>
        <nav aria-label="主导航"><a className="is-current" href="/assistant">小助手</a><a href="/guide">魔都攻略</a><a href="/anniversaries">纪念日</a></nav>
      </header>

      <section className="assistant-hero">
        <p className="molwan-kicker">SHANGHAI QUICK CHECK</p>
        <h1>魔王派给你的<br /><em>AI小助手</em></h1>
        <p>它读了一些迎新网的内容，能回答一些基本问题，其他问题，记得直接找魔王！</p>
      </section>

      <MagicAssistant />

      <footer className="molwan-footer guide-footer"><span>通勤、报到、生活与紧急情况。</span><a href="/guide">查看魔都攻略 →</a></footer>
    </main>
  );
}
