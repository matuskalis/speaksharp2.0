import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phonetix - Master English Pronunciation",
  description: "AI-powered pronunciation assessment with real phonetic analysis",
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
