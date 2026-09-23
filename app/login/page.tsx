import type { Metadata } from "next";
import Link from "next/link";
import { AuthForms } from "@/components/AuthForms";

export const metadata: Metadata = { title: "登录｜魔族小窝", robots: { index: false, follow: false } };

export default function LoginPage() {
  return <main className="molwan-site auth-site"><header className="molwan-nav"><Link href="/" className="molwan-brand"><span className="molwan-brand__mark">丸</span><span>魔族小窝</span></Link></header><AuthForms /></main>;
}
