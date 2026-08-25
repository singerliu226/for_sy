import type { Metadata } from "next";
import { MagicAssistant } from "@/components/MagicAssistant";

export const metadata: Metadata = {
  title: "魔丸小助手｜思怡的上海即时助手",
  description: "每次提问联网核验，帮思怡处理上海当下真正要办的事。",
};

export default function AssistantPage() {
  return (
    <main className="molwan-site assistant-site">
      <header className="molwan-nav guide-nav">
        <a href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔丸小助手</span></a>
        <nav aria-label="主导航"><a className="is-current" href="/assistant">小助手</a><a href="/guide">魔都攻略</a><a href="/anniversaries">纪念日</a></nav>
      </header>

      <section className="assistant-hero">
        <p className="molwan-kicker">LIVE, NOT JUST SAVED</p>
        <h1>今天的事，<br /><em>问魔丸。</em></h1>
        <p>它不替你猜。每次提问都尝试联网核验，把能确认的来源放在回答下面。</p>
      </section>

      <MagicAssistant />

      <section className="assistant-boundary" aria-label="小助手的使用边界">
        <div><span>它适合</span><p>临时路线、当日营业、末班、天气、机场抵达和眼下要办的事。</p></div>
        <div><span>它会诚实停下</span><p>没有可核验的最新来源时，不会把猜测包装成答案；这时会引导你看官方入口或魔都攻略。</p></div>
        <a href="/guide">提前翻阅魔都攻略 →</a>
      </section>

      <footer className="molwan-footer guide-footer"><span>最新的一次，才是这一次该用的答案。</span><a href="/guide">去魔都攻略看看 →</a></footer>
    </main>
  );
}
