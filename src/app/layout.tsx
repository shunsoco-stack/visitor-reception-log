import type { Metadata } from "next";
import { AppProvider } from "@/components/app-provider";
import { Shell } from "@/components/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "来客受付・入退館記録",
  description:
    "来訪予約、タブレットでの受付、入館証の貸出・返却、担当者への画面内通知をひとつに。架空データで体験できるオフィス受付デモ。",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
