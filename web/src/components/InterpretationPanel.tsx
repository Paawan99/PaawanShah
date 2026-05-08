"use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { api, type NatalChartResponse } from "@/lib/api";

const FOCUS_OPTIONS = [
  "overview",
  "career",
  "relationships",
  "spiritual",
  "mundane",
] as const;

export default function InterpretationPanel({ chart }: { chart: NatalChartResponse }) {
  const [focus, setFocus] = useState<typeof FOCUS_OPTIONS[number]>("overview");
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .interpret(chart, focus)
      .then((r) => {
        if (!cancelled) setText(r.interpretation);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Interpretation failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chart, focus]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-display text-xl">Interpretation</h3>
        <div className="flex gap-1 flex-wrap">
          {FOCUS_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFocus(f)}
              className={
                "px-3 py-1 text-xs rounded-full border transition-colors " +
                (focus === f
                  ? "bg-cosmic-accent text-cosmic-deep border-cosmic-accent"
                  : "border-cosmic-muted/30 text-cosmic-muted hover:border-cosmic-accent")
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      {loading && <p className="text-cosmic-muted">Reading the stars…</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && !error && (
        <div className="prose prose-invert max-w-none prose-headings:text-cosmic-accent">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
