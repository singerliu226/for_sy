import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "七夕｜魔丸小助手",
  description: "一张写给思怡的七夕星图。",
};

export default function QixiLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
