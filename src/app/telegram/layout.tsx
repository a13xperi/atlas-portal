import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Telegram",
};

export default function TelegramLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
