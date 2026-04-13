import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
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

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#262626] bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Left: Logo + status */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="text-[15px] font-bold tracking-tight text-white">
              XFlight
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#141414] border border-[#262626]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] pulse-dot" />
            <span className="text-[10px] font-mono text-[#52525b] tracking-wider">
              X Layer · 196 · Live
            </span>
          </div>
        </div>

        {/* Center: Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { href: "/", label: "Dashboard" },
            { href: "/verify", label: "Verify" },
            { href: "/preflight", label: "Preflight" },
            { href: "/skill", label: "xflight-skill" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-[13px] text-[#a1a1aa] hover:text-white transition-colors relative group"
            >
              {link.label}
              <span className="absolute bottom-0 left-3 right-3 h-px bg-[#00d4aa] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
          ))}
        </div>

        {/* Right: Connect wallet */}
        <button className="btn-primary text-xs px-4 py-2">
          Connect Wallet
        </button>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#262626] py-8 mt-20">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-mono text-[11px] text-[#52525b] tracking-wider">
              XFlight BlackBox · Built for X Layer Arena · Attestations on-chain
            </span>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/dolepee/xflight"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#52525b] hover:text-[#00d4aa] transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://www.oklink.com/xlayer/address/0xb5d3A62aDfB3fa33FE665558F95B987D0502d4c1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#52525b] hover:text-[#00d4aa] transition-colors font-mono"
              >
                Contract ↗
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
