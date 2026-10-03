import type { Metadata } from "next";

import VisitTracker from "@/app/components/VisitTracker";

export const metadata: Metadata = {
  title: "Puzzle Grammar",
  description: "絵に合わせてピースをつなぎ、英語の文を作るパズル。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <VisitTracker appId="puzzle" />
      {children}
    </>
  );
}
