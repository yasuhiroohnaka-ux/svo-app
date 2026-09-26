import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "oto-man",
  description: "おとを聞いて、カードをえらんだり、ことばを作ったりするフォニックス。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
