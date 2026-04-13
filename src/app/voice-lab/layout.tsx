import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voice Lab",
};

export default function VoiceLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
