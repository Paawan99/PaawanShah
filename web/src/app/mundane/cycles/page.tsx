"use client";
import { useState } from "react";
import { api, ASPECT_COLORS, PLANET_GLYPHS, type ChartConfig } from "@/lib/api";

export default function CyclesPage() {
  const today = new Date();
  const fiveYears = new Date(today);
  fiveYears.setFullYear(today.getFullYear() + 5);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const [start, setStart] = useState(fmt(today));
  const [end, setEnd] = useState(fmt(fiveYears));
  const [data, setData] = useState<Awaited<ReturnType<typeof api.cycles>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const config: ChartConfig = {
        zodiac: "tropical",
        house_system: "placidus",
        ayanamsa: "lahiri",
      };
      const r = await api.cycles(start, end, config);
      setData(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl mb-2">Planetary Cycles</h1>
        <p className="text-cosmic-muted">
          Exact aspects between Jupiter, Saturn, Uranus, Neptune, and Pluto.
          The slow-planet aspects often correlate with shifts in collective
          mood and historical eras.
        </p>
      </div>
      <div className="card grid md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="label">From</label>
          <input
            className="input"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <label className="label">To</label>
          <input
            className="input"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <button onClick={load} className="btn-primary" disabled={loading}>
          {loading ? "Searching…" : "Find aspects"}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {data && (
        <div className="card">
          <h3 className="font-display text-lg mb-3">
            {data.aspects.length} exact aspects
          </h3>
          {data.aspects.length === 0 ? (
            <p className="text-cosmic-muted text-sm">
              No outer-planet aspects in this window.
            </p>
          ) : (
            <ul className="text-sm space-y-1">
              {data.aspects.map((a, i) => (
                <li key={i} className="flex gap-2 items-center">
                  <span className="text-cosmic-muted text-xs w-44">
                    {new Date(a.timestamp_utc).toUTCString().slice(0, 22)}
                  </span>
                  <span style={{ color: ASPECT_COLORS[a.aspect] || "#fff" }}>
                    {PLANET_GLYPHS[a.body_a]}
                  </span>
                  <span>{a.body_a}</span>
                  <span className="text-cosmic-muted">{a.aspect}</span>
                  <span style={{ color: ASPECT_COLORS[a.aspect] || "#fff" }}>
                    {PLANET_GLYPHS[a.body_b]}
                  </span>
                  <span>{a.body_b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
