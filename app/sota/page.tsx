import type { Metadata } from "next";
import SotaShelf from "./components/SotaShelf";

export const metadata: Metadata = {
  title: "So-ta The Alien(ソータザエイリアン)",
  description: "えいぶんを よんで、ぴったりの えを みつける えほんゲーム。",
};

export default function SotaPage() {
  return <SotaShelf />;
}
