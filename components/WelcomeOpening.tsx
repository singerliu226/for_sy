"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./welcome-opening.css";

const seenKey = "molwan-welcome-seen-v3";

export function WelcomeOpening() {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const replay = useRef<HTMLButtonElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

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
    };
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
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
    }, reduced ? 0 : 380);
  }, [leaving, reduced]);

  function playAgain() {
    setVideoPlaying(false);
    setVideoFailed(false);
    setOpen(true);
  }

  function tryVideo() {
    const player = video.current;
    if (!player) return;
    player.muted = true;
    player.defaultMuted = true;
    player.volume = 0;
    void player.play().catch(() => setVideoFailed(true));
  }

  return (
    <>
      <button className="welcome-replay" type="button" ref={replay} disabled={!ready} onClick={playAgain}>再看一遍小魔丸 <span aria-hidden="true">↺</span></button>
      <dialog ref={dialog} className={`welcome-opening${leaving ? " is-leaving" : ""}`} onCancel={(event) => { event.preventDefault(); dismiss(); }} aria-labelledby="welcome-title" aria-describedby="welcome-hint">
        {open && <>
          {!reduced && !videoFailed && <div className={`welcome-video${videoPlaying ? " is-playing" : ""}`} aria-hidden="true">
            <i className="welcome-video__moon" /><i className="welcome-video__lantern welcome-video__lantern--left" /><i className="welcome-video__lantern welcome-video__lantern--right" />
            <p className="welcome-video__title">中秋回家</p>
            <div className="welcome-video__frame">
              <video ref={video} src="/welcome/midautumn-homecoming" autoPlay defaultMuted muted playsInline preload="auto" onCanPlay={tryVideo} onPlaying={() => setVideoPlaying(true)} onEnded={dismiss} onError={() => setVideoFailed(true)} />
              <span>思怡，欢迎回家！</span>
            </div>
          </div>}

          <main className={`welcome-fallback${videoPlaying ? " is-covered" : ""}`}>
            <p className="welcome-fallback__eyebrow">中秋回家</p>
            <h1 id="welcome-title">思怡，<em>欢迎回家！</em></h1>
            <div className="welcome-fallback__card" aria-hidden="true">
              <span className="welcome-fallback__moon" />
              <span className="welcome-fallback__lantern welcome-fallback__lantern--left" /><span className="welcome-fallback__lantern welcome-fallback__lantern--right" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/welcome/monster-poster.webp" alt="" width="400" height="400" />
              <strong>思怡，欢迎回家！</strong>
            </div>
            <button className="welcome-enter" type="button" onClick={dismiss}>进屋吧 <span aria-hidden="true">→</span></button>
            <p id="welcome-hint" className="welcome-hint">{videoFailed ? "视频没加载出来，先进去吧。" : "小魔丸正在开门。"}</p>
          </main>
        </>}
      </dialog>
    </>
  );
}
