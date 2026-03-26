import type { Metadata } from "next";
import { playfairDisplay, inter } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas — Delphi Digital",
  description:
    "Content-to-tweet crafting platform with personalized voice/tonality",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable}`}>
      <body className="font-body bg-atlas-bg text-atlas-text min-h-screen">
        {children}
      </body>
    </html>
  );
}
