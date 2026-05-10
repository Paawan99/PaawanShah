export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl">About Stardust</h1>
      <p className="text-cosmic-muted">
        Stardust is a free astrology calculator that pairs the open-source
        <strong> Swiss Ephemeris</strong> (the same engine many professional
        astrologers use) with optional AI interpretation. It supports both
        Tropical (Western) and Sidereal (Vedic, Lahiri ayanamsa) zodiac modes.
      </p>

      <div className="card">
        <h2 className="font-display text-xl mb-3">Methodology</h2>
        <ul className="list-disc list-inside text-sm space-y-2 text-cosmic-muted">
          <li>
            Local birth time is converted to UTC using the IANA timezone
            resolved from the birth coordinates.
          </li>
          <li>
            Planet positions (Sun through Pluto, Nodes, Chiron) are computed
            via <code>swe.calc_ut</code> with the SWIEPH flag.
          </li>
          <li>
            House cusps use <code>swe.houses</code> with your chosen system
            (Placidus / Whole Sign / Equal / Koch / Regiomontanus).
          </li>
          <li>
            Mundane techniques: bisection root-finding for ingresses,
            New/Full Moon events, and exact outer-planet aspects across a
            window. Eclipses use <code>swe.sol_eclipse_when_glob</code> and
            <code>swe.lun_eclipse_when</code>.
          </li>
          <li>
            AI interpretations use OpenAI <code>gpt-4o-mini</code> with a
            stable system prompt for cache efficiency.
          </li>
        </ul>
      </div>

      <div className="card">
        <h2 className="font-display text-xl mb-3">Limitations</h2>
        <ul className="list-disc list-inside text-sm space-y-2 text-cosmic-muted">
          <li>Placidus houses fail above ~|66°| latitude — switch to Whole Sign in those cases.</li>
          <li>Pre-1970 birth times can be tricky due to historical DST data; verify your local offset.</li>
          <li>This is for self-reflection, not prediction.</li>
        </ul>
      </div>

      <div className="card">
        <h2 className="font-display text-xl mb-3">Source & License</h2>
        <p className="text-sm text-cosmic-muted">
          The web frontend is MIT licensed. The backend uses{" "}
          <a
            className="text-cosmic-accent"
            href="https://github.com/astrorigin/pyswisseph"
            target="_blank"
            rel="noreferrer"
          >
            pyswisseph
          </a>{" "}
          which mirrors Swiss Ephemeris under AGPL-3. Source code is
          available at{" "}
          <a
            className="text-cosmic-accent"
            href="https://github.com/paawan99/paawanshah"
          >
            github.com/paawan99/paawanshah
          </a>
          .
        </p>
      </div>
    </div>
  );
}
