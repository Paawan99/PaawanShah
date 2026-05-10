import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Stardust — Swiss Ephemeris Astrology",
  description:
    "Free birth charts and mundane astrology powered by Swiss Ephemeris. Tropical or Sidereal, with AI interpretations.",
  openGraph: {
    title: "Stardust Astrology",
    description: "Swiss-Ephemeris-grade birth + mundane charts, with AI insight.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bmc = process.env.NEXT_PUBLIC_BMC_URL;
  const donateLabel = process.env.NEXT_PUBLIC_DONATE_LABEL || "Donate";
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-cosmic-muted/20 bg-cosmic-deep/80 backdrop-blur sticky top-0 z-30">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-display text-xl text-cosmic-accent">
              ✦ Stardust
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/natal" className="hover:text-cosmic-accent">Natal</Link>
              <Link href="/mundane" className="hover:text-cosmic-accent">Mundane</Link>
              <Link href="/chat" className="hover:text-cosmic-accent">Ask AI</Link>
              <Link href="/about" className="hover:text-cosmic-accent">About</Link>
              {bmc && (
                <a
                  href={bmc}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-xs"
                >
                  ☕ {donateLabel}
                </a>
              )}
            </div>
          </nav>
        </header>
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
        <footer className="border-t border-cosmic-muted/20 mt-auto">
          <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-cosmic-muted flex flex-col md:flex-row md:justify-between gap-2">
            <p>
              Calculations by Swiss Ephemeris (pyswisseph). AI by OpenAI.
              Astrology is for self-reflection, not prediction.
            </p>
            <p>
              <a
                href="https://github.com/paawan99/paawanshah"
                target="_blank"
                rel="noreferrer"
                className="hover:text-cosmic-accent"
              >
                Source on GitHub
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
