import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "フォニックスめいろ",
  description: "フォニックスの音をたどってゴールをめざす迷路。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
