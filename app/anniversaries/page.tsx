import type { Metadata } from "next";
import Link from "next/link";
import { AnniversaryArchive } from "@/components/AnniversaryArchive";
import { MemberIdentity } from "@/components/MemberIdentity";

export const metadata: Metadata = {
  title: "纪念日｜魔族小窝",
  description: "把值得记得的日子收好。",
};

export default function AnniversariesPage() {
  return (
    <main className="molwan-site anniversary-site">
      <header className="molwan-nav">
        <Link href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔族小窝</span></Link>
        <nav aria-label="主导航"><a href="/first-year">第一年</a><a href="/assistant">小魔丸</a><a href="/messages">小留言</a><a className="is-current" href="/anniversaries">纪念日</a></nav>
        <MemberIdentity />
      </header>

      <section className="anniversary-hero">
        <p className="molwan-kicker">A SMALL ARCHIVE</p>
        <h1>有些日子，<br /><em>不需要赶着忘记。</em></h1>
        <p>它们会在这里，慢慢变成一格一格的光。</p>
      </section>

      <AnniversaryArchive />

      <footer className="molwan-footer"><span>想记的那天，就收好它。</span></footer>
    </main>
  );
}
