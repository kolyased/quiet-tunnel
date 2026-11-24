import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiet Tunnel — Тихий туннель",
  description: "Privacy-first open-source Cloudflare WARP configuration generator for WireGuard and compatible AmneziaWG clients.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
