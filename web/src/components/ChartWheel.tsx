"use client";
import {
  ASPECT_COLORS,
  PLANET_GLYPHS,
  SIGN_GLYPHS,
  type Aspect,
  type HouseCusps,
  type PlanetPosition,
} from "@/lib/api";

interface Props {
  planets: PlanetPosition[];
  houses: HouseCusps;
  aspects: Aspect[];
  size?: number;
}

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export default function ChartWheel({
  planets,
  houses,
  aspects,
  size = 560,
}: Props) {
  const r_outer = 250;
  const r_signs_inner = 215;
  const r_house_outer = 215;
  const r_house_inner = 175;
  const r_planet = 150;
  const r_aspects = 105;

  const asc = houses.ascendant;
  const toAngle = (lon: number) => {
    const rel = (lon - asc + 360) % 360;
    return (180 - rel) * (Math.PI / 180);
  };
  const toXY = (lon: number, r: number) => {
    const a = toAngle(lon);
    return [Math.cos(a) * r, -Math.sin(a) * r] as const;
  };

  return (
    <svg
      viewBox={`-${size / 2} -${size / 2} ${size} ${size}`}
      width="100%"
      style={{ maxWidth: size, aspectRatio: "1 / 1" }}
    >
      <defs>
        <radialGradient id="chartBg" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%" stopColor="#1a1a3a" />
          <stop offset="100%" stopColor="#0b0b1f" />
        </radialGradient>
      </defs>

      <circle r={r_outer} fill="url(#chartBg)" stroke="#e0c878" strokeWidth="1" />
      <circle r={r_signs_inner} fill="none" stroke="#8c8aa3" strokeWidth="0.5" />
      <circle r={r_house_inner} fill="none" stroke="#8c8aa3" strokeWidth="0.5" />
      <circle r={r_aspects} fill="none" stroke="#8c8aa3" strokeWidth="0.3" opacity="0.4" />

      {SIGN_NAMES.map((sign, i) => {
        const startLon = i * 30;
        const a1 = toAngle(startLon);
        const x1 = Math.cos(a1) * r_outer;
        const y1 = -Math.sin(a1) * r_outer;
        const midLon = startLon + 15;
        const [mx, my] = toXY(midLon, (r_outer + r_signs_inner) / 2);
        return (
          <g key={sign}>
            <line
              x1={x1}
              y1={y1}
              x2={Math.cos(a1) * r_signs_inner}
              y2={-Math.sin(a1) * r_signs_inner}
              stroke="#8c8aa3"
              strokeWidth="0.5"
            />
            <text
              x={mx}
              y={my}
              fill="#e0c878"
              fontSize="20"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {SIGN_GLYPHS[sign]}
            </text>
          </g>
        );
      })}

      {houses.cusps.map((cusp, i) => {
        const a = toAngle(cusp);
        const x1 = Math.cos(a) * r_house_outer;
        const y1 = -Math.sin(a) * r_house_outer;
        const x2 = Math.cos(a) * r_house_inner;
        const y2 = -Math.sin(a) * r_house_inner;
        const isAngle = i === 0 || i === 3 || i === 6 || i === 9;
        return (
          <g key={`cusp-${i}`}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isAngle ? "#e0c878" : "#8c8aa3"}
              strokeWidth={isAngle ? "1.5" : "0.7"}
            />
          </g>
        );
      })}

      {houses.cusps.map((cusp, i) => {
        const next = houses.cusps[(i + 1) % 12];
        let mid = (cusp + next) / 2;
        if (next < cusp) mid = ((cusp + next + 360) / 2) % 360;
        const [mx, my] = toXY(mid, (r_house_outer + r_house_inner) / 2);
        return (
          <text
            key={`hn-${i}`}
            x={mx}
            y={my}
            fontSize="11"
            fill="#8c8aa3"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {i + 1}
          </text>
        );
      })}

      {aspects.map((asp, i) => {
        if (!ASPECT_COLORS[asp.aspect]) return null;
        const a = planets.find((p) => p.name === asp.body_a);
        const b = planets.find((p) => p.name === asp.body_b);
        if (!a || !b) return null;
        const [x1, y1] = toXY(a.longitude, r_aspects);
        const [x2, y2] = toXY(b.longitude, r_aspects);
        return (
          <line
            key={`asp-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={ASPECT_COLORS[asp.aspect]}
            strokeWidth="0.8"
            opacity="0.6"
          />
        );
      })}

      {planets.map((p) => {
        if (p.name.includes("Node") || p.name === "Chiron") return null;
        const [x, y] = toXY(p.longitude, r_planet);
        return (
          <g key={p.name}>
            <circle cx={x} cy={y} r="14" fill="#0b0b1f" stroke="#e0c878" strokeWidth="0.6" />
            <text
              x={x}
              y={y}
              fontSize="16"
              fill="#f5f0e1"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {PLANET_GLYPHS[p.name] || p.name[0]}
            </text>
            {p.retrograde && (
              <text
                x={x + 11}
                y={y + 12}
                fontSize="9"
                fill="#ef4444"
                textAnchor="middle"
              >
                R
              </text>
            )}
          </g>
        );
      })}

      <text x={-r_outer - 8} y={4} fontSize="11" fill="#e0c878" textAnchor="end">
        ASC
      </text>
      <text x={0} y={-r_outer - 4} fontSize="11" fill="#e0c878" textAnchor="middle">
        MC
      </text>
    </svg>
  );
}
