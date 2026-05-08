import { PLANET_GLYPHS, SIGN_GLYPHS, formatDegree, type PlanetPosition } from "@/lib/api";

export default function PlanetTable({ planets }: { planets: PlanetPosition[] }) {
  return (
    <div className="card overflow-x-auto">
      <h3 className="font-display text-lg mb-3">Planets</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-cosmic-muted text-left">
            <th className="py-1 pr-3">Body</th>
            <th className="py-1 pr-3">Sign</th>
            <th className="py-1 pr-3">Position</th>
            <th className="py-1 pr-3">House</th>
            <th className="py-1 pr-3">Retro</th>
          </tr>
        </thead>
        <tbody>
          {planets.map((p) => (
            <tr key={p.name} className="border-t border-cosmic-muted/10">
              <td className="py-1 pr-3">
                <span className="mr-2 text-cosmic-accent">{PLANET_GLYPHS[p.name] || ""}</span>
                {p.name}
              </td>
              <td className="py-1 pr-3">
                <span className="mr-1">{SIGN_GLYPHS[p.sign]}</span>
                {p.sign}
              </td>
              <td className="py-1 pr-3 font-mono text-xs">{formatDegree(p.sign_degree)}</td>
              <td className="py-1 pr-3">{p.house ?? "-"}</td>
              <td className="py-1 pr-3 text-red-400">{p.retrograde ? "R" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
