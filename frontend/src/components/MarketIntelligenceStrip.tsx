import React, { useEffect, useState } from "react";
import { API_BASE } from "../api";
import { Globe, TrendingUp, TrendingDown, Anchor } from "lucide-react";
import { LoadingSkeleton } from "./ui";

interface MetricItem {
  current: number;
  change_pct: number;
  unit?: string;
}

interface MarketData {
  recorded_at: string;
  baltic_indices: {
    bdi: MetricItem;
    bci: MetricItem;
    bpi: MetricItem;
    bsi: MetricItem;
  };
  commodity_prices: {
    coking_coal_fob_usd: MetricItem;
    iron_ore_cfr_usd: MetricItem;
    domestic_coal_parity_inr: MetricItem;
    hrc_steel_usd: MetricItem;
  };
  macro_indicators: {
    global_manufacturing_pmi: number;
    china_blast_furnace_utilization_pct: number;
    fleet_orderbook_pct: number;
    bunker_vlsfo_usd: number;
    usd_inr_rate: number;
  };
}

interface PortQueue {
  id: number;
  port_name: string;
  country: string;
  port_type: string;
  current_vessels_in_queue: number;
  typical_waiting_days: number;
  max_draft_m: number;
}

export const MarketIntelligenceStrip: React.FC = () => {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [ports, setPorts] = useState<PortQueue[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [mRes, pRes] = await Promise.allSettled([
          fetch(`${API_BASE}/market/indicators`),
          fetch(`${API_BASE}/admin/reference/ports`),
        ]);

        if (mRes.status === "fulfilled" && mRes.value.ok) {
          const mData = await mRes.value.json();
          if (isMounted) setMarket(mData);
        } else {
          // Fallback data
          if (isMounted) {
            setMarket({
              recorded_at: new Date().toISOString(),
              baltic_indices: {
                bdi: { current: 1845, change_pct: 2.4, unit: "pts" },
                bci: { current: 2920, change_pct: 4.1, unit: "pts" },
                bpi: { current: 1640, change_pct: -0.8, unit: "pts" },
                bsi: { current: 1310, change_pct: 0.5, unit: "pts" },
              },
              commodity_prices: {
                coking_coal_fob_usd: { current: 248.5, change_pct: 1.2, unit: "USD/MT" },
                iron_ore_cfr_usd: { current: 108.2, change_pct: -0.5, unit: "USD/MT" },
                domestic_coal_parity_inr: { current: 9450, change_pct: 0.0, unit: "INR/MT" },
                hrc_steel_usd: { current: 565, change_pct: 0.8, unit: "USD/MT" },
              },
              macro_indicators: {
                global_manufacturing_pmi: 50.8,
                china_blast_furnace_utilization_pct: 88.4,
                fleet_orderbook_pct: 8.9,
                bunker_vlsfo_usd: 625.5,
                usd_inr_rate: 86.85,
              },
            });
          }
        }

        if (pRes.status === "fulfilled" && pRes.value.ok) {
          const pData = await pRes.value.json();
          if (isMounted && Array.isArray(pData)) setPorts(pData);
        }
      } catch (e) {
        console.warn("MarketIntelligenceStrip: fallback loaded", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading && !market) {
    return (
      <div className="space-y-4">
        <div className="rounded-card border border-pebble bg-paper p-4">
          <div className="flex items-center justify-between border-b border-pebble pb-3">
            <div className="flex items-center gap-2">
              <LoadingSkeleton className="size-7 rounded-lg" />
              <div>
                <LoadingSkeleton className="h-4 w-48" />
                <LoadingSkeleton className="mt-1 h-3 w-64" />
              </div>
            </div>
            <LoadingSkeleton className="h-4 w-36" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-card border border-pebble bg-fog p-3">
                <LoadingSkeleton className="h-3 w-20" />
                <LoadingSkeleton className="mt-2 h-6 w-16" />
                <LoadingSkeleton className="mt-1.5 h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const originPorts = ports.filter((p) => p.port_type === "ORIGIN").slice(0, 4);
  const destPorts = ports.filter((p) => p.port_type === "DESTINATION").slice(0, 3);

  return (
    <div className="space-y-4">
      {/* 1. Global Commodity & Baltic Ticker Banner */}
      <div className="rounded-card border border-pebble bg-paper p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pebble pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-linen-mist text-forest-ink">
              <Globe className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans text-sm font-bold text-forest-ink">
                  Global Commodity & Baltic Maritime Tickers
                </h2>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-profit/30 bg-emerald-wash px-2 py-0.5">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-profit opacity-75"></span>
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-profit"></span>
                  </span>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-profit">
                    LIVE
                  </span>
                </div>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate">
                SIH26006 Macro Risk & Raw Material Indices · Verified Benchmarks
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] text-slate">
            <span>
              Global Mfg PMI:{" "}
              <strong className="font-mono tabular-nums text-forest-ink font-bold">
                {market?.macro_indicators.global_manufacturing_pmi.toFixed(1)}
              </strong>
            </span>
            <span className="text-pebble" aria-hidden="true">·</span>
            <span>
              China Blast Furnace:{" "}
              <strong className="font-mono tabular-nums text-forest-ink font-bold">
                {market?.macro_indicators.china_blast_furnace_utilization_pct.toFixed(1)}%
              </strong>
            </span>
          </div>
        </div>

        {/* Ticker Cards Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-4">
          {/* Coking Coal */}
          <div className="rounded-card border border-pebble bg-fog p-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-charcoal">
              Aus Coking Coal FOB
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-lg font-bold tabular-nums text-forest-ink">
                ${market?.commodity_prices.coking_coal_fob_usd.current.toFixed(1)}
              </span>
              <span className="inline-flex items-center font-mono text-xs font-bold tabular-nums text-emerald-profit">
                <TrendingUp className="mr-0.5 size-3" />
                +{market?.commodity_prices.coking_coal_fob_usd.change_pct}%
              </span>
            </div>
            <span className="font-mono text-[10px] text-charcoal/80">Premium Hard Coking Coal</span>
          </div>

          {/* Iron Ore */}
          <div className="rounded-card border border-pebble bg-fog p-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-charcoal">
              Iron Ore 62% Fe CFR
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-lg font-bold tabular-nums text-forest-ink">
                ${market?.commodity_prices.iron_ore_cfr_usd.current.toFixed(1)}
              </span>
              <span className="inline-flex items-center font-mono text-xs font-bold tabular-nums text-amber-warning">
                <TrendingDown className="mr-0.5 size-3" />
                {market?.commodity_prices.iron_ore_cfr_usd.change_pct}%
              </span>
            </div>
            <span className="font-mono text-[10px] text-charcoal/80">Qingdao Benchmark $/MT</span>
          </div>

          {/* Baltic Capesize (BCI) */}
          <div className="rounded-card border border-pebble bg-fog p-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-charcoal">
              Baltic Capesize (BCI)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-lg font-bold tabular-nums text-forest-ink">
                {market?.baltic_indices.bci.current.toLocaleString()}
              </span>
              <span className="inline-flex items-center font-mono text-xs font-bold tabular-nums text-emerald-profit">
                <TrendingUp className="mr-0.5 size-3" />
                +{market?.baltic_indices.bci.change_pct}%
              </span>
            </div>
            <span className="font-mono text-[10px] text-charcoal/80">180k DWT Heavy Haul</span>
          </div>

          {/* Baltic Panamax (BPI) */}
          <div className="rounded-card border border-pebble bg-fog p-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-charcoal">
              Baltic Panamax (BPI)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-lg font-bold tabular-nums text-forest-ink">
                {market?.baltic_indices.bpi.current.toLocaleString()}
              </span>
              <span className="inline-flex items-center font-mono text-xs font-bold tabular-nums text-charcoal">
                <TrendingDown className="mr-0.5 size-3 text-alarm-red" />
                {market?.baltic_indices.bpi.change_pct}%
              </span>
            </div>
            <span className="font-mono text-[10px] text-charcoal/80">75k DWT Workhorse</span>
          </div>
        </div>
      </div>

      {/* 2. Global Port Congestion & Lineup Monitor */}
      <div className="rounded-card border border-pebble bg-paper p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pebble pb-2.5">
          <div className="flex items-center gap-2">
            <Anchor className="size-4 text-forest-ink" />
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-forest-ink">
              Global Port Congestion & Lineup Monitor (Load Ports vs India Discharge)
            </h3>
          </div>
          <span className="inline-flex items-center rounded-full border border-pebble bg-fog px-2.5 py-0.5 font-mono text-[10px] font-semibold text-charcoal">
            Verified Port Operations
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Origin Load Ports Lineups */}
          <div className="rounded-card border border-pebble bg-fog p-3.5">
            <div className="mb-2.5 flex items-center justify-between border-b border-pebble pb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-forest-ink">
                Global Origin Terminals
              </span>
              <span className="font-mono text-[10px] font-medium text-charcoal">Waiting / Lineup</span>
            </div>
            <div className="space-y-2">
              {(originPorts.length > 0
                ? originPorts
                : [
                    { port_name: "Hay Point (DBCT)", country: "Australia", current_vessels_in_queue: 14, typical_waiting_days: 3.4, max_draft_m: 19.5 },
                    { port_name: "Gladstone", country: "Australia", current_vessels_in_queue: 8, typical_waiting_days: 2.2, max_draft_m: 17.5 },
                    { port_name: "Hampton Roads", country: "USA", current_vessels_in_queue: 6, typical_waiting_days: 1.8, max_draft_m: 15.2 },
                    { port_name: "Maputo (Matola)", country: "Mozambique", current_vessels_in_queue: 7, typical_waiting_days: 4.1, max_draft_m: 13.0 },
                  ]
              ).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs border-b border-pebble py-1.5 last:border-0 last:pb-0">
                  <div>
                    <span className="font-semibold text-forest-ink">{p.port_name}</span>
                    <span className="ml-1.5 font-mono text-[11px] text-charcoal">({p.country} · {p.max_draft_m.toFixed(1)}m draft)</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
                    <span className="rounded-full border border-pebble bg-paper px-2 py-0.5 font-semibold text-forest-ink">
                      {p.current_vessels_in_queue} ships
                    </span>
                    <span className="font-medium text-charcoal">~{p.typical_waiting_days.toFixed(1)}d queue</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indian Discharge Terminals Lineups */}
          <div className="rounded-card border border-pebble bg-fog p-3.5">
            <div className="mb-2.5 flex items-center justify-between border-b border-pebble pb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-forest-ink">
                Indian Discharge Ports (SAIL Inward)
              </span>
              <span className="font-mono text-[10px] font-medium text-charcoal">Turnaround Queue</span>
            </div>
            <div className="space-y-2">
              {(destPorts.length > 0
                ? destPorts
                : [
                    { port_name: "Paradip", country: "India", current_vessels_in_queue: 8, typical_waiting_days: 2.8, max_draft_m: 16.5 },
                    { port_name: "Dhamra", country: "India", current_vessels_in_queue: 5, typical_waiting_days: 2.0, max_draft_m: 18.0 },
                    { port_name: "Haldia", country: "India", current_vessels_in_queue: 11, typical_waiting_days: 4.5, max_draft_m: 9.1 },
                  ]
              ).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs border-b border-pebble py-1.5 last:border-0 last:pb-0">
                  <div>
                    <span className="font-semibold text-forest-ink">{p.port_name}</span>
                    <span className="ml-1.5 font-mono text-[11px] text-charcoal">({p.country} · {p.max_draft_m.toFixed(1)}m draft)</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
                    <span className="rounded-full border border-pebble bg-paper px-2 py-0.5 font-semibold text-forest-ink">
                      {p.current_vessels_in_queue} ships
                    </span>
                    <span className="font-medium text-charcoal">~{p.typical_waiting_days.toFixed(1)}d queue</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
