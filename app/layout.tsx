import type { Metadata } from "next";
import "@fontsource-variable/noto-serif-sc/wght.css";
import "@fontsource-variable/cormorant-garamond/wght.css";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import { ActivityTracker } from "@/components/ActivityTracker";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://47.103.122.202:3001"),
  title: "魔丸小助手",
  description: "给思怡的上海生活地图，和慢慢收藏的纪念日。",
  openGraph: {
    title: "魔丸小助手",
    description: "给思怡的上海生活地图，和慢慢收藏的纪念日。",
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
