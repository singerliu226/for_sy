import { MemberIdentity } from "@/components/MemberIdentity";
import { HomeRoomStatus } from "@/components/HomeRoomStatus";
import { MessageForSiyi } from "@/components/MessageForSiyi";
import { WelcomeOpening } from "@/components/WelcomeOpening";
import Link from "next/link";

export default function Home() {
  return (
    <main className="molwan-site molwan-home">
      <header className="molwan-nav">
        <Link href="/" className="molwan-brand" aria-label="魔族小窝首页">
          <span className="molwan-brand__mark">丸</span>
          <span>魔族小窝</span>
        </Link>
        <nav aria-label="主导航"><a href="/first-year">第一年</a><a href="/assistant">小魔丸</a><a href="/messages">小留言</a><a href="/anniversaries">纪念日</a></nav>
        <MemberIdentity />
      </header>

      <section className="home-welcome" aria-labelledby="home-title">
        <div className="home-welcome__copy">
          <p className="home-welcome__eyebrow"><span /> 魔族小窝</p>
          <h1 id="home-title">嗨，你回家啦。<br /><em>今天有啥新鲜事？</em></h1>
          <p className="home-welcome__intro">想说一句、留张图，或者先去问问小魔丸。</p>
          <a className="home-welcome__action" href="/first-year">去翻翻手账 <span aria-hidden="true">↗</span></a>
        </div>
        <div className="home-welcome__illustration" aria-hidden="true">
          <span className="home-welcome__hello">小魔丸在这儿！</span>
          <img src="/welcome/monster-poster.webp" alt="" width="400" height="400" />
          <span className="home-welcome__sign">欢迎回家</span>
          <span className="home-welcome__star">✧</span>
        </div>
      </section>

      <HomeRoomStatus />

      <section className="molwan-home__doors molwan-home__doors--four" aria-label="选择一个入口">
        <a className="molwan-door molwan-door--first-year" href="/first-year">
          <span className="molwan-door__number">01</span>
          <div><p>写点今天的事</p><h2>第一年</h2><strong>一起写、一起翻 <i>→</i></strong></div>
          <span className="molwan-door__book" aria-hidden="true">✎</span>
        </a>
        <a className="molwan-door molwan-door--assistant" href="/assistant">
          <span className="molwan-door__number">02</span>
          <div><p>有个事想问问</p><h2>小魔丸</h2><strong>题目、生活和临时小麻烦 <i>→</i></strong></div>
          <span className="molwan-door__map" aria-hidden="true"><i /><i /><i /></span>
        </a>
        <a className="molwan-door molwan-door--message" href="/messages">
          <span className="molwan-door__number">03</span>
          <div><p>有话就留在这儿</p><h2>小留言</h2><strong>文字、照片和语音 <i>→</i></strong></div>
          <span className="molwan-door__letter" aria-hidden="true">✉</span>
        </a>
        <a className="molwan-door molwan-door--anniversary" href="/anniversaries">
          <span className="molwan-door__number">04</span>
          <div><p>把值得记得的日子收好</p><h2>纪念日</h2><strong>七夕，以及以后 <i>→</i></strong></div>
          <span className="molwan-door__moon" aria-hidden="true" />
        </a>
      </section>

      <MessageForSiyi />

      <footer className="molwan-footer">
        <span>小窝里有信、有本子，也有小魔丸。</span>
        <WelcomeOpening />
        <a href="/messages">打开信箱 →</a>
      </footer>
    </main>
  );
}
