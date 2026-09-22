import React, { useEffect, useState } from "react";
import { Fuel } from "lucide-react";
import type { GlobalMetrics } from "../types/analysis";
import { API_BASE } from "../api";
import { AnimatedSvgChart } from "./AnimatedSvgChart";
import { Card, Pill, Skeleton } from "./ui";

/**
 * Global metrics — dense chart-sounding cards. Values in mono 600,
 * deltas as ▲/▼ glyphs with mono weight (never hue — DESIGN.md §7).
 */
const FALLBACK_METRICS: GlobalMetrics = {
  bdi_index: 1842,
  bdi_change_pct: 2.4,
  current_avg_freight_pmt: 14.85,
  freight_change_pct: -6.8,
  bunker_vlsfo_pmt: 612.5,
  capesize_daily_usd: 22450,
  panamax_daily_usd: 14120,
};

function DeltaChip({ pct }: { pct: number }) {
  const positive = pct >= 0;
  return (
    <Pill tone={positive ? "positive" : "negative"} className="tabular-nums">
      <span aria-hidden="true" className="text-[8px] leading-none">
        {positive ? "▲" : "▼"}
      </span>
      {positive ? "+" : ""}
      {pct}%
    </Pill>
  );
}

export const GlobalMetricsStrip: React.FC = () => {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/metrics/global`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data: GlobalMetrics = await res.json();
        if (isMounted) {
          setMetrics(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn("GlobalMetricsStrip: failed to fetch, using fallback data", err);
        if (isMounted) {
          setMetrics(FALLBACK_METRICS);
          setIsLoading(false);
        }
      }
    };

    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || !metrics) {
    return (
      <section
        aria-label="Global freight metrics loading"
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        {[1, 2, 3].map((i) => (
          <Card key={i} className="flex flex-col gap-3 p-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-12 w-full" />
          </Card>
        ))}
      </section>
    );
  }

  const isFreightSavings = metrics.freight_change_pct <= 0;

  return (
    <section aria-label="Global freight metrics" className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {/* 1. Baltic Dry Index — live market signal */}
      <Card className="flex flex-col justify-between p-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink">
              BALTIC DRY INDEX
            </span>
            <DeltaChip pct={metrics.bdi_change_pct} />
          </div>
          <div className="font-mono text-2xl font-semibold tabular-nums text-abyss">
            {metrics.bdi_index.toLocaleString()}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-deepsea">
            Global dry bulk freight barometer tracking Capesize &amp; Panamax fixtures.
          </p>
        </div>
        <AnimatedSvgChart variant="live" height={48} className="mt-2 w-full" />
      </Card>

      {/* 2. Average freight rate */}
      <Card className="flex flex-col justify-between p-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink">
              AVG FREIGHT RATE
            </span>
            <DeltaChip pct={metrics.freight_change_pct} />
          </div>
          <div className="font-mono text-2xl font-semibold tabular-nums text-abyss">
            ${metrics.current_avg_freight_pmt.toFixed(2)}
            <span className="text-xs font-normal text-slate-ink"> / MT</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-deepsea">
            Benchmark voyage rate from Australia (Hay Point / Gladstone) to Paradip.
          </p>
        </div>
        <AnimatedSvgChart
          variant={isFreightSavings ? "live" : "negative"}
          height={48}
          className="mt-2 w-full"
        />
      </Card>

      {/* 3. Bunker fuel — neutral sounding */}
      <Card className="flex flex-col justify-between p-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink">
              BUNKER FUEL · VLSFO
            </span>
            <Pill tone="muted">
              <Fuel className="size-3" aria-hidden="true" />
              SIN
            </Pill>
          </div>
          <div className="font-mono text-2xl font-semibold tabular-nums text-abyss">
            ${metrics.bunker_vlsfo_pmt.toFixed(2)}
            <span className="text-xs font-normal text-slate-ink"> / MT</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-deepsea">
            Fuel cost factor calculated in vessel voyage charter operating margins.
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span aria-hidden="true" className="font-mono text-[10px] text-slate-ink">
            ▼
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-ink">
            SINGAPORE HUB · STEADY
          </span>
        </div>
      </Card>
    </section>
  );
};
