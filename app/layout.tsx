import type { Metadata, Viewport } from "next";
import TreasureToast from "@/app/components/TreasureToast";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ことばダンジョン - Kotoba Dungeon",
    template: "%s | ことばダンジョン",
  },
  description: "えいごの ことばを あつめる ぼうけん。文をつくるパズル、かるた、フォニックス、えほんクイズなど、こども向けの英語あそび。",
  applicationName: "ことばダンジョン",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "ことばダンジョン",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d2f45",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "window.__BOOT_OK__ = true;",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* next/font はまだ vinext(Cloudflare 版)での動作を確認していないので、読み込みはこのまま */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <TreasureToast />
      </body>
    </html>
  );
}
