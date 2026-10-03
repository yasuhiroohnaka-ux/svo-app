import type { Metadata } from "next";

import VisitTracker from "@/app/components/VisitTracker";

export const metadata: Metadata = {
  title: "SVOカルタ",
  description: "読み上げられた英語の文に合う絵をすばやく取る、かるたゲーム。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <VisitTracker appId="svo" />
      {children}
    </>
  );
}
