import type { Metadata } from "next";

import VisitTracker from "@/app/components/VisitTracker";

export const metadata: Metadata = {
  title: "えほんで えいご(Story Quiz)",
  description: "短い英語のおはなしを聞いて、クイズに答えよう。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <VisitTracker appId="story" />
      {children}
    </>
  );
}
