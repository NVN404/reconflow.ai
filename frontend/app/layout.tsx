import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#080b11] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}
