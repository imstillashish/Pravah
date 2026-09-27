import React, { useState } from "react";
import {
  Sliders,
  RefreshCw,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface ScenarioMetrics {
  quantity_mt: number;
  delivery_days_offset: number;
  vessel_class: string;
  port: string;
  bunker_price_offset: number;
  predicted_freight: number;
  total_savings_usd: number;
  landed_cost_inr_pmt: number;
  overall_feasible: boolean;
  feasibility_note?: string;
}

export const ScenarioViewPage: React.FC = () => {
  // Baseline values (Analysis #1 Golden Demo)
  const baseline: ScenarioMetrics = {
    quantity_mt: 75000,
    delivery_days_offset: 0,
    vessel_class: "Panamax",
    port: "Paradip",
    bunker_price_offset: 0,
    predicted_freight: 22.30,
    total_savings_usd: 176250,
    landed_cost_inr_pmt: 1962.25,
    overall_feasible: true,
  };

  // 5 interactive sliders / input parameters
  const [quantityPct, setQuantityPct] = useState<number>(0); // -10% to +10%
  const [deliveryDays, setDeliveryDays] = useState<number>(0); // -7 to +7 days
  const [vesselOverride, setVesselOverride] = useState<string>("Panamax");
  const [portOverride, setPortOverride] = useState<string>("Paradip");
  const [bunkerShockPct, setBunkerShockPct] = useState<number>(0); // -15% to +15%

  const [activeScenario, setActiveScenario] = useState<ScenarioMetrics>(baseline);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [scenarioExecuted, setScenarioExecuted] = useState<boolean>(false);

  // Recalculate scenario heuristics dynamically
  const runScenarioSimulation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const simulatedQty = Math.round(75000 * (1 + quantityPct / 100));

      // Vessel base rate modifiers
      let baseFreight = 22.30;
      let isFeasible = true;
      let note = "";

      if (vesselOverride === "Capesize") {
        baseFreight = 18.50; // Cheaper PMT economies of scale
        if (portOverride === "Paradip" || portOverride === "Haldia") {
          isFeasible = false;
          note = `Draft exceeds ${portOverride} max draft envelope (Offshore lightering required)`;
        }
      } else if (vesselOverride === "Supramax") {
        baseFreight = 25.80;
      } else if (vesselOverride === "Handysize") {
        baseFreight = 29.50;
      }

      // Quantity sensitivity impact
      if (quantityPct > 5) baseFreight -= 0.40;
      if (quantityPct < -5) baseFreight += 0.60;

      // Laycan delay cost impact
      if (deliveryDays > 3) baseFreight += 0.75;
      if (deliveryDays < -3) baseFreight -= 0.30;

      // Bunker shock impact
      const bunkerImpact = (bunkerShockPct / 100) * 2.80;
      const finalFreight = Math.max(12.0, Math.round((baseFreight + bunkerImpact) * 100) / 100);

      const benchmarkRate = 25.50;
      const totalSavings = Math.round((benchmarkRate - finalFreight) * simulatedQty);
      const landedInr = Math.round((finalFreight + 1.20) * 83.5 * 100) / 100;

      setActiveScenario({
        quantity_mt: simulatedQty,
        delivery_days_offset: deliveryDays,
        vessel_class: vesselOverride,
        port: portOverride,
        bunker_price_offset: bunkerShockPct,
        predicted_freight: finalFreight,
        total_savings_usd: totalSavings,
        landed_cost_inr_pmt: landedInr,
        overall_feasible: isFeasible,
        feasibility_note: note,
      });

      setIsCalculating(false);
      setScenarioExecuted(true);
    }, 300);
  };

  const resetToBaseline = () => {
    setQuantityPct(0);
    setDeliveryDays(0);
    setVesselOverride("Panamax");
    setPortOverride("Paradip");
    setBunkerShockPct(0);
    setActiveScenario(baseline);
    setScenarioExecuted(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pebble pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
              SCENARIO STUDIO
            </span>
            <span className="rounded-full bg-fog px-2.5 py-0.5 text-xs font-medium text-slate">
              What-If Sensitivity Simulation
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-charcoal sm:text-3xl">
            Procurement Scenario & Sensitivity Analysis
          </h1>
          <p className="mt-0.5 text-xs text-slate">
            Simulate parcel adjustments, laycan drift, vessel size pivots, and bunker fuel volatility in real time.
          </p>
        </div>

        <button
          type="button"
          onClick={resetToBaseline}
          className="flex items-center gap-1.5 rounded-full border border-forest-ink bg-paper px-3.5 py-2 text-xs font-medium text-forest-ink hover:bg-fog"
        >
          <RotateCcw className="size-3.5" /> Reset to Baseline
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Controls Column (5 Variable Sliders / Selectors) */}
        <div data-tour="scenario-sandbox" className="rounded-none border border-pebble bg-paper p-6 space-y-5 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-pebble pb-3">
            <h3 className="font-bold text-sm text-obsidian flex items-center gap-2">
              <Sliders className="size-4 text-forest-ink" /> Simulation Variables
            </h3>
            <span className="text-[11px] text-slate font-mono">5 Parameters</span>
          </div>

          {/* Variable 1: Parcel Quantity (±10%) */}
          <div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-charcoal">1. Parcel Quantity (±10%)</span>
              <span className="font-mono font-bold text-forest-ink">
                {quantityPct > 0 ? `+${quantityPct}%` : `${quantityPct}%`} (
                {Math.round(75000 * (1 + quantityPct / 100)).toLocaleString()} MT)
              </span>
            </div>
            <input
              type="range"
              min={-10}
              max={10}
              step={1}
              value={quantityPct}
              onChange={(e) => setQuantityPct(Number(e.target.value))}
              className="mt-2 w-full accent-forest-ink cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate">
              <span>-10% (67.5k MT)</span>
              <span>Baseline: 75,000 MT</span>
              <span>+10% (82.5k MT)</span>
            </div>
          </div>

          {/* Variable 2: Laycan / Delivery Window Drift (±7 Days) */}
          <div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-charcoal">2. Delivery Window Drift (±7 Days)</span>
              <span className="font-mono font-bold text-forest-ink">
                {deliveryDays > 0 ? `+${deliveryDays} Days` : deliveryDays === 0 ? "On Schedule" : `${deliveryDays} Days`}
              </span>
            </div>
            <input
              type="range"
              min={-7}
              max={7}
              step={1}
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(Number(e.target.value))}
              className="mt-2 w-full accent-forest-ink cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate">
              <span>-7 Days (Urgent)</span>
              <span>Baseline Window</span>
              <span>+7 Days (Deferred)</span>
            </div>
          </div>

          {/* Variable 3: Vessel Class Override */}
          <div>
            <label className="text-xs font-semibold text-charcoal">
              3. Vessel Class Override
            </label>
            <select
              value={vesselOverride}
              onChange={(e) => setVesselOverride(e.target.value)}
              className="mt-1.5 w-full rounded-none border border-pebble bg-paper p-2.5 text-xs font-medium text-charcoal focus:border-forest-ink focus:outline-none"
            >
              <option value="Handysize">Handysize (25k - 39k DWT)</option>
              <option value="Supramax">Supramax (40k - 59k DWT)</option>
              <option value="Panamax">Panamax (60k - 99k DWT) — Baseline</option>
              <option value="Capesize">Capesize (100k+ DWT) — High economies of scale</option>
            </select>
          </div>

          {/* Variable 4: Port Override */}
          <div>
            <label className="text-xs font-semibold text-charcoal">
              4. Target Discharge Port Override
            </label>
            <select
              value={portOverride}
              onChange={(e) => setPortOverride(e.target.value)}
              className="mt-1.5 w-full rounded-none border border-pebble bg-paper p-2.5 text-xs font-medium text-charcoal focus:border-forest-ink focus:outline-none"
            >
              <option value="Paradip">Paradip Port (16.5m draft) — Baseline</option>
              <option value="Dhamra">Dhamra Port (18.0m draft)</option>
              <option value="Gangavaram">Gangavaram Port (19.5m draft)</option>
              <option value="Haldia">Haldia Dock Complex (14.5m draft)</option>
            </select>
          </div>

          {/* Variable 5: Bunker Fuel Price Volatility (±15%) */}
          <div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-charcoal">5. Bunker Price Shock (VLSFO)</span>
              <span className="font-mono font-bold text-forest-ink">
                {bunkerShockPct > 0 ? `+${bunkerShockPct}%` : `${bunkerShockPct}%`}
              </span>
            </div>
            <input
              type="range"
              min={-15}
              max={15}
              step={1}
              value={bunkerShockPct}
              onChange={(e) => setBunkerShockPct(Number(e.target.value))}
              className="mt-2 w-full accent-forest-ink cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate">
              <span>-15% ($520/MT)</span>
              <span>$612.50/MT</span>
              <span>+15% ($705/MT)</span>
            </div>
          </div>

          {/* Run Button */}
          <button
            type="button"
            disabled={isCalculating}
            onClick={runScenarioSimulation}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-lime-voltage py-3 text-sm font-bold text-forest-ink transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
          >
            {isCalculating ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Simulate What-If Scenario
          </button>
        </div>

        {/* Comparison Output Column */}
        <div className="space-y-6 lg:col-span-7">
          {/* Side-by-side comparison card */}
          <div className="rounded-none border border-pebble bg-paper p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-pebble pb-3">
              <h3 className="font-bold text-base text-charcoal">
                Side-by-Side Scenario Variance Analysis
              </h3>
              {scenarioExecuted && (
                <span className="rounded-full bg-linen-mist px-2.5 py-0.5 text-xs font-semibold text-forest-ink">
                  Simulation Calculated
                </span>
              )}
            </div>

            {/* Feasibility Alert if restricted */}
            {!activeScenario.overall_feasible && (
              <div className="flex items-start gap-2.5 rounded-none border border-alarm-red/30 bg-alarm-red/10 p-3 text-xs text-alarm-red">
                <AlertCircle className="size-4 shrink-0 text-alarm-red mt-0.5" />
                <div>
                  <strong className="font-bold">Physical Port Constraint Violation:</strong>
                  <p className="mt-0.5">{activeScenario.feasibility_note}</p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-pebble bg-linen-mist/40 font-sans font-semibold text-charcoal uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Metric Dimension</th>
                    <th className="py-2.5 px-3 text-right">Baseline (Golden Demo)</th>
                    <th className="py-2.5 px-3 text-right">Active Scenario</th>
                    <th className="py-2.5 px-3 text-right">Variance (Δ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pebble">
                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-charcoal">Vessel Class</td>
                    <td className="py-3 px-3 text-right font-sans font-semibold">{baseline.vessel_class}</td>
                    <td className="py-3 px-3 text-right font-sans font-bold text-forest-ink">{activeScenario.vessel_class}</td>
                    <td className="py-3 px-3 text-right text-slate font-sans">
                      {activeScenario.vessel_class === baseline.vessel_class ? "Matched" : "Pivoted"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-charcoal">Discharge Port</td>
                    <td className="py-3 px-3 text-right font-sans">{baseline.port}</td>
                    <td className="py-3 px-3 text-right font-sans font-bold text-charcoal">{activeScenario.port}</td>
                    <td className="py-3 px-3 text-right text-slate font-sans">
                      {activeScenario.port === baseline.port ? "Identical" : "Rerouted"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-charcoal">Cargo Lot (MT)</td>
                    <td className="py-3 px-3 text-right">{baseline.quantity_mt.toLocaleString()} MT</td>
                    <td className="py-3 px-3 text-right font-bold">{activeScenario.quantity_mt.toLocaleString()} MT</td>
                    <td className="py-3 px-3 text-right font-bold text-charcoal">
                      {(activeScenario.quantity_mt - baseline.quantity_mt).toLocaleString()} MT
                    </td>
                  </tr>
                  <tr className="bg-linen-mist/20">
                    <td className="py-3 px-3 font-sans font-semibold text-charcoal">Predicted Freight</td>
                    <td className="py-3 px-3 text-right font-bold">${baseline.predicted_freight.toFixed(2)}/MT</td>
                    <td className="py-3 px-3 text-right font-bold text-forest-ink">${activeScenario.predicted_freight.toFixed(2)}/MT</td>
                    <td className="py-3 px-3 text-right font-bold text-forest-ink">
                      {(activeScenario.predicted_freight - baseline.predicted_freight).toFixed(2) >= "0"
                        ? `+$${(activeScenario.predicted_freight - baseline.predicted_freight).toFixed(2)}`
                        : `-$${Math.abs(activeScenario.predicted_freight - baseline.predicted_freight).toFixed(2)}`}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-charcoal">Total Landed Cost (₹/MT)</td>
                    <td className="py-3 px-3 text-right">₹{baseline.landed_cost_inr_pmt.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-bold">₹{activeScenario.landed_cost_inr_pmt.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right">
                      {(activeScenario.landed_cost_inr_pmt - baseline.landed_cost_inr_pmt) >= 0
                        ? `+₹${(activeScenario.landed_cost_inr_pmt - baseline.landed_cost_inr_pmt).toFixed(2)}`
                        : `-₹${Math.abs(activeScenario.landed_cost_inr_pmt - baseline.landed_cost_inr_pmt).toFixed(2)}`}
                    </td>
                  </tr>
                  <tr className="bg-linen-mist/30">
                    <td className="py-3 px-3 font-sans font-bold text-forest-ink">Total Savings (USD)</td>
                    <td className="py-3 px-3 text-right font-bold text-forest-ink">${baseline.total_savings_usd.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-forest-ink text-sm">
                      ${activeScenario.total_savings_usd.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-forest-ink">
                      {(activeScenario.total_savings_usd - baseline.total_savings_usd) >= 0
                        ? `+$${(activeScenario.total_savings_usd - baseline.total_savings_usd).toLocaleString()}`
                        : `-$${Math.abs(activeScenario.total_savings_usd - baseline.total_savings_usd).toLocaleString()}`}
                    </td>
                  </tr>
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
