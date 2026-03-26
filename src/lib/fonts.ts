import { Playfair_Display, Inter } from "next/font/google";

export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-heading",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});
