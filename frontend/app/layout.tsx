import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindCubes - AI Agent Platform",
  description: "Build with intelligent agents. Train, fine-tune, and deploy powerful AI models.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
