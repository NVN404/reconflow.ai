import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReconFlow AI — Autonomous External Attack Surface Management",
  description:
    "Autonomous EASM & Threat Intelligence agent powered by SerpApi MCP for SerpApi India Hackathon 2026 (Track 01).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#050505] text-[#F7F7F5] antialiased selection:bg-[#B7E36A]/20 selection:text-[#B7E36A] font-sans">
        {children}
      </body>
    </html>
  );
}
