"use client";

import { useState } from "react";

const littleReplies = [
  "啵！今天也要好好吃饭。",
  "抱一下。",
  "我在呢，别着急。",
  "送你一颗小星星 ✦",
  "今天辛苦啦。",
];

export function LittleMarble() {
  const [reply, setReply] = useState("小魔丸在这儿！");
  const [isPlaying, setIsPlaying] = useState(false);

  function play() {
    const next = littleReplies[Math.floor(Math.random() * littleReplies.length)];
    setReply(next);
    setIsPlaying(false);
    window.requestAnimationFrame(() => setIsPlaying(true));
  }

  return (
    <div className={`little-marble${isPlaying ? " is-playing" : ""}`}>
      <span className="little-marble__hello" aria-live="polite">{reply}</span>
      <button
        className="little-marble__button"
        type="button"
        onClick={play}
        onAnimationEnd={() => setIsPlaying(false)}
        aria-label="点一下小魔丸"
      >
        <img src="/welcome/monster-poster.webp" alt="抱着欢迎回家牌子的小魔丸" width="400" height="400" />
        <span className="little-marble__sign" aria-hidden="true">欢迎回家</span>
        <span className="little-marble__tap" aria-hidden="true">点我</span>
        <span className="little-marble__spark little-marble__spark--one" aria-hidden="true">✦</span>
        <span className="little-marble__spark little-marble__spark--two" aria-hidden="true">✧</span>
        <span className="little-marble__spark little-marble__spark--three" aria-hidden="true">✦</span>
      </button>
      <span className="little-marble__star" aria-hidden="true">✧</span>
    </div>
  );
}
