const anniversaries = [
  {
    slug: "qixi",
    date: "08 · 19 · 2026",
    title: "七夕",
    line: "今夜，银河为思怡降临。",
    note: "一封信、十个片刻，和一座想陪你一起走过的桥。",
  },
];

export default function AnniversariesPage() {
  return (
    <main className="molwan-site anniversary-site">
      <header className="molwan-nav">
        <a href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔丸小助手</span></a>
        <nav aria-label="主导航"><a href="/assistant">小助手</a><a href="/guide">魔都攻略</a><a href="/messages">小留言</a><a className="is-current" href="/anniversaries">纪念日</a></nav>
      </header>

      <section className="anniversary-hero">
        <p className="molwan-kicker">A SMALL ARCHIVE</p>
        <h1>有些日子，<br /><em>不需要赶着忘记。</em></h1>
        <p>它们会在这里，慢慢变成一格一格的光。</p>
      </section>

      <section className="anniversary-list" aria-label="纪念日记录">
        <p className="anniversary-list__label">已收下的日子</p>
        {anniversaries.map((anniversary, index) => (
          <a className="anniversary-card" href={`/anniversaries/${anniversary.slug}`} key={anniversary.slug}>
            <span className="anniversary-card__index">0{index + 1}</span>
            <div>
              <p>{anniversary.date}</p>
              <h2>{anniversary.title}</h2>
              <strong>{anniversary.line}</strong>
              <span>{anniversary.note}</span>
            </div>
            <i aria-hidden="true">↗</i>
          </a>
        ))}
        <p className="anniversary-list__future">以后还有很多天，会慢慢长到这里。</p>
      </section>

      <footer className="molwan-footer"><span>每一次认真记得，都会变成以后能回来的路。</span></footer>
    </main>
  );
}
