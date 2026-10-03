import type { Metadata } from "next";

import VisitTracker from "@/app/components/VisitTracker";

export const metadata: Metadata = {
  title: "フォニックスめいろ",
  description: "フォニックスの音をたどってゴールをめざす迷路。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <VisitTracker appId="maze" />
      {children}
    </>
  );
}
