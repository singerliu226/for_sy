"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent } from "react";

type Moment = {
  date: string;
  index: string;
  image: string;
  eyebrow: string;
  title: string;
  line: string;
};

const moments: Moment[] = [
  {
    date: "07 · 20",
    index: "01",
    image: "/photos/微信图片_20260720130222_4801_555.jpg",
    eyebrow: "最早的一笔温柔",
    title: "故事开始前，\n已经有一点浪漫。",
    line: "有些心意并不是突然发生的。它只是很早很早，就悄悄落在了日常里。",
  },
  {
    date: "07 · 27",
    index: "02",
    image: "/photos/微信图片_20260727101948_6280_555.jpg",
    eyebrow: "一封写着 hello 的来信",
    title: "有些好消息，\n值得慢慢打开。",
    line: "后来才知道，原来有些值得庆祝的时刻，也可以这样安安静静地被收好。",
  },
  {
    date: "08 · 04",
    index: "03",
    image: "/photos/微信图片_20260804003940_9316_555.jpg",
    eyebrow: "一张很可爱的通知",
    title: "可爱这件事，\n本来就不用讲道理。",
    line: "想把这些带一点孩子气的瞬间，也认真地放进我们的相册里。",
  },
  {
    date: "08 · 06",
    index: "04",
    image: "/photos/微信图片_20260806222729_10308_555.jpg",
    eyebrow: "刚好握住的心意",
    title: "原来心意，\n真的有形状。",
    line: "它不需要很大，只要刚好落在掌心，就足够让人想记很久。",
  },
  {
    date: "08 · 11",
    index: "05",
    image: "/photos/微信图片_20260811125511_11811_555.jpg",
    eyebrow: "一杯被偶然留下的话",
    title: "你是我心里的\n第一位。",
    line: "有些心意不用铺陈得很盛大。它刚好在那天下午，安静地出现在眼前。",
  },
  {
    date: "08 · 14",
    index: "06",
    image: "/photos/微信图片_20260814134053_12706_555.jpg",
    eyebrow: "一只需要被抱住的小鸭",
    title: "想念的时候，\n随时跟我说",
    line: "有些东西因为笨拙和柔软，反而变成了只属于我们的小暗号。",
  },
  {
    date: "08 · 15",
    index: "07",
    image: "/photos/微信图片_20260815213403_13309_555.jpg",
    eyebrow: "把晚风收在江边",
    title: "那天的风，\n也替我们记得。",
    line: "江面、路灯和远处的桥，把一个普通夜晚留成了很久以后的风景。",
  },
  {
    date: "08 · 15",
    index: "08",
    image: "/photos/微信图片_20260815215719_13316_555.jpg",
    eyebrow: "一座真的会发光的桥",
    title: "原来银河，\n真的离我们很近。",
    line: "后来想起七夕，先想到的不是传说，而是我们一起看过的这一片夜色。",
  },
  {
    date: "08 · 17",
    index: "09",
    image: "/photos/微信图片_20260817202045_13626_555.jpg",
    eyebrow: "一束光落下来的地方",
    title: "我想记住的，\n从来不是某一天。",
    line: "是那天的你，是当时的笑意，是我忽然觉得时间应该慢一点的瞬间。",
  },
  {
    date: "08 · 19",
    index: "10",
    image: "/photos/微信图片_20260819125557_1281_86.jpg",
    eyebrow: "偶遇的一群小猫",
    title: "连路过的可爱，\n也想分你一半。",
    line: "总有一些不在计划里的小事，把这段日子变得更柔软、更值得回头看。",
  },
];

