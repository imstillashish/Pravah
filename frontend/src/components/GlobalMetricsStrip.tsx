import React, { useEffect, useState } from "react";
import type { GlobalMetrics } from "../types/analysis";
import { API_BASE } from "../api";
import { StatCard } from "./StatCard";
import { Card, Skeleton } from "./ui";

/**
 * Global metrics — three Wise StatCards over real backend series
 * (spec §5.3). Fallback series keeps offline mode scrubbable.
 * Labels are Charcoal on fog (Slate fails 4.40 — spec §3 trap).
 */
const FALLBACK_SERIES = {
  bdi: [1789.1, 1802.4, 1795.0, 1810.6, 1798.2, 1815.3, 1808.7, 1820.1,
        1812.5, 1824.8, 1816.0, 1828.4, 1821.2, 1833.0, 1825.6, 1837.1,
        1829.8, 1841.5, 1833.9, 1845.2, 1837.6, 1849.0, 1841.3, 1852.7,
        1844.9, 1856.3, 1848.1, 1859.8, 1851.6, 1842.0],
  freight: [16.2, 16.05, 15.9, 15.98, 15.8, 15.72, 15.85, 15.6,
            15.45, 15.6, 15.3, 15.15, 15.4, 15.2, 15.05, 15.15,
            14.95, 15.1, 14.9, 15.0, 14.85, 14.95, 14.8, 14.9,
            14.75, 14.9, 14.8, 14.9, 14.85, 14.85],
  bunker: [604.0, 606.5, 603.2, 608.0, 605.4, 609.1, 606.8, 610.2,
           607.5, 611.0, 608.6, 612.1, 609.8, 613.4, 610.9, 614.2,
           611.5, 615.0, 612.3, 615.8, 613.1, 616.5, 613.8, 617.1,
           614.4, 617.9, 615.2, 618.6, 616.0, 612.5],
};

const FALLBACK_METRICS: GlobalMetrics = {
  bdi_index: 1842,
  bdi_change_pct: 2.4,
  current_avg_freight_pmt: 14.85,
  freight_change_pct: -6.8,
  bunker_vlsfo_pmt: 612.5,
  capesize_daily_usd: 22450,
  panamax_daily_usd: 14120,
  series: FALLBACK_SERIES,
};

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
          <Card key={i} tone="fog" className="flex flex-col gap-3 p-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-12 w-full" />
          </Card>
        ))}
      </section>
    );
  }

  const s = metrics.series ?? FALLBACK_SERIES;

  return (
    <section aria-label="Global freight metrics" className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <StatCard
        label="BALTIC DRY INDEX"
        series={s.bdi}
        delta={metrics.bdi_change_pct}
        goodWhen="up"
        format={(v) => Math.round(v).toLocaleString()}
        deltaLabel="vs 30 days ago"
        index={0}
      />
      <StatCard
        label="AVG FREIGHT RATE"
        series={s.freight}
        delta={metrics.freight_change_pct}
        goodWhen="down"
        format={(v) => `$${v.toFixed(2)} / MT`}
        deltaLabel="vs 30 days ago"
        index={1}
      />
      <StatCard
        label="BUNKER FUEL · VLSFO"
        series={s.bunker}
        delta={null}
        caption="SINGAPORE HUB · STEADY"
        format={(v) => `$${v.toFixed(2)} / MT`}
        index={2}
      />
    </section>
  );
};
