"use client";
import { useState } from "react";
import BirthDataForm from "@/components/BirthDataForm";
import ChartWheel from "@/components/ChartWheel";
import PlanetTable from "@/components/PlanetTable";
import AspectsTable from "@/components/AspectsTable";
import InterpretationPanel from "@/components/InterpretationPanel";
import { api, type BirthData, type ChartConfig, type NatalChartResponse } from "@/lib/api";

export default function NatalPage() {
  const [chart, setChart] = useState<NatalChartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(birth: BirthData, config: ChartConfig) {
    setLoading(true);
    setError(null);
    try {
      const r = await api.natal(birth, config);
      setChart(r);
    } catch (e: any) {
      setError(e.message || "Failed to compute chart");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl mb-2">Natal Chart</h1>
        <p className="text-cosmic-muted">
          Enter your birth date, time, and place. We'll compute the chart with
          Swiss Ephemeris and offer an AI reading.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <BirthDataForm onSubmit={handleSubmit} loading={loading} />
        {error && (
          <div className="card border-red-500/40">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {chart && (
          <div className="card flex items-center justify-center">
            <ChartWheel
              planets={chart.planets}
              houses={chart.houses}
              aspects={chart.aspects}
            />
          </div>
        )}
      </div>

      {chart && (
        <div className="grid lg:grid-cols-2 gap-6">
          <PlanetTable planets={chart.planets} />
          <AspectsTable aspects={chart.aspects} />
        </div>
      )}

      {chart && <InterpretationPanel chart={chart} />}
    </div>
  );
}
