import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center pt-8 pb-12">
        <p className="text-cosmic-accent text-sm uppercase tracking-[0.3em] mb-4">
          Swiss Ephemeris · Tropical & Sidereal · Mundane
        </p>
        <h1 className="text-4xl md:text-6xl font-display mb-6">
          A clear view of your sky.
        </h1>
        <p className="text-lg text-cosmic-muted max-w-2xl mx-auto mb-8">
          Cast a precise birth chart in seconds. Or look up the next ingress,
          full moon, eclipse, or planetary alignment over your city — all
          computed on the same astronomical engine professional astrologers use.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/natal" className="btn-primary">Cast my birth chart</Link>
          <Link href="/mundane" className="btn-ghost">Mundane dashboard</Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <Feature
          title="Natal Chart"
          desc="Planets, houses, aspects. Tropical or Sidereal (Lahiri). Placidus, Whole Sign, Equal."
          href="/natal"
        />
        <Feature
          title="Mundane"
          desc="Ingresses, lunations + eclipses, slow-planet cycles, and house charts for any city."
          href="/mundane"
        />
        <Feature
          title="AI Interpretation"
          desc="Optional GPT-powered readings and follow-up chat. Grounded in your actual chart data."
          href="/chat"
        />
      </section>

      <section className="card">
        <h2 className="font-display text-2xl mb-3">How it works</h2>
        <ol className="space-y-2 text-sm text-cosmic-muted list-decimal list-inside">
          <li>You enter date, time, and place of birth (or any moment + location for mundane).</li>
          <li>Backend converts local time → UTC → Julian Day, calls Swiss Ephemeris.</li>
          <li>You get planetary positions, house cusps, and major aspects instantly.</li>
          <li>An AI module turns the raw chart into a readable, archetypal interpretation.</li>
        </ol>
      </section>
    </div>
  );
}

function Feature({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link href={href} className="card hover:border-cosmic-accent/50 transition-colors block">
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-sm text-cosmic-muted">{desc}</p>
    </Link>
  );
}
