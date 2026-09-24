import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import {
  Plus,
  GitMerge,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Anchor,
  Flame,
  X,
  Sparkles,
  Layers,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { LoadingSkeleton, EmptyState, Pill } from "../components/ui";

interface DemandItem {
  id: number;
  plant_id: number;
  plant_name: string;
  cargo_type_id: number;
  cargo_type: string;
  quantity_mt: number;
  destination_port_id: number;
  destination_port: string;
  status: string;
  merged_into_id?: number | null;
  created_at: string;
  requested_by?: string;
}

interface PlantStockpile {
  id: number;
  plantName: string;
  code: string;
  currentStockMt: number;
  dailyBurnRateMt: number;
  targetDays: number;
  lastRakeArrival: string;
  preferredPort: string;
}

const INITIAL_STOCKPILES: PlantStockpile[] = [
  {
    id: 1,
    plantName: "Bhilai Steel Plant",
    code: "BSP",
    currentStockMt: 172000,
    dailyBurnRateMt: 13800,
    targetDays: 35,
    lastRakeArrival: "Today, 06:30 IST",
    preferredPort: "Paradip Port",
  },
  {
    id: 2,
    plantName: "Durgapur Steel Plant",
    code: "DSP",
    currentStockMt: 98000,
    dailyBurnRateMt: 7200,
    targetDays: 30,
    lastRakeArrival: "Yesterday, 21:15 IST",
    preferredPort: "Haldia / Paradip",
  },
  {
    id: 3,
    plantName: "Rourkela Steel Plant",
    code: "RSP",
    currentStockMt: 218000,
    dailyBurnRateMt: 9600,
    targetDays: 35,
    lastRakeArrival: "Today, 11:45 IST",
    preferredPort: "Paradip Port",
  },
  {
    id: 4,
    plantName: "Bokaro Steel Plant",
    code: "BSL",
    currentStockMt: 335000,
    dailyBurnRateMt: 10400,
    targetDays: 35,
    lastRakeArrival: "Today, 04:10 IST",
    preferredPort: "Dhamra Port",
  },
  {
    id: 5,
    plantName: "IISCO Steel Plant",
    code: "ISP",
    currentStockMt: 185000,
    dailyBurnRateMt: 5400,
    targetDays: 30,
    lastRakeArrival: "Today, 14:20 IST",
    preferredPort: "Dhamra Port",
  },
];

function getDoiVisualTokens(doi: number) {
  if (doi <= 15) {
    return {
      status: "CRITICAL",
      label: "Critical (≤15d)",
      textColor: "text-alarm-red",
      bgColor: "bg-alarm-wash",
      borderColor: "border-alarm-red/30",
      barColor: "bg-alarm-red",
      badgeTone: "negative" as const,
      description: "Immediate rail rake dispatch required to avert furnace ramp-down.",
    };
  }
  if (doi <= 30) {
    return {
      status: "WARNING",
      label: "Buffer Warning (16-30d)",
      textColor: "text-amber-warning",
      bgColor: "bg-amber-wash",
      borderColor: "border-amber-warning/30",
      barColor: "bg-amber-warning",
      badgeTone: "pending" as const,
      description: "Stock within watch band. Parcel consolidation recommended.",
    };
  }
  return {
    status: "HEALTHY",
    label: "Optimal (>30d)",
    textColor: "text-emerald-profit",
    bgColor: "bg-emerald-wash",
    borderColor: "border-emerald-profit/30",
    barColor: "bg-emerald-profit",
    badgeTone: "positive" as const,
    description: "Adequate raw material runway for continuous sinter & blast operations.",
  };
}

export const DemandBoardPage: React.FC = () => {
  const [requests, setRequests] = useState<DemandItem[]>([]);
  const [stockpiles] = useState<PlantStockpile[]>(INITIAL_STOCKPILES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isMerging, setIsMerging] = useState<boolean>(false);

  // Inline form state
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newPlantId, setNewPlantId] = useState<number>(1); // Bhilai
  const [newCargoTypeId, setNewCargoTypeId] = useState<number>(1); // Coking Coal
  const [newQuantity, setNewQuantity] = useState<number>(35000);
  const [newPortId, setNewPortId] = useState<number>(1); // Paradip
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter state for stockpiles
  const [stockpileFilter, setStockpileFilter] = useState<"ALL" | "CRITICAL" | "WARNING" | "HEALTHY">("ALL");

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchDemand = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<DemandItem[]>("/demand");
      setRequests(data || []);
      setSelectedIds([]);
    } catch {
      // Demo fallback if backend is offline
      setRequests([
        {
          id: 1,
          plant_id: 1,
          plant_name: "Bhilai Steel Plant",
          cargo_type_id: 1,
          cargo_type: "Coking Coal (Low-Vol Hard Coking)",
          quantity_mt: 40000,
          destination_port_id: 1,
          destination_port: "Paradip Port",
          status: "OPEN",
          created_at: new Date().toISOString(),
          requested_by: "SAIL Bhilai Logistics",
        },
        {
          id: 2,
          plant_id: 2,
          plant_name: "Rourkela Steel Plant",
          cargo_type_id: 1,
          cargo_type: "Coking Coal (Low-Vol Hard Coking)",
          quantity_mt: 35000,
          destination_port_id: 1,
          destination_port: "Paradip Port",
          status: "OPEN",
          created_at: new Date().toISOString(),
          requested_by: "SAIL Rourkela Logistics",
        },
        {
          id: 3,
          plant_id: 2,
          plant_name: "Durgapur Steel Plant",
          cargo_type_id: 3,
          cargo_type: "PCI Coal (Pulverized Injection)",
          quantity_mt: 25000,
          destination_port_id: 2,
          destination_port: "Dhamra Port",
          status: "OPEN",
          created_at: new Date().toISOString(),
          requested_by: "SAIL Durgapur RM Division",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDemand();
  }, []);

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Merge Selected Requests
  const handleMerge = async () => {
    if (selectedIds.length !== 2) return;
    try {
      setIsMerging(true);
      const res = await apiClient<{ status: string; message?: string }>("/demand/merge", {
        method: "POST",
        body: JSON.stringify({
          request_id_a: selectedIds[0],
          request_id_b: selectedIds[1],
        }),
      });
      setToastMessage({
        text: res.message || "Requests merged into one combined Capesize parcel fixture.",
        type: "success",
      });
      fetchDemand();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error merging requests";
      if (errMsg.includes("different ports") || errMsg.includes("Cannot merge")) {
        setToastMessage({
          text: "Cannot merge: selected requests have mismatched destination ports.",
          type: "error",
        });
      } else {
        setToastMessage({
          text: errMsg,
          type: "error",
        });
      }
    } finally {
      setIsMerging(false);
    }
  };

  // Post New Request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuantity <= 0) return;
    try {
      setIsSubmitting(true);
      await apiClient("/demand", {
        method: "POST",
        body: JSON.stringify({
          plant_id: newPlantId,
          cargo_type_id: newCargoTypeId,
          quantity_mt: newQuantity,
          destination_port_id: newPortId,
        }),
      });
      setToastMessage({
        text: "New cargo demand posted successfully to procurement board.",
        type: "success",
      });
      setShowCreateForm(false);
      fetchDemand();
    } catch (err: unknown) {
      setToastMessage({
        text: err instanceof Error ? err.message : "Failed to post demand request.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const plants = [
    { id: 1, name: "Bhilai Steel Plant (BSP)" },
    { id: 2, name: "Rourkela Steel Plant (RSP)" },
    { id: 3, name: "Durgapur Steel Plant (DSP)" },
    { id: 4, name: "Bokaro Steel Plant (BSL)" },
    { id: 5, name: "IISCO Steel Plant (Burnpur)" },
  ];

  const ports = [
    { id: 1, name: "Paradip Port (Max Draft: 17.1m — Primary Berth)" },
    { id: 2, name: "Dhamra Port (Max Draft: 18.0m — Capesize Berth)" },
    { id: 3, name: "Gangavaram Port (Max Draft: 18.5m — Deep Berth)" },
    { id: 4, name: "Haldia Port (Max Draft: 8.5m — Riverine Restricted)" },
  ];

  const cargoTypes = [
    { id: 1, name: "Coking Coal (Low-Vol Hard Coking)" },
    { id: 2, name: "Thermal / Steam Coal" },
    { id: 3, name: "PCI Coal (Pulverized Injection)" },
    { id: 4, name: "Limestone / Flux" },
  ];

  const totalDemandMT = requests.reduce((acc, r) => acc + (r.quantity_mt || 0), 0);
  const criticalStockpileCount = stockpiles.filter((p) => p.currentStockMt / p.dailyBurnRateMt <= 15).length;

  const filteredStockpiles = stockpiles.filter((p) => {
    const doi = p.currentStockMt / p.dailyBurnRateMt;
    if (stockpileFilter === "CRITICAL") return doi <= 15;
    if (stockpileFilter === "WARNING") return doi > 15 && doi <= 30;
    if (stockpileFilter === "HEALTHY") return doi > 30;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-card p-4 text-xs font-semibold shadow-md transition-all ${
            toastMessage.type === "success"
              ? "bg-forest-ink text-paper border border-lime-voltage/30"
              : "border border-alarm-red/40 bg-alarm-wash text-alarm-red"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="size-4 text-lime-voltage" />
            ) : (
              <AlertCircle className="size-4 text-alarm-red" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="rounded p-1 text-slate hover:text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink"
            aria-label="Dismiss message"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pebble pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
              PAGE 11: DEMAND BOARD
            </span>
            <span className="font-mono text-xs text-slate">
              SAIL CENTRAL LOGISTICS DESK
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-forest-ink sm:text-3xl">
            SAIL Plant Demand Board & Stockpile Intelligence
          </h1>
          <p className="mt-0.5 text-xs text-slate">
            Real-time stockpile Days of Inventory (DOI), burn rate depletion monitoring, and multi-plant cargo parcel consolidation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-1.5 rounded-full bg-forest-ink px-4 py-2 text-xs font-semibold text-paper shadow-sm hover:bg-forest-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-ink active:scale-95 transition-all"
          >
            {showCreateForm ? <X className="size-3.5" /> : <Plus className="size-3.5 text-lime-voltage" />}
            <span>{showCreateForm ? "Close Form" : "Post Cargo Demand"}</span>
          </button>

          <button
            type="button"
            onClick={fetchDemand}
            aria-label="Refresh demand board data"
            className="inline-flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3.5 py-2 text-xs font-medium text-charcoal hover:bg-fog focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-ink transition-colors"
          >
            <RotateCcw className="size-3.5 text-slate" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-pebble bg-paper p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate">Open Plant Requests</span>
            <span className="rounded-full bg-forest-ink/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-forest-ink">
              Active Lots
            </span>
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-forest-ink tabular-nums">
            {isLoading ? "…" : requests.length}
          </div>
          <p className="mt-0.5 text-[11px] text-slate">Awaiting consolidation or chartering</p>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate">Aggregated Tonnage</span>
            <span className="rounded-full bg-linen-mist px-2 py-0.5 font-mono text-[10px] font-semibold text-spruce">
              Pooled
            </span>
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-forest-ink tabular-nums">
            {isLoading ? "…" : totalDemandMT.toLocaleString()}{" "}
            <span className="text-xs font-sans font-normal text-slate">MT</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate">Open low-vol & PCI coal requirement</p>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate">Critical Stockpiles (≤15d DOI)</span>
            {criticalStockpileCount > 0 ? (
              <span className="rounded-full bg-alarm-wash px-2 py-0.5 font-mono text-[10px] font-bold text-alarm-red">
                {criticalStockpileCount} At Risk
              </span>
            ) : (
              <span className="rounded-full bg-emerald-wash px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-profit">
                Stable
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className={`font-mono text-2xl font-bold tabular-nums ${criticalStockpileCount > 0 ? "text-alarm-red" : "text-emerald-profit"}`}>
              {criticalStockpileCount} of {stockpiles.length} Plants
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate">
            Bhilai & Durgapur require expedited rake clearances
          </p>
        </div>
      </div>

      {/* SECTION 1: Stockpile DOI Inventory Gauges & Depletion Runway */}
      <div className="rounded-card border border-pebble bg-paper p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pebble pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-forest-ink" />
              <h2 className="text-base font-bold text-forest-ink">
                SAIL Integrated Steel Plants: Stockpile Days of Inventory (DOI)
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate">
              Operational buffer thresholds: <span className="font-semibold text-alarm-red">≤15d Critical</span>,{" "}
              <span className="font-semibold text-amber-warning">16-30d Buffer Warning</span>, and{" "}
              <span className="font-semibold text-emerald-profit">&gt;30d Optimal</span>.
            </p>
          </div>

          {/* DOI Segmented Filter Buttons */}
          <div className="flex items-center rounded-full border border-pebble bg-fog p-1 text-xs">
            {(["ALL", "CRITICAL", "WARNING", "HEALTHY"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStockpileFilter(filter)}
                className={`rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-all focus-visible:outline-2 focus-visible:outline-forest-ink ${
                  stockpileFilter === filter
                    ? "bg-forest-ink text-paper shadow-sm"
                    : "text-charcoal hover:text-forest-ink"
                }`}
              >
                {filter === "ALL" && "All Plants"}
                {filter === "CRITICAL" && "Critical (≤15d)"}
                {filter === "WARNING" && "Warning (16-30d)"}
                {filter === "HEALTHY" && "Optimal (>30d)"}
              </button>
            ))}
          </div>
        </div>

        {/* Stockpile Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStockpiles.map((plant) => {
            const doi = Math.round((plant.currentStockMt / plant.dailyBurnRateMt) * 10) / 10;
            const tokens = getDoiVisualTokens(doi);
            const progressPct = Math.min(100, Math.round((doi / 45) * 100));

            return (
              <div
                key={plant.id}
                className={`rounded-card border p-4 transition-all hover:border-forest-ink/60 bg-paper ${tokens.borderColor}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-forest-ink text-sm">
                      <Building2 className="size-4 text-slate" />
                      <span>{plant.plantName}</span>
                      <span className="rounded bg-fog px-1.5 py-0.2 font-mono text-[10px] text-charcoal font-semibold">
                        {plant.code}
                      </span>
                    </div>
                    <span className="mt-0.5 font-mono text-[10px] text-slate block">
                      Preferred Port: {plant.preferredPort}
                    </span>
                  </div>

                  <Pill tone={tokens.badgeTone}>
                    {doi <= 15 ? <AlertTriangle className="size-3" /> : <Flame className="size-3" />}
                    <span>{tokens.label}</span>
                  </Pill>
                </div>

                {/* Gauge Metric Callout */}
                <div className="mt-4 flex items-baseline justify-between border-t border-pebble/60 pt-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase text-slate">Current Stockpile</span>
                    <div className="font-mono text-lg font-bold text-forest-ink tabular-nums">
                      {plant.currentStockMt.toLocaleString()}{" "}
                      <span className="text-xs font-sans font-normal text-slate">MT</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-[10px] uppercase text-slate">Daily Burn Rate</span>
                    <div className="font-mono text-lg font-bold text-charcoal tabular-nums">
                      {plant.dailyBurnRateMt.toLocaleString()}{" "}
                      <span className="text-xs font-sans font-normal text-slate">MT/d</span>
                    </div>
                  </div>
                </div>

                {/* Visual DOI Bar & Target Markers */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-[11px] font-semibold text-charcoal">
                      Depletion Runway (DOI):
                    </span>
                    <span className={`font-mono text-sm font-bold tabular-nums ${tokens.textColor}`}>
                      {doi.toFixed(1)} Days
                    </span>
                  </div>

                  {/* Visual Bar with 15d and 30d visual reference markers */}
                  <div className="relative h-3 w-full rounded-full bg-fog overflow-hidden border border-pebble/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${tokens.barColor}`}
                      style={{ width: `${progressPct}%` }}
                    />
                    {/* 15d Marker at 33.3% */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-alarm-red/60"
                      style={{ left: "33.3%" }}
                      title="15-day critical line"
                    />
                    {/* 30d Marker at 66.6% */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-warning/60"
                      style={{ left: "66.6%" }}
                      title="30-day buffer line"
                    />
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate">
                    <span>0d</span>
                    <span className="text-alarm-red font-semibold">15d (Alert)</span>
                    <span className="text-amber-warning font-semibold">30d (Target)</span>
                    <span>45d+</span>
                  </div>
                </div>

                {/* Subtext description */}
                <p className="mt-3 text-[11px] text-slate leading-relaxed border-t border-pebble/40 pt-2">
                  {tokens.description}
                </p>

                <div className="mt-2 text-[10px] font-mono text-slate flex items-center justify-between">
                  <span>Last Rake: {plant.lastRakeArrival}</span>
                  <span className="font-semibold text-forest-ink">Target: {plant.targetDays}d buffer</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Task 393: Inline Create Form */}
      {showCreateForm && (
        <div className="rounded-card border-2 border-forest-ink/30 bg-linen-mist/30 p-5 shadow-sm transition-all">
          <div className="flex items-center justify-between border-b border-pebble pb-3">
            <div className="flex items-center gap-2">
              <Plus className="size-4 text-forest-ink" />
              <h3 className="text-sm font-bold text-forest-ink">
                Post New Plant Cargo Demand
              </h3>
            </div>
            <span className="font-mono text-[11px] text-slate">Procurement Dispatch Terminal</span>
          </div>

          <form onSubmit={handleCreateRequest} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="sail-plant" className="block text-[11px] font-semibold text-charcoal">SAIL Plant</label>
              <select
                id="sail-plant"
                value={newPlantId}
                onChange={(e) => setNewPlantId(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-pebble bg-paper p-2 text-xs text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink"
              >
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cargo-spec" className="block text-[11px] font-semibold text-charcoal">Cargo Specification</label>
              <select
                id="cargo-spec"
                value={newCargoTypeId}
                onChange={(e) => setNewCargoTypeId(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-pebble bg-paper p-2 text-xs text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink"
              >
                {cargoTypes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="quantity-mt" className="block text-[11px] font-semibold text-charcoal">Quantity (Metric Tonnes)</label>
              <input
                id="quantity-mt"
                type="number"
                min="1000"
                step="500"
                required
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-pebble bg-paper p-2 text-xs text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink font-mono tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="discharge-port" className="block text-[11px] font-semibold text-charcoal">Discharge Port</label>
              <select
                id="discharge-port"
                value={newPortId}
                onChange={(e) => setNewPortId(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-pebble bg-paper p-2 text-xs text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink"
              >
                {ports.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-full border border-pebble bg-paper px-4 py-2 text-xs font-semibold text-charcoal hover:bg-fog focus-visible:outline-2 focus-visible:outline-forest-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-full bg-forest-ink px-5 py-2 text-xs font-semibold text-paper hover:bg-forest-ink/90 focus-visible:outline-2 focus-visible:outline-forest-ink disabled:opacity-50"
              >
                <Plus className="size-3.5 text-lime-voltage" /> Submit Demand to Board
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: Task 392: Cargo Pooling & Consolidation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-pebble bg-paper p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-linen-mist p-2 text-forest-ink">
            <GitMerge className="size-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-forest-ink">
              Consolidated Cargo Pooling ({selectedIds.length} of 2 selected)
            </div>
            <div className="text-[11px] text-slate">
              Select exactly 2 plant requests destined for the same Indian port to combine into a single Capesize charter parcel.
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={selectedIds.length !== 2 || isMerging}
          onClick={handleMerge}
          className="inline-flex items-center gap-2 rounded-full bg-forest-ink px-5 py-2 text-xs font-semibold text-paper shadow-sm hover:bg-forest-ink/90 focus-visible:outline-2 focus-visible:outline-forest-ink disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          <GitMerge className="size-3.5 text-lime-voltage" />
          <span>Merge Selected Parcels</span>
        </button>
      </div>

      {/* SECTION 4: Open Demands Table with LoadingSkeleton & EmptyState */}
      <div className="overflow-hidden rounded-card border border-pebble bg-paper shadow-sm">
        <div className="border-b border-pebble bg-linen-mist/20 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-forest-ink" />
            <h3 className="text-sm font-bold text-forest-ink">Open Plant Demand Ledger</h3>
          </div>
          <span className="font-mono text-xs text-slate">
            {requests.length} open lot{requests.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-14 w-full" />
            <LoadingSkeleton className="h-14 w-full" />
            <LoadingSkeleton className="h-14 w-full" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Sparkles className="size-10 text-lime-voltage" />}
              title="No open cargo requests"
              description="All current steel plant demand has been pooled and fixture contracts have been created."
              action={
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-forest-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-forest-ink/90 focus-visible:outline-2 focus-visible:outline-forest-ink"
                >
                  <Plus className="size-3.5 text-lime-voltage" /> Post New Cargo Demand
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-pebble bg-fog font-mono text-[10px] uppercase tracking-wider text-charcoal">
                <tr>
                  <th className="w-12 px-4 py-3 text-center">Select</th>
                  <th className="px-4 py-3">Plant & Origin Desk</th>
                  <th className="px-4 py-3">Cargo Specification</th>
                  <th className="px-4 py-3 text-right">Quantity (MT)</th>
                  <th className="px-4 py-3">Discharge Port</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pebble">
                {requests.map((r) => {
                  const isChecked = selectedIds.includes(r.id);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => handleToggleSelect(r.id)}
                      className={`cursor-pointer transition-colors hover:bg-linen-mist/30 ${
                        isChecked ? "bg-linen-mist/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(r.id)}
                          aria-label={`Select request ${r.id} for ${r.plant_name}`}
                          className="size-4 rounded border-pebble text-forest-ink focus:ring-forest-ink focus-visible:outline-2 focus-visible:outline-forest-ink"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 font-semibold text-forest-ink">
                          <Building2 className="size-4 text-slate" />
                          <span>{r.plant_name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate">REQ-ID #{r.id}</span>
                      </td>
                      <td className="px-4 py-3.5 text-charcoal">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Flame className="size-3.5 text-amber-warning" />
                          <span>{r.cargo_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-forest-ink text-sm tabular-nums">
                        {r.quantity_mt.toLocaleString()}{" "}
                        <span className="text-xs font-sans font-normal text-slate">MT</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-charcoal">
                          <Anchor className="size-3.5 text-slate" />
                          <span>{r.destination_port}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate">
                        {r.requested_by || "SAIL Central Procurement"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Pill tone="positive">
                          <CheckCircle2 className="size-3" /> OPEN
                        </Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cape vs Panamax Strategy Recommendation */}
      <div className="rounded-card border border-pebble bg-linen-mist/20 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-forest-ink p-2 text-lime-voltage">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-forest-ink">
              Capesize Freight Arbitrage Opportunity
            </h4>
            <p className="mt-0.5 text-xs text-charcoal leading-relaxed max-w-2xl">
              Consolidating Bhilai (40,000 MT) and Rourkela (35,000 MT) parcels destined for Paradip yields a 75,000 MT parcel, reducing Ocean Freight from $17.80/MT (Panamax) to $13.60/MT (Capesize split discharge) — generating an estimated{" "}
              <strong className="text-emerald-profit font-mono tabular-nums">$315,000 USD</strong> in landed cost savings.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedIds([1, 2]);
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-forest-ink bg-paper px-4 py-2 text-xs font-semibold text-forest-ink hover:bg-forest-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-forest-ink transition-colors"
        >
          <span>Auto-Select Top 2 Parcels</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
};

export default DemandBoardPage;
