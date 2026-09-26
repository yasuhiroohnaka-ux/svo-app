import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "So-ta The Alien",
  description: "英文を読んで、絵に色をつけていく絵本。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
