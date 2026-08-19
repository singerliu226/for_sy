import type { Metadata } from "next";
import { headers } from "next/headers";
import "@fontsource-variable/noto-serif-sc/wght.css";
import "@fontsource-variable/cormorant-garamond/wght.css";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const siteUrl = new URL(`${protocol}://${host}`);

  return {
    metadataBase: siteUrl,
    title: "今夜，银河为思怡降临",
    description: "一张写给思怡的七夕星图。",
    openGraph: {
      title: "今夜，银河为思怡降临",
      description: "一张写给思怡的七夕星图。",
      images: [{ url: new URL("/og.png", siteUrl).toString(), width: 1536, height: 1024 }],
      locale: "zh_CN",
      type: "website",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
