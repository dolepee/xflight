import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XFlight — Agent Proof Court for X Layer",
  description:
    "Verify autonomous agent claims on X Layer. Paste a Moltbook BuildX post, wallet, or tx hash; XFlight extracts claims, checks on-chain evidence, scores proof quality, and attests the report on X Layer.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='24' font-size='24'>✈</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[#0a0a1a] text-white font-sans antialiased">
        <nav className="border-b border-white/10 bg-black/30 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✈</span>
              <div>
                <h1 className="font-bold text-lg tracking-tight">XFlight</h1>
                <p className="text-[10px] text-gray-400 tracking-widest uppercase">
                  Agent Proof Court · X Layer
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="/" className="text-gray-300 hover:text-white transition">
                Dashboard
              </a>
              <a href="/verify" className="text-gray-300 hover:text-white transition">
                Verify
              </a>
              <a href="/preflight" className="text-gray-300 hover:text-white transition">
                Preflight
              </a>
              <a
                href="/skill"
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs transition"
              >
                xflight-skill
              </a>
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10 py-6 text-center text-xs text-gray-500">
          XFlight BlackBox · Built for X Layer Arena · Attestations on-chain
        </footer>
      </body>
    </html>
  );
}
