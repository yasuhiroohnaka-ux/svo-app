import type { Metadata } from "next";
import BookReader from "../components/BookReader";

export const metadata: Metadata = {
  title: "よみきかせ | So-ta The Alien",
};

export default function SotaBookPage() {
  return <BookReader />;
}
