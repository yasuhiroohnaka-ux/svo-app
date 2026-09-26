import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "えほんで えいご(Story Quiz)",
  description: "短い英語のおはなしを聞いて、クイズに答えよう。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
