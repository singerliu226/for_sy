"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./welcome-opening.css";

type Frames = { size: number; fps: number; count: number; cols: number; perSheet: number; sheets: string[]; frames: { x: number; y: number; angle: number }[] };
const seenKey = "molwan-welcome-seen-v2";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.fetchPriority = "high";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

export function WelcomeOpening() {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const enter = useRef<HTMLButtonElement>(null);
  const replay = useRef<HTMLButtonElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [run, setRun] = useState(0);
  const [painted, setPainted] = useState(false);
  const [line, setLine] = useState("等一下哦…");
  const [tapped, setTapped] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduced(media.matches);
    media.addEventListener("change", updateMotion);
    const start = requestAnimationFrame(() => {
      updateMotion();
      setReady(true);
      try { if (!sessionStorage.getItem(seenKey)) setOpen(true); }
      catch { setOpen(true); }
    });
    return () => {
      cancelAnimationFrame(start);
      media.removeEventListener("change", updateMotion);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
      if (tapTimer.current) clearTimeout(tapTimer.current);
    };
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    enter.current?.focus({ preventScroll: true });
    return () => { element.close(); document.body.style.overflow = previousOverflow; };
  }, [open]);

  const dismiss = useCallback(() => {
    if (leaving) return;
    try { sessionStorage.setItem(seenKey, "yes"); } catch { /* Session storage is optional. */ }
    setLeaving(true);
    leaveTimer.current = setTimeout(() => {
      setOpen(false);
      setLeaving(false);
      replay.current?.focus({ preventScroll: true });
    }, reduced ? 0 : 520);
  }, [leaving, reduced]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false, raf = 0;
    const abort = new AbortController();
    // The entry button stays usable while slower mobile connections load frames.
    const deadline = setTimeout(() => abort.abort(), 20000);
    async function animate() {
      try {
        const response = await fetch("/welcome/frames.json?v=sign2", { signal: abort.signal });
        if (!response.ok) throw new Error("No animation metadata");
        const frames = await response.json() as Frames;
        const images = await Promise.race([
          Promise.all(frames.sheets.map(loadImage)),
          new Promise<never>((_, reject) => {
            if (abort.signal.aborted) reject(new Error("Loading timeout"));
            else abort.signal.addEventListener("abort", () => reject(new Error("Loading timeout")), { once: true });
          }),
        ]);
        clearTimeout(deadline);
        if (cancelled) return;
        const context = canvas.current?.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        let previousTime = 0, activeTime = 0, lastLine = "";
        const draw = (now: number) => {
          if (cancelled) return;
          // Only advance while visible; loading, background tabs and stalls must
          // never consume the part of the performance the visitor has not seen.
          if (previousTime && document.visibilityState === "visible") activeTime += Math.min((now - previousTime) / 1000, .05);
          previousTime = now;
          const time = reduced ? 8.4 : activeTime;
          const elapsed = Math.max(0, Math.min(5, time - 1.8));
          const index = Math.min(frames.count - 1, Math.floor(elapsed * frames.fps));
          const nextLine = time < 1.8 ? "来啦来啦！" : elapsed < 1.15 ? "等一下哦…" : elapsed < 3.4 ? "哎，歪了歪了。" : elapsed < 4.7 ? "好啦！" : "欢迎小魔王！";
          if (nextLine !== lastLine) { setLine(nextLine); lastLine = nextLine; }
          {
            const position = frames.frames[index];
            const cell = index % frames.perSheet;
            context.clearRect(0, 0, frames.size, frames.size);
            let x = 0, y = 0, angle = 0, squash = 1;
            if (time < 1.8) {
              const p = time / 1.8;
              x = -290 * Math.pow(1 - p, 2);
              y = -Math.abs(Math.sin(p * Math.PI * 2)) * 58;
              angle = Math.sin(p * Math.PI * 3) * .15;
              squash = 1 + Math.sin(p * Math.PI * 4) * .065;
            } else if (time > 6.8 && time < 8.4) {
              const p = (time - 6.8) / 1.6;
              y = -Math.abs(Math.sin(p * Math.PI * 2)) * 66;
              angle = Math.sin(p * Math.PI * 2) * .1;
              squash = 1 + Math.cos(p * Math.PI * 4) * .055 * Math.sin(p * Math.PI);
            }
            context.save();
            // Leave room above the head for the two full-body jumps.
            context.translate(200 + x, 378 + y);
            context.rotate(angle);
            context.scale(.85 / squash, .85 * squash);
            context.translate(-200, -378);
            context.drawImage(images[Math.floor(index / frames.perSheet)], cell % frames.cols * frames.size, Math.floor(cell / frames.cols) * frames.size, frames.size, frames.size, 0, 0, frames.size, frames.size);
            // Lettering stays attached to the sign; the source tilts, not flips.
            context.save();
            context.translate(position.x, position.y);
            context.rotate(position.angle);
            context.fillStyle = "#774658";
            context.font = '600 22px "PingFang SC", "Microsoft YaHei", sans-serif';
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText("欢迎小魔王", 0, 0, 174);
            context.restore();
            context.restore();
            if (canvas.current) {
              canvas.current.dataset.frame = String(index);
              canvas.current.dataset.phase = time < 1.8 ? "enter" : time < 6.8 ? "sign" : time < 8.4 ? "jump" : "done";
            }
          }
          setPainted(true);
          if (time < 8.4) raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
      } catch {
        if (!cancelled) setLine("动画没加载好，点「再演一次」试试");
      }
    }
    void animate();
    return () => { cancelled = true; abort.abort(); clearTimeout(deadline); cancelAnimationFrame(raf); };
  }, [open, run, reduced]);

  function pet() {
    if (tapTimer.current) clearTimeout(tapTimer.current);
    setTapped(true);
    tapTimer.current = setTimeout(() => setTapped(false), 750);
  }

  function playAgain() {
    setTapped(false);
    setPainted(false);
    setLine(reduced ? "欢迎小魔王！" : "等一下哦…");
    setRun((value) => value + 1);
    setOpen(true);
  }

  return (
    <>
      <button className="welcome-replay" type="button" ref={replay} disabled={!ready} onClick={playAgain}>再看一次小怪兽 <span aria-hidden="true">↺</span></button>
      <dialog ref={dialog} className={`welcome-opening${leaving ? " is-leaving" : ""}${reduced ? " is-reduced" : ""}`} onCancel={(event) => { event.preventDefault(); dismiss(); }} aria-labelledby="welcome-title" aria-describedby="welcome-hint">
        {open && <>
          <div className="welcome-top"><span>魔族小窝<span className="welcome-top__dot" aria-hidden="true"> · </span><span className="welcome-top__small">小魔丸来开门</span></span><button type="button" onClick={dismiss}>直接进来 <span aria-hidden="true">↗</span></button></div>
          <div className="welcome-scene">
            <p className="welcome-eyebrow">叮咚——</p>
            <h1 id="welcome-title">咦，小魔王回来啦。</h1>
            <div className="welcome-stage">
              <span className="welcome-spark welcome-spark--one" aria-hidden="true">✧</span><span className="welcome-spark welcome-spark--two" aria-hidden="true">✦</span><span className="welcome-spark welcome-spark--three" aria-hidden="true">✧</span>
              <button type="button" className={`welcome-character${tapped ? " is-petted" : ""}`} onClick={pet} aria-label="摸摸小怪兽">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/welcome/monster-poster.webp" alt="抱着粉色牌子的白色毛绒小怪兽" width="400" height="400" className={painted ? "is-hidden" : ""} />
                <canvas ref={canvas} width="400" height="400" className={painted ? "is-painted" : ""} aria-hidden="true" />
                <span className="welcome-pet-reaction" aria-hidden="true">嘿嘿。</span>
              </button>
              <p className="welcome-bubble" role="status">{line}</p>
            </div>
            <button className="welcome-enter" ref={enter} type="button" onClick={dismiss}>进屋咯 <span aria-hidden="true">→</span></button>
            <p id="welcome-hint" className="welcome-hint">也可以戳戳这个憨憨。</p>
          </div>
          <div className="welcome-bottom"><span>魔族小窝入口</span><button type="button" onClick={playAgain}>再演一次 ↺</button></div>
        </>}
      </dialog>
    </>
  );
}
