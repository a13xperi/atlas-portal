import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Library",
};

export default function TeamLibraryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
