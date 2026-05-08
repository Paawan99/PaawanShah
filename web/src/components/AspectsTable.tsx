import { ASPECT_COLORS, PLANET_GLYPHS, type Aspect } from "@/lib/api";

const ASPECT_GLYPHS: Record<string, string> = {
  conjunction: "☌",
  opposition: "☍",
  square: "□",
  trine: "△",
  sextile: "✶",
};

export default function AspectsTable({ aspects }: { aspects: Aspect[] }) {
  if (!aspects.length) return null;
  return (
    <div className="card">
      <h3 className="font-display text-lg mb-3">Major Aspects</h3>
      <ul className="space-y-1 text-sm">
        {aspects.map((a, i) => (
          <li key={i} className="flex items-center gap-2">
            <span style={{ color: ASPECT_COLORS[a.aspect] || "#fff" }}>
              {ASPECT_GLYPHS[a.aspect] || "·"}
            </span>
            <span className="text-cosmic-accent">{PLANET_GLYPHS[a.body_a]}</span>
            <span>{a.body_a}</span>
            <span className="text-cosmic-muted text-xs">{a.aspect}</span>
            <span className="text-cosmic-accent">{PLANET_GLYPHS[a.body_b]}</span>
            <span>{a.body_b}</span>
            <span className="text-cosmic-muted text-xs ml-auto">
              orb {a.orb.toFixed(1)}° · {a.applying ? "applying" : "separating"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
