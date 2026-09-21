import type { Metadata } from "next";
import "@fontsource-variable/noto-serif-sc/wght.css";
import "@fontsource-variable/cormorant-garamond/wght.css";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import { ActivityTracker } from "@/components/ActivityTracker";
import "./globals.css";
import "./refinement.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://47.103.122.202:3001"),
  title: "魔族小窝",
  description: "大魔王和小魔王的小窝。",
  openGraph: {
    title: "魔族小窝",
    description: "大魔王和小魔王的小窝。",
    images: [{ url: "/og.png", width: 1536, height: 1024 }],
    locale: "zh_CN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body><ActivityTracker />{children}</body>
    </html>
  );
}
