import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiet Tunnel — Personal WARP Configuration Tool",
  description: "Private, single-owner Cloudflare WARP configuration workspace.",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
