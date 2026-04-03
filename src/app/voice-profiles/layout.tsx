import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voice Profiles",
};

export default function VoiceProfilesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
