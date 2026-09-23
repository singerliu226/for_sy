"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./welcome-opening.css";

const seenKey = "molwan-welcome-seen-v4";

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
  const [videoBlocked, setVideoBlocked] = useState(false);

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

  useEffect(() => {
    if (!open || !videoFailed || reduced) return;
    const fallbackTimer = setTimeout(dismiss, 5200);
    return () => clearTimeout(fallbackTimer);
  }, [dismiss, open, reduced, videoFailed]);

  function playAgain() {
    setVideoPlaying(false);
    setVideoFailed(false);
    setVideoBlocked(false);
    setOpen(true);
  }

  function tryVideo(userInitiated = false) {
    const player = video.current;
    if (!player || videoFailed) return;
    player.muted = true;
    player.defaultMuted = true;
    player.volume = 0;
    void player.play().then(() => setVideoBlocked(false)).catch(() => {
      if (userInitiated) setVideoFailed(true);
      else setVideoBlocked(true);
    });
  }

  return (
    <>
      <button className="welcome-replay" type="button" ref={replay} disabled={!ready} onClick={playAgain}>再看一遍小魔丸 <span aria-hidden="true">↺</span></button>
      <dialog ref={dialog} className={`welcome-opening${leaving ? " is-leaving" : ""}`} onCancel={(event) => { event.preventDefault(); dismiss(); }} aria-labelledby="welcome-title" aria-describedby="welcome-hint">
        {open && <>
          {!reduced && <div className={`welcome-video${videoPlaying && !videoFailed ? " is-playing" : ""}`} aria-hidden="true">
            <div className="welcome-video__frame">
              <video ref={video} src="/welcome/midautumn-homecoming-lettered" autoPlay defaultMuted muted playsInline preload="auto" onCanPlay={tryVideo} onPlaying={() => setVideoPlaying(true)} onEnded={dismiss} onError={() => setVideoFailed(true)} />
            </div>
          </div>}

          {videoFailed && !reduced && <div className="welcome-motion-fallback" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/welcome/homecoming-lettered-motion" alt="" width="320" height="431" />
          </div>}

          <main className={`welcome-fallback${videoPlaying || videoFailed ? " is-covered" : ""}`}>
            <p className="welcome-fallback__eyebrow">中秋回家</p>
            <h1 id="welcome-title">思怡，<em>回来啦。</em></h1>
            <div className="welcome-fallback__card" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/welcome/monster-poster.webp" alt="" width="400" height="400" />
            </div>
            {videoBlocked && !videoFailed && <button className="welcome-watch" type="button" onClick={() => tryVideo(true)}>叫小魔丸开门 <span aria-hidden="true">→</span></button>}
            <button className="welcome-enter" type="button" onClick={dismiss}>进屋吧 <span aria-hidden="true">→</span></button>
            <p id="welcome-hint" className="welcome-hint">{videoFailed ? "视频没出来，先进去吧。" : videoBlocked ? "点一下，小魔丸就出来接你。" : "小魔丸马上出来。"}</p>
          </main>
        </>}
      </dialog>
    </>
  );
}
