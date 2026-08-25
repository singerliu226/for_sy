import type { Metadata } from "next";
import { MagicAssistant } from "@/components/MagicAssistant";

export const metadata: Metadata = {
  title: "魔丸小助手｜有事就跟我说",
  description: "给思怡留的一处上海小入口：有事就说，我先帮你查。",
};

export default function AssistantPage() {
  return (
    <main className="molwan-site assistant-site">
      <header className="molwan-nav guide-nav">
        <a href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔丸小助手</span></a>
        <nav aria-label="主导航"><a className="is-current" href="/assistant">小助手</a><a href="/guide">魔都攻略</a><a href="/anniversaries">纪念日</a></nav>
      </header>

      <section className="assistant-hero">
        <p className="molwan-kicker">A LITTLE HELP, FROM ME</p>
        <h1>今天遇到的事，<br /><em>跟我说。</em></h1>
        <p>不一定立刻都有答案，但我会先帮你查清楚。能确认的我写明白，没查到的也不让你瞎跑。</p>
      </section>

      <MagicAssistant />

      <section className="assistant-boundary" aria-label="小助手怎么帮你">
        <div><span>这些时候就来找我</span><p>临时路线、当日营业、末班、天气、机场抵达，或者你现在有点不知道怎么办的事。</p></div>
        <div><span>查不到的时候我也直说</span><p>没有能确认的新消息，我不会拿猜测糊弄你；这时就一起看官方入口，或者先翻魔都攻略。</p></div>
        <a href="/guide">我提前给你整理的攻略 →</a>
      </section>

      <footer className="molwan-footer guide-footer"><span>到了新的地方，也不用什么都一个人摸索。</span><a href="/guide">去翻翻我给你留的攻略 →</a></footer>
    </main>
  );
}
