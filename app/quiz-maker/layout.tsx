import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Maker",
  description: "絵を見て英語の文を選ぶ、カード型クイズ。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
