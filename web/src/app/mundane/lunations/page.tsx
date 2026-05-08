"use client";
import { useState } from "react";
import LocationPicker from "@/components/LocationPicker";
import { api, SIGN_GLYPHS, type ChartConfig, type GeocodeResult } from "@/lib/api";

export default function LunationsPage() {
  const today = new Date();
  const sixMonths = new Date(today);
  sixMonths.setMonth(today.getMonth() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const [start, setStart] = useState(fmt(today));
  const [end, setEnd] = useState(fmt(sixMonths));
  const [place, setPlace] = useState<GeocodeResult | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof api.lunations>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!place) {
      setError("Pick a location first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const config: ChartConfig = {
        zodiac: "tropical",
        house_system: "placidus",
        ayanamsa: "lahiri",
      };
      const r = await api.lunations(
        start,
        end,
        {
          latitude: place.latitude,
          longitude: place.longitude,
          timezone: place.timezone,
          place_label: place.name,
        },
        config
      );
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
        <h1 className="font-display text-3xl mb-2">Lunations & Eclipses</h1>
        <p className="text-cosmic-muted">
          New / Full Moons in your window, plus any solar or lunar eclipses
          (with visibility from your chosen city).
        </p>
      </div>
      <div className="card grid md:grid-cols-4 gap-4 items-end">
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
        <div className="md:col-span-2">
          <label className="label">Location (for eclipse visibility)</label>
          <LocationPicker value={place} onChange={setPlace} />
        </div>
        <button onClick={load} className="btn-primary md:col-span-4" disabled={loading}>
          {loading ? "Searching the sky…" : "Find lunations & eclipses"}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {data && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-display text-lg mb-3">Lunations</h3>
            <ul className="text-sm space-y-1">
              {data.lunations.map((l, i) => (
                <li key={i} className="flex gap-2 items-center">
                  <span>{l.kind === "new_moon" ? "🌑" : "🌕"}</span>
                  <span className="text-cosmic-muted">
                    {new Date(l.timestamp_utc).toUTCString()}
                  </span>
                  <span className="ml-auto">
                    {SIGN_GLYPHS[l.sign]} {l.sign}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3 className="font-display text-lg mb-3">Eclipses</h3>
            {data.eclipses.length === 0 ? (
              <p className="text-cosmic-muted text-sm">None in this window.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {data.eclipses.map((e, i) => (
                  <li key={i} className="flex gap-2 items-center">
                    <span>{e.kind === "solar" ? "☉" : "☽"}</span>
                    <span className="text-cosmic-muted">
                      {new Date(e.timestamp_utc).toUTCString()}
                    </span>
                    <span className="text-cosmic-accent text-xs">
                      {e.eclipse_type}
                    </span>
                    <span className="ml-auto">
                      {SIGN_GLYPHS[e.sign]} {e.sign}
                    </span>
                    {e.visible_at_location && (
                      <span className="text-xs text-green-400">visible</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
