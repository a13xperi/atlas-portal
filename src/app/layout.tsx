import type { Metadata, Viewport } from "next";
import { playfairDisplay, inter } from "@/lib/fonts";
import { colors } from "@/lib/tokens";
import RouteProgress from "@/components/ui/RouteProgress";
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
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
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
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={colors.delphiBlue500} />
      </head>
      <body className="font-body bg-atlas-bg text-atlas-text min-h-screen">
        <RouteProgress />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
