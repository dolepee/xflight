"use client";

import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl transition-all duration-300 ${
        scrolled ? "border-b border-[#262626]" : "border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-[15px] font-bold tracking-tight text-white">
              XFlight
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#141414] border border-[#262626]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] pulse-dot" />
            <span className="text-[10px] font-mono text-[#52525b] tracking-wider">
              X Layer · Chain 196 · Live
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
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
      <head>
        <title>XFlight — Agent Proof Court for X Layer</title>
        <meta
          name="description"
          content="Verify autonomous agent claims on X Layer. Paste a Moltbook BuildX post, wallet, or tx hash; XFlight extracts claims, checks on-chain evidence, scores proof quality, and attests the report on X Layer."
        />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='24' font-size='24'>✈</text></svg>"
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased noise-overlay">
        <div className="relative z-10 bg-grid min-h-screen">
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
                  Contract
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
