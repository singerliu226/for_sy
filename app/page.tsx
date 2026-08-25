export default function Home() {
  return (
    <main className="molwan-site molwan-home">
      <header className="molwan-nav">
        <a href="/" className="molwan-brand" aria-label="魔丸小助手首页">
          <span className="molwan-brand__mark">丸</span>
          <span>魔丸小助手</span>
        </a>
        <p>我给思怡留的上海小地图</p>
      </header>

      <section className="molwan-home__hero">
        <div className="molwan-home__orbit" aria-hidden="true"><i /><i /><i /></div>
        <p className="molwan-kicker">FOR SIYI · SHANGHAI</p>
        <h1>思怡，<br /><em>来上海别慌。</em></h1>
        <p className="molwan-home__intro">先把今天的路走稳。其他的，我们一点一点把它变成你的日常。</p>
      </section>

      <section className="molwan-home__doors" aria-label="选择一个入口">
        <a className="molwan-door molwan-door--assistant" href="/assistant">
          <span className="molwan-door__number">01</span>
          <div>
            <p>现在遇到什么事了</p>
            <h2>小助手</h2>
            <strong>你说，我先帮你查 <i>→</i></strong>
          </div>
          <span className="molwan-door__map" aria-hidden="true"><i /><i /><i /></span>
        </a>
        <a className="molwan-door molwan-door--guide" href="/guide">
          <span className="molwan-door__number">02</span>
          <div>
            <p>我提前替你记下的</p>
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
        <span>不用急，有事就跟我说。</span>
        <a href="/assistant">现在跟我说说 →</a>
      </footer>
    </main>
  );
}
