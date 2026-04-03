import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crafting",
};

export default function CraftingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
