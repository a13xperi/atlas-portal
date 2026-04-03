import localFont from "next/font/local";

// Offline-safe font loading for local builds.
export const playfairDisplay = localFont({
  src: "../app/fonts/GeorgiaBold.ttf",
  variable: "--font-heading",
  display: "swap",
});

export const inter = localFont({
  src: "../app/fonts/GeistVF.woff",
  variable: "--font-body",
  display: "swap",
});
