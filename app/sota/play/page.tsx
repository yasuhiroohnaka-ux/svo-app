import type { Metadata } from "next";
import SotaPlayer from "../components/SotaPlayer";

export const metadata: Metadata = {
  title: "よんで、えを みつける | So-ta The Alien",
};

export default function SotaPlayPage() {
  return <SotaPlayer />;
}
