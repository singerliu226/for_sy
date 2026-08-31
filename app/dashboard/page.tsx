import type { Metadata } from "next";
import { ActivityDashboard } from "@/components/ActivityDashboard";

export const metadata: Metadata = {
  title: "网站后台｜魔丸小助手",
  description: "匿名访问与点击记录。",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <main className="molwan-site activity-site">
      <header className="molwan-nav guide-nav">
        <a href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔丸小助手</span></a>
        <a href="/" className="molwan-nav__back">回到首页 →</a>
      </header>

      <section className="activity-hero">
        <p className="molwan-kicker">SITE DASHBOARD</p>
        <h1>网站的<br /><em>小脚印。</em></h1>
      </section>

      <ActivityDashboard />

      <footer className="molwan-footer guide-footer"><span>仅记录匿名访问、页面与点击，不记录输入内容或原始 IP。</span></footer>
    </main>
  );
}
