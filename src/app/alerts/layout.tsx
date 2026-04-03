import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alerts",
};

export default function AlertsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
