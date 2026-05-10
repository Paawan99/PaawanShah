import Link from "next/link";

const TILES = [
  {
    href: "/mundane/ingress",
    title: "Cardinal Ingresses",
    desc: "Charts cast for the moment the Sun enters Aries, Cancer, Libra, Capricorn — the four quarterly mundane charts.",
  },
  {
    href: "/mundane/lunations",
    title: "Lunations & Eclipses",
    desc: "New & Full Moons across a date range, plus solar/lunar eclipses with local visibility.",
  },
  {
    href: "/mundane/cycles",
    title: "Planetary Cycles",
    desc: "Conjunctions, squares, oppositions, trines among Jupiter through Pluto across years.",
  },
  {
    href: "/mundane/houses",
    title: "City / Country Chart",
    desc: "Cast a chart for any city at any moment. Read the houses as collective themes.",
  },
];

export default function MundaneIndex() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl mb-2">Mundane Astrology</h1>
        <p className="text-cosmic-muted">
          Mundane astrology reads the chart of the world rather than a person.
          These four classical techniques cover most of what working mundane
          astrologers consult day-to-day.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="card hover:border-cosmic-accent/50 transition-colors"
          >
            <h3 className="font-display text-xl mb-2">{t.title}</h3>
            <p className="text-sm text-cosmic-muted">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
