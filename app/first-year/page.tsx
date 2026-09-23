import type { Metadata } from "next";
import Link from "next/link";
import { FirstYearJournal } from "@/components/FirstYearJournal";
import { MemberIdentity } from "@/components/MemberIdentity";

export const metadata: Metadata = {
  title: "我们的小约定｜魔族小窝",
  description: "两个人约好以后要去做的事。",
};

export default function FirstYearPage() {
  return (
    <main className="molwan-site first-year-site">
      <header className="molwan-nav guide-nav">
        <Link href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔族小窝</span></Link>
        <nav aria-label="主导航"><a className="is-current" href="/first-year">小约定</a><a href="/assistant">小魔丸</a><a href="/messages">最近的事儿</a><a href="/anniversaries">纪念日</a></nav>
        <MemberIdentity />
      </header>
      <FirstYearJournal />
      <footer className="molwan-footer first-year-footer"><span>想到了就先约，日子慢慢过。</span></footer>
    </main>
  );
}
