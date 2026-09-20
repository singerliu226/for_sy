import { MessageForSiyi } from "@/components/MessageForSiyi";
import { WelcomeOpening } from "@/components/WelcomeOpening";

export default function Home() {
  return (
    <main className="molwan-site molwan-home">
      <header className="molwan-nav">
        <a href="/" className="molwan-brand" aria-label="魔丸小助手首页">
          <span className="molwan-brand__mark">丸</span>
          <span>魔丸小助手</span>
        </a>
        <a href="/messages" className="molwan-nav__back">我们的小留言 →</a>
      </header>

      <section className="home-welcome" aria-labelledby="home-title">
        <div className="home-welcome__copy">
          <p className="home-welcome__eyebrow"><span /> 小魔王的专属主页</p>
          <h1 id="home-title">嗨，小魔王。<br /><em>今天想做点什么？</em></h1>
          <p className="home-welcome__intro">问点问题，翻翻攻略，或者看看我们的小日子。</p>
          <a className="home-welcome__action" href="/assistant">找小助手聊聊 <span aria-hidden="true">↗</span></a>
        </div>
        <div className="home-welcome__illustration" aria-hidden="true">
          <span className="home-welcome__hello">嘿，你来啦！</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/welcome/monster-poster.webp" alt="" width="400" height="400" />
          <span className="home-welcome__sign">欢迎小魔王</span>
          <span className="home-welcome__star">✧</span>
        </div>
      </section>

      <section className="molwan-home__doors" aria-label="选择一个入口">
        <a className="molwan-door molwan-door--assistant" href="/assistant">
          <span className="molwan-door__number">01</span>
          <div>
            <p>有问题，来聊聊</p>
            <h2>小助手</h2>
            <strong>即时查询与可验证来源 <i>→</i></strong>
          </div>
          <span className="molwan-door__map" aria-hidden="true"><i /><i /><i /></span>
        </a>
        <a className="molwan-door molwan-door--guide" href="/guide">
          <span className="molwan-door__number">02</span>
          <div>
            <p>出发之前，翻一翻</p>
            <h2>魔都攻略</h2>
            <strong>落地、同济、上海生活与救急 <i>→</i></strong>
          </div>
          <span className="molwan-door__map" aria-hidden="true"><i /><i /><i /></span>
        </a>
        <a className="molwan-door molwan-door--anniversary" href="/anniversaries">
          <span className="molwan-door__number">03</span>
          <div>
            <p>把值得记得的日子收好</p>
            <h2>纪念日</h2>
            <strong>七夕，以及以后慢慢长出的章节 <i>→</i></strong>
          </div>
          <span className="molwan-door__moon" aria-hidden="true" />
        </a>
      </section>

      <MessageForSiyi />

      <footer className="molwan-footer">
        <span>即时查询、实用攻略与纪念日。</span>
        <WelcomeOpening />
        <a href="/messages">打开小留言 →</a>
      </footer>
    </main>
  );
}
