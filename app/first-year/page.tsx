import type { Metadata } from "next";
import Link from "next/link";
import { FirstYearJournal } from "@/components/FirstYearJournal";
import { MemberIdentity } from "@/components/MemberIdentity";

export const metadata: Metadata = {
  title: "第一年｜魔族小窝",
  description: "大魔王和小魔王一起写的手账。",
};

export default function FirstYearPage() {
  return (
    <main className="molwan-site first-year-site">
      <header className="molwan-nav guide-nav">
        <Link href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔族小窝</span></Link>
        <nav aria-label="主导航"><a className="is-current" href="/first-year">第一年</a><a href="/assistant">小魔丸</a><a href="/messages">小留言</a><a href="/anniversaries">纪念日</a></nav>
        <MemberIdentity />
      </header>
      <FirstYearJournal />
      <footer className="molwan-footer first-year-footer"><span>写在这里的东西，不用写得很完整。</span></footer>
    </main>
  );
}
