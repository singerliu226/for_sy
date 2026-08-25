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
        <p>优先给出可确认的信息和可打开的来源；没有可靠结果时，转向官方入口或已有攻略。</p>
      </section>

      <MagicAssistant />

      <section className="assistant-boundary" aria-label="小助手怎么帮你">
        <div><span>适合查询</span><p>临时路线、当日营业、末班、天气、机场抵达。</p></div>
        <div><span>没有可靠结果时</span><p>改查官方入口，或查看已经核验过的魔都攻略。</p></div>
        <a href="/guide">查看魔都攻略 →</a>
      </section>

      <footer className="molwan-footer guide-footer"><span>通勤、报到、生活与紧急情况。</span><a href="/guide">查看魔都攻略 →</a></footer>
    </main>
  );
}
