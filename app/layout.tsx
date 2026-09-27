import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Netrikkan · Sales Pipeline",
  description: "Active prospects and deal status — Sep 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
