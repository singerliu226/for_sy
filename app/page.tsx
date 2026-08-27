export default function Home() {
  return (
    <main className="molwan-site molwan-home">
      <header className="molwan-nav">
        <a href="/" className="molwan-brand" aria-label="魔丸小助手首页">
          <span className="molwan-brand__mark">丸</span>
          <span>魔丸小助手</span>
        </a>
        <a href="/messages" className="molwan-nav__back">给魔王留句话 →</a>
      </header>

      <section className="molwan-home__doors" aria-label="选择一个入口">
        <a className="molwan-door molwan-door--assistant" href="/assistant">
          <span className="molwan-door__number">01</span>
          <div>
            <p>现在遇到什么事了</p>
            <h2>小助手</h2>
            <strong>即时查询与可验证来源 <i>→</i></strong>
          </div>
          <span className="molwan-door__map" aria-hidden="true"><i /><i /><i /></span>
        </a>
        <a className="molwan-door molwan-door--guide" href="/guide">
          <span className="molwan-door__number">02</span>
          <div>
            <p>已核验的常用攻略</p>
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

      <footer className="molwan-footer">
        <span>即时查询、实用攻略与纪念日。</span>
        <a href="/messages">给魔王留言 →</a>
      </footer>
    </main>
  );
}
