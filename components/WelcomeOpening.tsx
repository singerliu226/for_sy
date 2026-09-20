"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./welcome-opening.css";

type Frames = { size: number; fps: number; count: number; cols: number; perSheet: number; sheets: string[]; frames: { x: number; y: number; angle: number }[] };
const seenKey = "molwan-welcome-seen-v1";

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
        const response = await fetch("/welcome/frames.json", { signal: abort.signal });
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
        const started = performance.now();
        let lastFrame = -1, lastLine = "";
        const draw = (now: number) => {
          if (cancelled) return;
          const elapsed = reduced ? 5 : (now - started) / 1000;
          const index = Math.min(frames.count - 1, Math.floor(elapsed * frames.fps));
          const nextLine = elapsed < 1.15 ? "等一下哦…" : elapsed < 3.4 ? "哎，拿反了。" : elapsed < 4.7 ? "这回对了。" : "欢迎小魔王！";
          if (nextLine !== lastLine) { setLine(nextLine); lastLine = nextLine; }
          if (index !== lastFrame) {
            const position = frames.frames[index];
            const cell = index % frames.perSheet;
            context.clearRect(0, 0, frames.size, frames.size);
            context.drawImage(images[Math.floor(index / frames.perSheet)], cell % frames.cols * frames.size, Math.floor(cell / frames.cols) * frames.size, frames.size, frames.size, 0, 0, frames.size, frames.size);
            // Track the real sign; correct its upside-down lettering during the turn.
            const progress = Math.max(0, Math.min(1, (elapsed - 2) / 1.35));
            const eased = progress * progress * (3 - 2 * progress);
            context.save();
            context.translate(position.x, position.y);
            context.rotate(position.angle + Math.PI * (1 - eased));
            context.fillStyle = "#774658";
            context.font = '600 22px "PingFang SC", "Microsoft YaHei", sans-serif';
            context.textAlign = "center";
            context.textBaseline = "middle";
            // Hide lettering while the generated sign is turning edge-on.
            context.globalAlpha = elapsed < 1.75 ? 1 : elapsed < 2 ? (2 - elapsed) / .25 : elapsed < 3.35 ? 0 : Math.min(1, (elapsed - 3.35) / .25);
            context.fillText("欢迎小魔王", 0, 0, 174);
            context.restore();
            lastFrame = index;
          }
          setPainted(true);
          if (elapsed < 5) raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
      } catch {
        if (!cancelled) setLine("欢迎小魔王！");
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
          <div className="welcome-top"><span>魔丸小助手<span className="welcome-top__dot" aria-hidden="true"> · </span><span className="welcome-top__small">有人来接你啦</span></span><button type="button" onClick={dismiss}>直接进入 <span aria-hidden="true">↗</span></button></div>
          <div className="welcome-scene">
            <p className="welcome-eyebrow">叮咚——</p>
            <h1 id="welcome-title">咦，你来啦。</h1>
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
            <button className="welcome-enter" ref={enter} type="button" onClick={dismiss}>我来啦 <span aria-hidden="true">→</span></button>
            <p id="welcome-hint" className="welcome-hint">也可以戳戳这个憨憨。</p>
          </div>
          <div className="welcome-bottom"><span>小魔王专用通道</span><button type="button" onClick={playAgain}>再演一次 ↺</button></div>
        </>}
      </dialog>
    </>
  );
}
