import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "たからもの",
  description: "ことばダンジョンで あつめた ⭐ と たからもの。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
