import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ymeyme-Rhyme",
  description: "毎月の英語の詩を読み上げで聞けます。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
