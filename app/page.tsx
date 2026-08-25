export default function Home() {
  return (
    <main className="molwan-site molwan-home">
      <header className="molwan-nav">
        <a href="/" className="molwan-brand" aria-label="魔丸小助手首页">
          <span className="molwan-brand__mark">丸</span>
          <span>魔丸小助手</span>
        </a>
        <p>给思怡的上海小地图</p>
      </header>

      <section className="molwan-home__hero">
        <div className="molwan-home__orbit" aria-hidden="true"><i /><i /><i /></div>
        <p className="molwan-kicker">FOR SIYI · SHANGHAI</p>
        <h1>一座新城市，<br /><em>慢慢变成你的日常。</em></h1>
        <p className="molwan-home__intro">先把今天走稳，再把以后的上海，一点一点收进自己的地图里。</p>
      </section>

      <section className="molwan-home__doors" aria-label="选择一个入口">
        <a className="molwan-door molwan-door--guide" href="/guide">
          <span className="molwan-door__number">01</span>
          <div>
            <p>今天想先解决一件事</p>
            <h2>日常攻略</h2>
            <strong>落地、同济、上海生活与救急 <i>→</i></strong>
          </div>
          <span className="molwan-door__map" aria-hidden="true"><i /><i /><i /></span>
        </a>
        <a className="molwan-door molwan-door--anniversary" href="/anniversaries">
          <span className="molwan-door__number">02</span>
          <div>
            <p>把值得记得的日子收好</p>
            <h2>纪念日</h2>
            <strong>七夕，以及以后慢慢长出的章节 <i>→</i></strong>
          </div>
          <span className="molwan-door__moon" aria-hidden="true" />
        </a>
      </section>

      <footer className="molwan-footer">
        <span>不急，魔丸在这里。</span>
        <a href="/guide">先去看看今天的地图 →</a>
      </footer>
    </main>
  );
}
