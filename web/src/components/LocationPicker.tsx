"use client";
import { useEffect, useRef, useState } from "react";
import { api, type GeocodeResult } from "@/lib/api";

interface Props {
  value: GeocodeResult | null;
  onChange: (place: GeocodeResult | null) => void;
}

export default function LocationPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2 || query === value?.name) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const r = await api.geocode(query);
        setResults(r);
        setOpen(true);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, value?.name]);

  return (
    <div className="relative">
      <input
        className="input"
        placeholder="City, country (e.g., Mumbai, India)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (value) onChange(null);
        }}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {loading && (
        <span className="absolute right-3 top-2 text-xs text-cosmic-muted">…</span>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-md border border-cosmic-muted/30 bg-cosmic-deep shadow-xl">
          {results.map((r, i) => (
            <li
              key={`${r.name}-${i}`}
              className="px-3 py-2 text-sm hover:bg-cosmic-mid cursor-pointer"
              onMouseDown={() => {
                onChange(r);
                setQuery(`${r.name}${r.admin1 ? ", " + r.admin1 : ""}${r.country ? ", " + r.country : ""}`);
                setOpen(false);
              }}
            >
              <span>{r.name}</span>
              {r.admin1 && <span className="text-cosmic-muted">, {r.admin1}</span>}
              {r.country && <span className="text-cosmic-muted">, {r.country}</span>}
              <span className="text-cosmic-muted text-xs ml-2">
                ({r.latitude.toFixed(2)}, {r.longitude.toFixed(2)})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
