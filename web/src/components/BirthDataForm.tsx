"use client";
import { useState } from "react";
import LocationPicker from "./LocationPicker";
import {
  type BirthData,
  type ChartConfig,
  type GeocodeResult,
  type HouseSystem,
  type ZodiacSystem,
} from "@/lib/api";

interface Props {
  onSubmit: (birth: BirthData, config: ChartConfig) => void;
  loading?: boolean;
  submitLabel?: string;
}

export default function BirthDataForm({
  onSubmit,
  loading,
  submitLabel = "Cast chart",
}: Props) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("1990-01-01");
  const [time, setTime] = useState("12:00");
  const [place, setPlace] = useState<GeocodeResult | null>(null);
  const [zodiac, setZodiac] = useState<ZodiacSystem>("tropical");
  const [house, setHouse] = useState<HouseSystem>("placidus");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!place) {
      setError("Please pick a birth location.");
      return;
    }
    const birth: BirthData = {
      birth_date: date,
      birth_time: time + ":00",
      name: name || null,
      location: {
        latitude: place.latitude,
        longitude: place.longitude,
        timezone: place.timezone,
        elevation: place.elevation,
        place_label: `${place.name}${place.country ? ", " + place.country : ""}`,
      },
    };
    onSubmit(birth, { zodiac, house_system: house, ayanamsa: "lahiri" });
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label className="label">Name (optional)</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Albert Einstein"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Birth date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Birth time (local)</label>
          <input
            className="input"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className="label">Birth place</label>
        <LocationPicker value={place} onChange={setPlace} />
        {place?.timezone && (
          <p className="text-xs text-cosmic-muted mt-1">
            Timezone: {place.timezone}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Zodiac</label>
          <select
            className="input"
            value={zodiac}
            onChange={(e) => setZodiac(e.target.value as ZodiacSystem)}
          >
            <option value="tropical">Tropical (Western)</option>
            <option value="sidereal">Sidereal (Lahiri)</option>
          </select>
        </div>
        <div>
          <label className="label">House system</label>
          <select
            className="input"
            value={house}
            onChange={(e) => setHouse(e.target.value as HouseSystem)}
          >
            <option value="placidus">Placidus</option>
            <option value="whole_sign">Whole Sign</option>
            <option value="equal">Equal</option>
            <option value="koch">Koch</option>
            <option value="regiomontanus">Regiomontanus</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Calculating…" : submitLabel}
      </button>
    </form>
  );
}
