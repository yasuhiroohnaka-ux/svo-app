import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "きょうの ダンジョン",
  description: "まいにち かわる 5もんの ちょうせん。れんぞくで クリアして たからものを あつめよう。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
