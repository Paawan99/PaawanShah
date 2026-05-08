"use client";
import { useState } from "react";
import LocationPicker from "@/components/LocationPicker";
import ChartWheel from "@/components/ChartWheel";
import PlanetTable from "@/components/PlanetTable";
import {
  api,
  type ChartConfig,
  type GeocodeResult,
  type NatalChartResponse,
} from "@/lib/api";

export default function MundaneHousesPage() {
  const [place, setPlace] = useState<GeocodeResult | null>(null);
  const [moment, setMoment] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [zodiac, setZodiac] = useState<"tropical" | "sidereal">("tropical");
  const [chart, setChart] = useState<NatalChartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!place) {
      setError("Pick a location.");
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
      const m = new Date(moment);
      const birth = {
        birth_date: m.toISOString().slice(0, 10),
        birth_time: m.toISOString().slice(11, 19),
        location: {
          latitude: place.latitude,
          longitude: place.longitude,
          timezone: "UTC",
          place_label: place.name,
        },
      };
      const r = await api.mundaneCity(birth, config, m.toISOString(), `Mundane: ${place.name}`);
      setChart(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl mb-2">City Chart</h1>
        <p className="text-cosmic-muted">
          Cast the sky over any city at any moment. Read the houses as
          collective themes for that place at that time.
        </p>
      </div>
      <div className="card grid md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="label">City</label>
          <LocationPicker value={place} onChange={setPlace} />
        </div>
        <div>
          <label className="label">Moment (UTC)</label>
          <input
            className="input"
            type="datetime-local"
            value={moment}
            onChange={(e) => setMoment(e.target.value)}
          />
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
        <button onClick={load} className="btn-primary md:col-span-3" disabled={loading}>
          {loading ? "Casting…" : "Cast city chart"}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {chart && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card flex items-center justify-center">
            <ChartWheel
              planets={chart.planets}
              houses={chart.houses}
              aspects={chart.aspects}
            />
          </div>
          <PlanetTable planets={chart.planets} />
        </div>
      )}
    </div>
  );
}
