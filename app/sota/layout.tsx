import type { Metadata } from "next";

import VisitTracker from "@/app/components/VisitTracker";

export const metadata: Metadata = {
  title: "So-ta The Alien",
  description: "英文を読んで、絵に色をつけていく絵本。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <VisitTracker appId="sota" />
      {children}
    </>
  );
}
