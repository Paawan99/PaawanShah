export const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export type ZodiacSystem = "tropical" | "sidereal";
export type HouseSystem =
  | "placidus"
  | "whole_sign"
  | "equal"
  | "koch"
  | "regiomontanus";
export type Ayanamsa = "lahiri" | "raman" | "krishnamurti" | "fagan_bradley";

export interface GeoLocation {
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone?: string | null;
  place_label?: string | null;
}

export interface BirthData {
  birth_date: string;
  birth_time: string;
  location: GeoLocation;
  name?: string | null;
}

export interface ChartConfig {
  zodiac: ZodiacSystem;
  house_system: HouseSystem;
  ayanamsa: Ayanamsa;
}

export interface PlanetPosition {
  name: string;
  longitude: number;
  latitude: number;
  speed_long: number;
  sign: string;
  sign_degree: number;
  house: number | null;
  retrograde: boolean;
}

export interface HouseCusps {
  cusps: number[];
  ascendant: number;
  midheaven: number;
  armc: number;
  vertex: number;
}

export interface Aspect {
  body_a: string;
  body_b: string;
  aspect: string;
  angle: number;
  orb: number;
  applying: boolean;
}

export interface NatalChartResponse {
  birth: BirthData;
  config: ChartConfig;
  julian_day_ut: number;
  planets: PlanetPosition[];
  houses: HouseCusps;
  aspects: Aspect[];
}

export interface GeocodeResult {
  name: string;
  country: string | null;
  admin1: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
  elevation: number;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`/api/v1${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`${r.status}: ${t}`);
  }
  return r.json();
}

export const api = {
  natal: (birth: BirthData, config: ChartConfig) =>
    postJson<NatalChartResponse>("/natal", { birth, config }),

  ingress: (year: number, location: GeoLocation, config: ChartConfig) =>
    postJson<{
      year: number;
      events: Array<{
        sign: string;
        timestamp_utc: string;
        chart: NatalChartResponse;
      }>;
    }>("/ingress", { year, location, config }),

  lunations: (
    start_date: string,
    end_date: string,
    location: GeoLocation,
    config: ChartConfig
  ) =>
    postJson<{
      start_date: string;
      end_date: string;
      lunations: Array<{
        kind: "new_moon" | "full_moon";
        timestamp_utc: string;
        sun_longitude: number;
        moon_longitude: number;
        sign: string;
      }>;
      eclipses: Array<{
        kind: "solar" | "lunar";
        timestamp_utc: string;
        eclipse_type: string;
        sign: string;
        visible_at_location: boolean;
      }>;
    }>("/lunations", { start_date, end_date, location, config }),

  cycles: (start_date: string, end_date: string, config: ChartConfig) =>
    postJson<{
      start_date: string;
      end_date: string;
      aspects: Array<{
        body_a: string;
        body_b: string;
        aspect: string;
        angle: number;
        timestamp_utc: string;
        longitude_a: number;
        longitude_b: number;
      }>;
    }>("/cycles", { start_date, end_date, config }),

  mundaneCity: (
    birth: BirthData,
    config: ChartConfig,
    moment_utc?: string,
    label?: string
  ) =>
    postJson<NatalChartResponse>("/mundane/city", {
      birth,
      config,
      moment_utc,
      label,
    }),

  geocode: async (q: string): Promise<GeocodeResult[]> => {
    const r = await fetch(`/api/v1/geocode?q=${encodeURIComponent(q)}`);
    if (!r.ok) throw new Error(`geocode failed: ${r.status}`);
    const j = await r.json();
    return j.results;
  },

  interpret: (chart: NatalChartResponse, focus: string) =>
    postJson<{ focus: string; interpretation: string; model: string }>(
      "/interpret/natal",
      { chart, focus }
    ),
};

export const SIGN_GLYPHS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

export const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
  "Mean Node": "☊", "True Node": "☊", Chiron: "⚷",
};

export const ASPECT_COLORS: Record<string, string> = {
  conjunction: "#e0c878",
  opposition: "#ef4444",
  square: "#f97316",
  trine: "#22c55e",
  sextile: "#38bdf8",
};

export function formatDegree(deg: number): string {
  const d = Math.floor(deg);
  const minF = (deg - d) * 60;
  const m = Math.floor(minF);
  const s = Math.round((minF - m) * 60);
  return `${d}°${m.toString().padStart(2, "0")}'${s.toString().padStart(2, "0")}\"`;
}
