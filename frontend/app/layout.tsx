import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
      <body className="bg-[#0d1117] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200 font-sans">
        {children}
      </body>
    </html>
  );
}

