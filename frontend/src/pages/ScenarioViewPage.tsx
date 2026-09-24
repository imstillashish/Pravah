import React, { useState } from "react";
import {
  Sliders,
  RefreshCw,
  Sparkles,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Pill } from "../components/ui";

interface ScenarioMetrics {
  name?: string;
  quantity_mt: number;
  delivery_days_offset: number;
  vessel_class: string;
  port: string;
  bunker_price_offset: number;
  congestion_days: number;
  predicted_freight: number;
  total_savings_usd: number;
  landed_cost_inr_pmt: number;
  demurrage_exposure_usd: number;
  stockpile_runway_impact_days: number;
  overall_feasible: boolean;
  feasibility_note?: string;
}

export const ScenarioViewPage: React.FC = () => {
  // Baseline values (Newcastle->Paradip 75k MT Panamax)
  const baseline: ScenarioMetrics = {
    name: "Baseline Fixture (Golden Demo)",
    quantity_mt: 75000,
    delivery_days_offset: 0,
    vessel_class: "Panamax",
    port: "Paradip",
    bunker_price_offset: 0,
    congestion_days: 2,
    predicted_freight: 22.30,
    total_savings_usd: 240000,
    landed_cost_inr_pmt: 1962.25,
    demurrage_exposure_usd: 37000,
    stockpile_runway_impact_days: 0,
    overall_feasible: true,
  };

  // Interactive slider parameters
  const [quantityPct, setQuantityPct] = useState<number>(0); // -15% to +15%
  const [deliveryDays, setDeliveryDays] = useState<number>(0); // -10 to +10 days
  const [vesselOverride, setVesselOverride] = useState<string>("Panamax");
  const [portOverride, setPortOverride] = useState<string>("Paradip");
  const [bunkerShockPct, setBunkerShockPct] = useState<number>(0); // -20% to +20%
  const [congestionDays, setCongestionDays] = useState<number>(2); // 0 to 14 days

  const [activeScenario, setActiveScenario] = useState<ScenarioMetrics>(baseline);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [scenarioExecuted, setScenarioExecuted] = useState<boolean>(false);

  // Draft Limits by Port
  const PORT_MAX_DRAFT: Record<string, number> = {
    Paradip: 16.5,
    Dhamra: 18.0,
    Gangavaram: 19.5,
    Haldia: 14.5,
  };

  // Summer Draft by Vessel Class
  const VESSEL_REQUIRED_DRAFT: Record<string, number> = {
    Handysize: 10.2,
    Supramax: 12.8,
    Panamax: 14.45,
    Capesize: 18.2,
  };

  const runScenarioSimulation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const simulatedQty = Math.round(75000 * (1 + quantityPct / 100));

      // Base freight according to vessel scale
      let baseFreight = 22.30;
      let isFeasible = true;
      let note = "";

      if (vesselOverride === "Capesize") {
        baseFreight = 17.80; // Economy of scale
      } else if (vesselOverride === "Supramax") {
        baseFreight = 25.80;
      } else if (vesselOverride === "Handysize") {
        baseFreight = 29.50;
      }

      // Check physical draft constraint
      const portDraft = PORT_MAX_DRAFT[portOverride] || 16.5;
      const vesselDraft = VESSEL_REQUIRED_DRAFT[vesselOverride] || 14.45;

      if (vesselDraft > portDraft) {
        isFeasible = false;
        note = `${vesselOverride} laden draft (${vesselDraft}m) exceeds ${portOverride}'s maximum permissible channel draft (${portDraft}m). Offshore transshipment or lightering required.`;
      } else if (portOverride === "Haldia" && vesselOverride === "Panamax") {
        isFeasible = false;
        note = `Panamax draft (${vesselDraft}m) requires tidal assistance and high dredging margin at Haldia Dock Complex. Restricted to 55,000 MT max parcel.`;
      }

      // Quantity sensitivity impact
      if (quantityPct > 5) baseFreight -= 0.50;
      if (quantityPct < -5) baseFreight += 0.75;

      // Delivery drift urgency impact
      if (deliveryDays > 3) baseFreight += 0.85;
      if (deliveryDays < -3) baseFreight -= 0.40;

      // Bunker shock impact (VLSFO ~35% of total operating voyage expense)
      const bunkerImpact = (bunkerShockPct / 100) * 3.40;

      // Port waiting demurrage impact ($18,500/day standard Baltic charter rate)
      const demurrageTotal = congestionDays * 18500;
      const demurragePmt = demurrageTotal / simulatedQty;

      const finalFreight = Math.max(11.50, Math.round((baseFreight + bunkerImpact + demurragePmt) * 100) / 100);
      const benchmarkRate = 25.50;
      const totalSavings = Math.round((benchmarkRate - finalFreight) * simulatedQty);
      const landedInr = Math.round((finalFreight + 1.20) * 83.50 * 100) / 100;

      // Stockpile runway impact (days based on 9,600 MT/day average consumption)
      const stockpileDeltaDays = Math.round(((simulatedQty - 75000) / 9600) * 10) / 10;

      setActiveScenario({
        name: `Simulated: ${vesselOverride} to ${portOverride} (${quantityPct >= 0 ? `+${quantityPct}%` : `${quantityPct}%`})`,
        quantity_mt: simulatedQty,
        delivery_days_offset: deliveryDays,
        vessel_class: vesselOverride,
        port: portOverride,
        bunker_price_offset: bunkerShockPct,
        congestion_days: congestionDays,
        predicted_freight: finalFreight,
        total_savings_usd: totalSavings,
        landed_cost_inr_pmt: landedInr,
        demurrage_exposure_usd: demurrageTotal,
        stockpile_runway_impact_days: stockpileDeltaDays,
        overall_feasible: isFeasible,
        feasibility_note: note,
      });

      setIsCalculating(false);
      setScenarioExecuted(true);
    }, 280);
  };

  const resetToBaseline = () => {
    setQuantityPct(0);
    setDeliveryDays(0);
    setVesselOverride("Panamax");
    setPortOverride("Paradip");
    setBunkerShockPct(0);
    setCongestionDays(2);
    setActiveScenario(baseline);
    setScenarioExecuted(false);
  };

  // Benchmark Comparative Scenarios
  const matrixScenarios: ScenarioMetrics[] = [
    {
      name: "1. Baseline (Golden Demo)",
      quantity_mt: 75000,
      delivery_days_offset: 0,
      vessel_class: "Panamax",
      port: "Paradip",
      bunker_price_offset: 0,
      congestion_days: 2,
      predicted_freight: 22.30,
      total_savings_usd: 240000,
      landed_cost_inr_pmt: 1962.25,
      demurrage_exposure_usd: 37000,
      stockpile_runway_impact_days: 0,
      overall_feasible: true,
    },
    {
      name: "2. Deep-Draft Capesize (Dhamra)",
      quantity_mt: 110000,
      delivery_days_offset: 2,
      vessel_class: "Capesize",
      port: "Dhamra",
      bunker_price_offset: 0,
      congestion_days: 1,
      predicted_freight: 17.65,
      total_savings_usd: 863500,
      landed_cost_inr_pmt: 1573.80,
      demurrage_exposure_usd: 24000,
      stockpile_runway_impact_days: 3.6,
      overall_feasible: true,
    },
    {
      name: "3. Bunker Stress Test (+20% Shock)",
      quantity_mt: 75000,
      delivery_days_offset: 0,
      vessel_class: "Panamax",
      port: "Paradip",
      bunker_price_offset: 20,
      congestion_days: 5,
      predicted_freight: 24.25,
      total_savings_usd: 93750,
      landed_cost_inr_pmt: 2125.10,
      demurrage_exposure_usd: 92500,
      stockpile_runway_impact_days: 0,
      overall_feasible: true,
    },
    {
      name: activeScenario.name || "4. Active Custom Simulation",
      quantity_mt: activeScenario.quantity_mt,
      delivery_days_offset: activeScenario.delivery_days_offset,
      vessel_class: activeScenario.vessel_class,
      port: activeScenario.port,
      bunker_price_offset: activeScenario.bunker_price_offset,
      congestion_days: activeScenario.congestion_days,
      predicted_freight: activeScenario.predicted_freight,
      total_savings_usd: activeScenario.total_savings_usd,
      landed_cost_inr_pmt: activeScenario.landed_cost_inr_pmt,
      demurrage_exposure_usd: activeScenario.demurrage_exposure_usd,
      stockpile_runway_impact_days: activeScenario.stockpile_runway_impact_days,
      overall_feasible: activeScenario.overall_feasible,
      feasibility_note: activeScenario.feasibility_note,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pebble pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
              PAGE 09: SCENARIO STUDIO
            </span>
            <span className="rounded-full bg-linen-mist px-2.5 py-0.5 font-mono text-xs font-semibold text-spruce">
              WHAT-IF MULTI-VARIABLE ENGINE
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-forest-ink sm:text-3xl">
            Procurement Scenario & Sensitivity Analysis Studio
          </h1>
          <p className="mt-0.5 text-xs text-slate">
            Stress-test cargo lot adjustments, laycan drift, bunker volatility, port draft envelopes, and demurrage exposure in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={resetToBaseline}
          className="inline-flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-4 py-2 text-xs font-semibold text-charcoal hover:bg-fog focus-visible:outline-2 focus-visible:outline-forest-ink transition-colors"
        >
          <RotateCcw className="size-3.5 text-slate" /> Reset to Baseline
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Controls Column (6 Variable Sliders / Selectors) */}
        <div className="rounded-card border border-pebble bg-paper p-6 shadow-sm lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between border-b border-pebble pb-3">
            <h3 className="font-bold text-sm text-forest-ink flex items-center gap-2">
              <Sliders className="size-4 text-forest-ink" /> Sensitivity Parameters
            </h3>
            <span className="text-[11px] text-slate font-mono">6 Interactive Knobs</span>
          </div>

          {/* Variable 1: Parcel Quantity (±15%) */}
          <div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-charcoal">1. Parcel Quantity Adjustment (±15%)</span>
              <span className="font-mono font-bold text-forest-ink tabular-nums">
                {quantityPct > 0 ? `+${quantityPct}%` : `${quantityPct}%`} (
                {Math.round(75000 * (1 + quantityPct / 100)).toLocaleString()} MT)
              </span>
            </div>
            <input
              type="range"
              min={-15}
              max={15}
              step={1}
              value={quantityPct}
              onChange={(e) => setQuantityPct(Number(e.target.value))}
              aria-label="Parcel quantity adjustment percentage"
              className="mt-2 w-full accent-forest-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-forest-ink"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate">
              <span>-15% (63,750 MT)</span>
              <span>Baseline: 75,000 MT</span>
              <span>+15% (86,250 MT)</span>
            </div>
          </div>

          {/* Variable 2: Delivery Window / Laycan Drift (±10 Days) */}
          <div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-charcoal">2. Laycan Window Drift (±10 Days)</span>
              <span className="font-mono font-bold text-forest-ink tabular-nums">
                {deliveryDays > 0 ? `+${deliveryDays} Days` : deliveryDays === 0 ? "On Target" : `${deliveryDays} Days`}
              </span>
            </div>
            <input
              type="range"
              min={-10}
              max={10}
              step={1}
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(Number(e.target.value))}
              aria-label="Laycan window drift in days"
              className="mt-2 w-full accent-forest-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-forest-ink"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate">
              <span>-10d (Urgent Lift)</span>
              <span>Scheduled Window</span>
              <span>+10d (Deferred)</span>
            </div>
          </div>

          {/* Variable 3: Vessel Class Override */}
          <div>
            <label htmlFor="vessel-class" className="text-xs font-semibold text-charcoal block">
              3. Vessel Class Architecture
            </label>
            <select
              id="vessel-class"
              value={vesselOverride}
              onChange={(e) => setVesselOverride(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-pebble bg-paper p-2.5 text-xs font-medium text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink"
            >
              <option value="Handysize">Handysize (25,000 - 39,000 DWT) — 10.2m Draft</option>
              <option value="Supramax">Supramax (40,000 - 59,000 DWT) — 12.8m Draft</option>
              <option value="Panamax">Panamax (60,000 - 99,000 DWT) — 14.45m Draft (Baseline)</option>
              <option value="Capesize">Capesize (100,000+ DWT) — 18.2m Draft (Deep Draft)</option>
            </select>
          </div>

          {/* Variable 4: Port Override */}
          <div>
            <label htmlFor="target-port" className="text-xs font-semibold text-charcoal block">
              4. Target Discharge Terminal
            </label>
            <select
              id="target-port"
              value={portOverride}
              onChange={(e) => setPortOverride(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-pebble bg-paper p-2.5 text-xs font-medium text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink"
            >
              <option value="Paradip">Paradip Port (Max Draft: 16.5m) — Primary SAIL Berth</option>
              <option value="Dhamra">Dhamra Port (Max Draft: 18.0m) — Capesize Capable</option>
              <option value="Gangavaram">Gangavaram Port (Max Draft: 19.5m) — Deep Multi-Purpose</option>
              <option value="Haldia">Haldia Dock Complex (Max Draft: 14.5m) — Restricted</option>
            </select>
          </div>

          {/* Variable 5: Bunker Fuel Price Volatility (±20%) */}
          <div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-charcoal">5. Bunker Price Volatility (VLSFO ±20%)</span>
              <span className="font-mono font-bold text-forest-ink tabular-nums">
                {bunkerShockPct > 0 ? `+${bunkerShockPct}%` : `${bunkerShockPct}%`}
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={20}
              step={1}
              value={bunkerShockPct}
              onChange={(e) => setBunkerShockPct(Number(e.target.value))}
              aria-label="Bunker price volatility percentage"
              className="mt-2 w-full accent-forest-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-forest-ink"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate">
              <span>-20% ($490/MT)</span>
              <span>$612.50/MT Baseline</span>
              <span>+20% ($735/MT)</span>
            </div>
          </div>

          {/* Variable 6: Indian Port Berth Congestion Delay */}
          <div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-charcoal">6. Port Congestion & Anchorage Wait</span>
              <span className="font-mono font-bold text-forest-ink tabular-nums">
                {congestionDays} Days (${(congestionDays * 18500).toLocaleString()} Demurrage)
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={14}
              step={1}
              value={congestionDays}
              onChange={(e) => setCongestionDays(Number(e.target.value))}
              aria-label="Port congestion waiting days"
              className="mt-2 w-full accent-forest-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-forest-ink"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate">
              <span>0d (Instant Berth)</span>
              <span>2d Typical</span>
              <span>14d Severe Queue</span>
            </div>
          </div>

          {/* Simulate Action Button */}
          <button
            type="button"
            disabled={isCalculating}
            onClick={runScenarioSimulation}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-forest-ink py-3 text-xs font-semibold text-paper shadow-sm hover:bg-forest-ink/90 focus-visible:outline-2 focus-visible:outline-forest-ink active:scale-95 disabled:opacity-50 transition-all"
          >
            {isCalculating ? (
              <RefreshCw className="size-4 animate-spin text-lime-voltage" />
            ) : (
              <Sparkles className="size-4 text-lime-voltage" />
            )}
            <span>Calculate What-If Scenario Matrix</span>
          </button>
        </div>

        {/* Output Column (Matrix & Variance Cards) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Active Feasibility & Outcome Card */}
          <div className="rounded-card border border-pebble bg-paper p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pebble pb-3">
              <div>
                <h3 className="font-bold text-base text-forest-ink">
                  Simulation Outcome & Physical Feasibility
                </h3>
                <p className="text-xs text-slate">Evaluated against East Coast bathymetric channels and laytime rules</p>
              </div>

              <div className="flex items-center gap-2">
                {scenarioExecuted && (
                  <span className="rounded-full bg-linen-mist px-2.5 py-0.5 font-mono text-[10px] font-bold text-spruce border border-lime-voltage/30">
                    SIMULATION UPDATED
                  </span>
                )}
                {/* High-Contrast Feasibility Badge */}
                {activeScenario.overall_feasible ? (
                  <Pill tone="positive">
                    <CheckCircle2 className="size-3.5" /> FEASIBLE — DRAFT PERMISSIBLE
                  </Pill>
                ) : (
                  <Pill tone="negative">
                    <AlertCircle className="size-3.5" /> VIOLATION — DRAFT EXCEEDED
                  </Pill>
                )}
              </div>
            </div>

            {/* Feasibility Alert Box */}
            {!activeScenario.overall_feasible && (
              <div className="flex items-start gap-2.5 rounded-card border border-alarm-red/30 bg-alarm-wash p-4 text-xs text-charcoal">
                <AlertCircle className="size-4 shrink-0 text-alarm-red mt-0.5" />
                <div>
                  <strong className="font-bold text-alarm-red">Navigational Safety Envelope Violation:</strong>
                  <p className="mt-1 leading-relaxed">{activeScenario.feasibility_note}</p>
                </div>
              </div>
            )}

            {/* Top Metric Callouts */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-card bg-fog p-3 border border-pebble/60">
                <span className="font-mono text-[10px] uppercase text-charcoal block">Predicted Ocean Freight</span>
                <div className="font-mono text-xl font-bold text-forest-ink tabular-nums">
                  ${activeScenario.predicted_freight.toFixed(2)}{" "}
                  <span className="text-xs font-sans font-normal text-slate">/ MT</span>
                </div>
                <span className="font-mono text-[10px] text-charcoal">
                  Δ {activeScenario.predicted_freight >= baseline.predicted_freight ? "+" : ""}
                  {(activeScenario.predicted_freight - baseline.predicted_freight).toFixed(2)}/MT
                </span>
              </div>

              <div className="rounded-card bg-fog p-3 border border-pebble/60">
                <span className="font-mono text-[10px] uppercase text-charcoal block">Total Landed Cost (₹/MT)</span>
                <div className="font-mono text-xl font-bold text-forest-ink tabular-nums">
                  ₹{activeScenario.landed_cost_inr_pmt.toLocaleString()}{" "}
                  <span className="text-xs font-sans font-normal text-slate">INR</span>
                </div>
                <span className="font-mono text-[10px] text-charcoal">
                  Newcastle FOB + Ocean + Berth
                </span>
              </div>

              <div className="rounded-card bg-emerald-wash p-3 border border-emerald-profit/30">
                <span className="font-mono text-[10px] uppercase text-emerald-profit font-semibold block">Total Estimated Savings</span>
                <div className="font-mono text-xl font-bold text-emerald-profit tabular-nums">
                  ${activeScenario.total_savings_usd.toLocaleString()}{" "}
                  <span className="text-xs font-sans font-normal text-emerald-profit">USD</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-profit">
                  vs $25.50/MT spot ceiling
                </span>
              </div>
            </div>
          </div>

          {/* SECTION: Tabular Matrix Cards */}
          <div className="rounded-card border border-pebble bg-paper shadow-sm overflow-hidden">
            <div className="border-b border-pebble bg-linen-mist/20 px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-forest-ink" />
                <h3 className="text-sm font-bold text-forest-ink">
                  Comparative Scenario Matrix (Sensitivity Grid)
                </h3>
              </div>
              <span className="font-mono text-xs text-slate">4 Scenarios Compared</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-pebble bg-fog font-sans font-semibold text-charcoal uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Scenario Archetype</th>
                    <th className="py-3 px-3">Vessel & Port</th>
                    <th className="py-3 px-3 text-right">Parcel (MT)</th>
                    <th className="py-3 px-3 text-right">Freight ($/MT)</th>
                    <th className="py-3 px-3 text-right">Demurrage ($)</th>
                    <th className="py-3 px-3 text-right">Runway (DOI)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pebble">
                  {matrixScenarios.map((sc, i) => {
                    const isCustom = i === 3;
                    return (
                      <tr
                        key={sc.name}
                        className={`transition-colors ${
                          isCustom
                            ? "bg-linen-mist/30 font-semibold"
                            : "hover:bg-fog"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-sans text-forest-ink font-bold">
                          {sc.name}
                        </td>
                        <td className="py-3.5 px-3 font-sans text-charcoal">
                          {sc.vessel_class} → {sc.port}
                        </td>
                        <td className="py-3.5 px-3 text-right tabular-nums">
                          {sc.quantity_mt.toLocaleString()} MT
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-forest-ink tabular-nums">
                          ${sc.predicted_freight.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-charcoal tabular-nums">
                          ${sc.demurrage_exposure_usd.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 text-right tabular-nums">
                          {sc.stockpile_runway_impact_days >= 0 ? `+${sc.stockpile_runway_impact_days}d` : `${sc.stockpile_runway_impact_days}d`}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {sc.overall_feasible ? (
                            <Pill tone="positive">PERMISSIBLE</Pill>
                          ) : (
                            <Pill tone="negative">RESTRICTED</Pill>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioViewPage;
