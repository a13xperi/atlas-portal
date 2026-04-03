import type { Metadata, Viewport } from "next";
import { playfairDisplay, inter } from "@/lib/fonts";
import { colors } from "@/lib/tokens";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Atlas — Delphi Digital",
    template: "%s | Atlas",
  },
  description:
    "Content-to-tweet crafting platform with personalized voice profiles for crypto analysts.",
  metadataBase: new URL("https://delphi-atlas.vercel.app"),
  openGraph: {
    title: "Atlas — Delphi Digital",
    description: "Craft tweets that sound like you. Powered by voice AI.",
    url: "https://delphi-atlas.vercel.app",
    siteName: "Atlas",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atlas — Delphi Digital",
    description: "Craft tweets that sound like you. Powered by voice AI.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: colors.atlasBg,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable}`}>
      <body className="font-body bg-atlas-bg text-atlas-text min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
