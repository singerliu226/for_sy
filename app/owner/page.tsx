import type { Metadata } from "next";
import { ActivityDashboard } from "@/components/ActivityDashboard";
import { AssistantAuditDashboard } from "@/components/AssistantAuditDashboard";

export const metadata: Metadata = {
  title: "私密记录看板｜魔丸小助手",
  robots: { index: false, follow: false },
};

export default function OwnerPage() {
  return (
    <main className="molwan-site activity-site">
      <section className="activity-hero">
        <p className="molwan-kicker">PRIVATE OWNER VIEW</p>
        <h1>记录与<br /><em>对话档案。</em></h1>
        <p>此页仅通过本机 SSH 隧道访问，不经公网展示。</p>
      </section>
      <ActivityDashboard />
      <AssistantAuditDashboard />
      <footer className="molwan-footer guide-footer"><span>对话内容不会出现在公开网站或公开访问看板。</span></footer>
    </main>
  );
}