export default function Home() {
  const [opened, setOpened] = useState(false);
  const [holding, setHolding] = useState(false);
  const [activeMoment, setActiveMoment] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [capsule, setCapsule] = useState("");
  const [sealing, setSealing] = useState(false);
  const [sealed, setSealed] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = moments[activeMoment];

  useEffect(() => {
    const stored = window.localStorage.getItem("siyi-bridge-letter");
    if (stored !== null) {
      setCapsule(stored);
      setSealed(true);
    }
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.14 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  function beginHold() {
    if (opened || holdTimer.current) return;
    setHolding(true);
    holdTimer.current = window.setTimeout(() => {
      setOpened(true);
      setHolding(false);
      holdTimer.current = null;
      window.setTimeout(
        () => document.getElementById("first-light")?.scrollIntoView({ behavior: "smooth" }),
        480,
      );
    }, 950);
  }

  function endHold() {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    if (!opened) setHolding(false);
  }

  function changeMoment(direction: number) {
    setActiveMoment((current) => (current + direction + moments.length) % moments.length);
    setTilt({ x: 0, y: 0 });
  }

  function tiltPhoto(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTilt({
      x: Math.round(((event.clientX - rect.left) / rect.width - 0.5) * 9),
      y: Math.round(((event.clientY - rect.top) / rect.height - 0.5) * -9),
    });
  }

  function saveCapsule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sealing) return;
    window.localStorage.setItem("siyi-bridge-letter", capsule.trim());
    setSealing(true);
    window.setTimeout(() => {
      setSealing(false);
      setSealed(true);
    }, 1350);
  }

  return (
    <main className={opened ? "letter-site letter-site--opened" : "letter-site"}>
      <section className="opening" aria-label="给思怡的一封信">
        <div className="opening__photo" aria-hidden="true" />
        <div className="opening__veil" aria-hidden="true" />
        <div className="opening__grain" aria-hidden="true" />
        <div className="qixi-constellation" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
          <span>牵牛</span><b>织女</b>
        </div>
        <div className="magpie-flight" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
        </div>
        <nav className="opening__nav">
          <a href="/anniversaries" className="wordmark">TO<br /><em>思怡</em></a>
          <span>七夕 · 08 · 19 · 2026</span>
        </nav>
        <div className="opening__coordinates" aria-hidden="true">
          <span>牵牛星</span><i /><span>织女星</span>
        </div>
        <div className="opening__copy" id="top">
          <p className="opening__pretitle">七夕 · 银河渡口 · 一封只在今晚递达的信</p>
          <h1>
            有一座桥，<br />
            <em>我想和你一起走过。</em>
          </h1>
          <p className="opening__caption">思怡，今夜的鹊桥，刚好亮到能替我送一封信。</p>
        </div>
        <button
          type="button"
          className={holding ? "hold-button hold-button--holding" : "hold-button"}
          onPointerDown={beginHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onKeyDown={(event) => event.key === "Enter" && beginHold()}
          onKeyUp={(event) => event.key === "Enter" && endHold()}
          aria-label="按住打开这封信"
        >
          <i aria-hidden="true" />
          <span>{opened ? "鹊桥已亮" : "按住，过桥赴约"}</span>
          <b aria-hidden="true">↘</b>
        </button>
        <p className="opening__hint">不要急。等一会儿，七颗星会为你亮起来。</p>
      </section>

      <section className="prologue" id="first-light" data-reveal>
        <div className="prologue__label">七夕 · 银河渡口</div>
        <div className="prologue__stars" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
        </div>
        <p>
          我本来想，把这个七夕做成很多闪亮的东西。<br />
          后来发现，最动人的那几秒，早就被我们收进了照片里。
        </p>
        <div className="prologue__rule"><i /> <span>请慢一点往下看</span> <i /></div>
      </section>

      <section className="screening" aria-labelledby="screening-title">
        <header className="screening__header" data-reveal>
          <p>星河放映 · {moments.length} 张相片</p>
          <h2 id="screening-title">不是回忆展览。<br />是我想再陪你看一次的，<em>{moments.length} 个片刻。</em></h2>
        </header>

        <div className="screening__room" data-reveal>
          <div className="film-count"><span>照片 {active.index}</span><i /><b>/ {moments.length}</b></div>
          <div className="photo-stage">
            <div className="photo-stage__shadow photo-stage__shadow--one" aria-hidden="true" />
            <div className="photo-stage__shadow photo-stage__shadow--two" aria-hidden="true" />
            <div
              className="photo-stage__frame"
              onPointerMove={tiltPhoto}
              onPointerLeave={() => setTilt({ x: 0, y: 0 })}
              style={{ "--tilt-x": `${tilt.x}deg`, "--tilt-y": `${tilt.y}deg` } as CSSProperties}
            >
              <img key={active.image} src={active.image} alt={active.title.replace("\n", "")} />
              <span className="photo-stage__flare" aria-hidden="true" />
              <span className="photo-stage__date">{active.date}</span>
            </div>
            <nav className="photo-stage__controls" aria-label="照片切换">
              <button type="button" onClick={() => changeMoment(-1)} aria-label="查看上一张照片"><i>←</i><span>上一张</span></button>
              <p><b>{active.index}</b><i> / {moments.length}</i></p>
              <button type="button" onClick={() => changeMoment(1)} aria-label="查看下一张照片"><span>下一张</span><i>→</i></button>
            </nav>
            <div className="photo-stage__pages" aria-label="全部照片">
              {moments.map((moment, index) => (
                <button
                  key={moment.index}
                  type="button"
                  className={index === activeMoment ? "is-active" : ""}
                  onClick={() => setActiveMoment(index)}
                  aria-label={`查看第 ${moment.index} 张照片`}
                  aria-current={index === activeMoment ? "true" : undefined}
                >
                  {moment.index}
                </button>
              ))}
            </div>
          </div>
          <article className="moment-copy" key={active.index}>
            <p className="moment-copy__eyebrow">{active.eyebrow}</p>
            <h3>{active.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h3>
            <p className="moment-copy__line">{active.line}</p>
          </article>
        </div>
      </section>

      <section className="sky-bridge" data-reveal aria-label="今夜的鹊桥">
        <div className="sky-bridge__art" aria-hidden="true" />
        <div className="sky-bridge__veil" aria-hidden="true" />
        <div className="sky-bridge__copy">
          <p>今夜 · 银河</p>
          <h2>有些路，<br /><em>一抬头就到了。</em></h2>
          <span>不必等传说，只要今夜有人愿意为你走来。</span>
        </div>
        <div className="sky-bridge__caption" aria-hidden="true">
          <span>ONE NIGHT / ONE BRIDGE</span><i /><span>FOR 思怡</span>
        </div>
      </section>

      <section className="interlude" data-reveal>
        <div className="interlude__photo" aria-hidden="true" />
        <div className="interlude__copy">
          <p>银河很远，但有些心意可以穿过一座桥。</p>
          <h2>但有些人，<br />值得你为她<br /><em>认真做一封信。</em></h2>
          <span>— AUGUST, 2026</span>
        </div>
      </section>

      <section className="final-letter" data-reveal>
        <div className="final-letter__ticket" aria-hidden="true"><span>银河车票</span><strong>鹊桥一程</strong><i>七夕 / 08 · 19</i></div>
        <article className="final-letter__paper">
          <div className="final-letter__seal" aria-hidden="true"><span>七夕</span><i>08 · 19</i></div>
          <p className="final-letter__small">给思怡</p>
          <h2>七夕快乐。</h2>
          <p>
            谢谢你，让我想把一段普普通通的八月，
            认真地写成一封信。
          </p>
          <p>
            愿今后还有很多个晚上：我们不必去很远的地方，
            也不必等一个特别的节日，只要一起走过一座桥，
            看一会儿光，就已经很好。
          </p>
          <p className="final-letter__sign">— 一直想和你同行的人</p>
        </article>
      </section>

      <section className="capsule" data-reveal>
        <div>
          <p>A SMALL PROMISE</p>
          <h2>把一句话<br />封给以后的我们。</h2>
        </div>
        <form className={`capsule__form${sealing ? " capsule__form--sealing" : ""}${sealed ? " capsule__form--sealed" : ""}`} onSubmit={saveCapsule}>
          <div className="capsule__envelope" aria-hidden="true">
            <span>TO · 思怡</span>
            <b>七夕</b>
            <i />
          </div>
          <div className="capsule__form-content">
            <label htmlFor="letter-capsule">暂时只封存在这台设备里</label>
            <textarea
              id="letter-capsule"
              value={capsule}
              maxLength={120}
              onChange={(event) => setCapsule(event.target.value)}
              placeholder="比如：下一次，也一起去看夜景。"
            />
            <div className="capsule__form-actions">
              <span aria-live="polite">{sealing ? "正在封存..." : "写下此刻的你"}</span>
              <button type="submit" disabled={sealing}>{sealing ? "正在封好..." : "封好这封信 ↗"}</button>
            </div>
          </div>
        </form>
      </section>

      <footer><span>今夜，鹊桥正亮。</span><a href="/anniversaries">回到纪念日 ↑</a></footer>
    </main>
  );
}
