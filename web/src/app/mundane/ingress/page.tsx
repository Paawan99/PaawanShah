"use client";
import { useState } from "react";
import LocationPicker from "@/components/LocationPicker";
import ChartWheel from "@/components/ChartWheel";
import { api, type ChartConfig, type GeocodeResult, type NatalChartResponse } from "@/lib/api";

export default function IngressPage() {
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [place, setPlace] = useState<GeocodeResult | null>(null);
  const [zodiac, setZodiac] = useState<"tropical" | "sidereal">("tropical");
  const [events, setEvents] = useState<
    { sign: string; timestamp_utc: string; chart: NatalChartResponse }[] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  async function load() {
    if (!place) {
      setError("Pick a location first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const config: ChartConfig = {
        zodiac,
        house_system: "placidus",
        ayanamsa: "lahiri",
      };
      const r = await api.ingress(
        year,
        {
          latitude: place.latitude,
          longitude: place.longitude,
          timezone: place.timezone,
          place_label: place.name,
        },
        config
      );
      setEvents(r.events);
      setActive(0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl mb-2">Cardinal Ingresses</h1>
        <p className="text-cosmic-muted">
          Sun's entry into Aries, Cancer, Libra, and Capricorn — read as the
          four quarterly charts of the year for your location.
        </p>
      </div>
      <div className="card grid md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="label">Year</label>
          <input
            className="input"
            type="number"
            min={1800}
            max={2400}
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Location</label>
          <LocationPicker value={place} onChange={setPlace} />
        </div>
        <div>
          <label className="label">Zodiac</label>
          <select
            className="input"
            value={zodiac}
            onChange={(e) => setZodiac(e.target.value as any)}
          >
            <option value="tropical">Tropical</option>
            <option value="sidereal">Sidereal</option>
          </select>
        </div>
        <button onClick={load} className="btn-primary md:col-span-4" disabled={loading}>
          {loading ? "Computing…" : "Compute four ingresses"}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {events && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {events.map((e, i) => (
              <button
                key={e.sign}
                onClick={() => setActive(i)}
                className={
                  "px-4 py-2 rounded-md text-sm border " +
                  (active === i
                    ? "border-cosmic-accent bg-cosmic-accent text-cosmic-deep"
                    : "border-cosmic-muted/30 hover:border-cosmic-accent")
                }
              >
                {e.sign}{" "}
                <span className="text-xs opacity-70">
                  {new Date(e.timestamp_utc).toUTCString()}
                </span>
              </button>
            ))}
          </div>
          <div className="card flex items-center justify-center">
            <ChartWheel
              planets={events[active].chart.planets}
              houses={events[active].chart.houses}
              aspects={events[active].chart.aspects}
            />
          </div>
        </div>
      )}
    </div>
  );
}
