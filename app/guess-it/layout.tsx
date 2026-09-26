import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ことばたんてい(Word Detective)",
  description: "Yes/No 質問で、ひみつのお題を当てる英語ゲーム。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
