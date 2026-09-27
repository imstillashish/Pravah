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
} from "lucide-react";

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

export const DemandBoardPage: React.FC = () => {
  const [requests, setRequests] = useState<DemandItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isMerging, setIsMerging] = useState<boolean>(false);

  // Inline form state (Task 393)
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newPlantId, setNewPlantId] = useState<number>(1); // Bhilai
  const [newCargoTypeId, setNewCargoTypeId] = useState<number>(1); // Coking Coal
  const [newQuantity, setNewQuantity] = useState<number>(35000);
  const [newPortId, setNewPortId] = useState<number>(1); // Paradip
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
          cargo_type: "Coking Coal (Low-Vol)",
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
          cargo_type: "Coking Coal (Low-Vol)",
          quantity_mt: 35000,
          destination_port_id: 1,
          destination_port: "Paradip Port",
          status: "OPEN",
          created_at: new Date().toISOString(),
          requested_by: "SAIL Rourkela Logistics",
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

  // Task 392: Merge Selected Requests
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
        text: res.message || "Requests merged into one combined request",
        type: "success",
      });
      fetchDemand();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error merging requests";
      if (errMsg.includes("different ports") || errMsg.includes("Cannot merge")) {
        setToastMessage({
          text: "Cannot merge: requests go to different ports",
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

  // Task 393: Post New Request
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
        text: "New cargo demand posted successfully",
        type: "success",
      });
      setShowCreateForm(false);
      fetchDemand();
    } catch (err: unknown) {
      setToastMessage({
        text: err instanceof Error ? err.message : "Failed to post demand",
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
    { id: 1, name: "Paradip Port (Max Draft: 17.1m)" },
    { id: 2, name: "Dhamra Port (Max Draft: 18.0m)" },
    { id: 3, name: "Gangavaram Port (Max Draft: 18.5m)" },
    { id: 4, name: "Haldia Port (Max Draft: 8.5m - Restricted)" },
  ];

  const cargoTypes = [
    { id: 1, name: "Coking Coal (Prime / Hard Coking)" },
    { id: 2, name: "Thermal / Steam Coal" },
    { id: 3, name: "PCI Coal (Pulverized Injection)" },
    { id: 4, name: "Limestone / Flux" },
  ];

  const totalDemandMT = requests.reduce((acc, r) => acc + (r.quantity_mt || 0), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between rounded-card p-4 text-xs font-semibold shadow-md transition-all ${
            toastMessage.type === "success"
              ? "bg-forest-ink text-paper"
              : "border border-alarm-red/40 bg-fog text-alarm-red"
          }`}
        >
          <div className="flex items-center gap-2">
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
            className="text-xs opacity-75 hover:opacity-100"
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
              SAIL CARGO POOLING HUB
            </span>
          </div>
          <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight text-obsidian sm:text-3xl">
            SAIL Plant Demand Board & Cargo Pooling
          </h1>
          <p className="mt-0.5 text-xs text-slate">
            Aggregate procurement demand across steel plants to consolidate smaller parcels into Cape/Panamax fixtures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Task 393: Post New Request Button */}
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 rounded-full bg-lime-voltage px-3.5 py-2 text-xs font-medium text-forest-ink hover:brightness-95 active:scale-95 transition-all"
          >
            {showCreateForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
            <span>{showCreateForm ? "Close Form" : "Post New Request"}</span>
          </button>

          <button
            type="button"
            onClick={fetchDemand}
            aria-label="Refresh demand board"
            className="flex items-center gap-1.5 rounded-full border border-forest-ink bg-paper px-3 py-2 text-xs font-medium text-forest-ink hover:bg-fog transition-colors"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Overview Banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-pebble bg-paper p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate">Open Plant Requests</span>
          <div className="mt-1 font-mono text-2xl font-bold text-obsidian">{requests.length}</div>
          <p className="mt-0.5 text-[11px] text-slate">Awaiting consolidation or chartering</p>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate">Aggregated Tonnage</span>
          <div className="mt-1 font-mono text-2xl font-bold text-obsidian">
            {totalDemandMT.toLocaleString()} <span className="text-sm font-sans font-normal text-slate">MT</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate">Total open coking & thermal demand</p>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate">Capesize Consolidation Potential</span>
          <div className="mt-1 flex items-center gap-2 font-mono text-2xl font-bold text-forest-ink">
            <Sparkles className="size-5 text-forest-ink" />
            <span>{totalDemandMT >= 70000 ? "Ready for Capesize" : "Panamax Ideal"}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate">
            Save up to $4.20/MT by combining 2 parcels into a 75k MT vessel
          </p>
        </div>
      </div>

      {/* Task 393: Inline Form (Not a separate page) */}
      {showCreateForm && (
        <div className="rounded-card border border-forest-ink/30 bg-linen-mist/20 p-5 transition-all">
          <div className="flex items-center justify-between border-b border-pebble pb-3">
            <div className="flex items-center gap-2">
              <Plus className="size-4 text-forest-ink" />
              <h3 className="font-sans text-sm font-bold text-obsidian">
                Post New Plant Cargo Demand
              </h3>
            </div>
            <span className="font-mono text-[11px] text-slate">Lead Logistics Desk</span>
          </div>

          <form onSubmit={handleCreateRequest} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-[11px] font-semibold text-charcoal">SAIL Plant</label>
              <select
                value={newPlantId}
                onChange={(e) => setNewPlantId(Number(e.target.value))}
                className="mt-1 w-full rounded-card border border-pebble bg-paper p-2 text-xs text-charcoal focus:border-forest-ink focus:outline-none"
              >
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-charcoal">Cargo Specification</label>
              <select
                value={newCargoTypeId}
                onChange={(e) => setNewCargoTypeId(Number(e.target.value))}
                className="mt-1 w-full rounded-card border border-pebble bg-paper p-2 text-xs text-charcoal focus:border-forest-ink focus:outline-none"
              >
                {cargoTypes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-charcoal">Quantity (Metric Tonnes)</label>
              <input
                type="number"
                min="1000"
                step="500"
                required
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
                className="mt-1 w-full rounded-card border border-pebble bg-paper p-2 text-xs text-charcoal focus:border-forest-ink focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-charcoal">Discharge Port</label>
              <select
                value={newPortId}
                onChange={(e) => setNewPortId(Number(e.target.value))}
                className="mt-1 w-full rounded-card border border-pebble bg-paper p-2 text-xs text-charcoal focus:border-forest-ink focus:outline-none"
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
                className="rounded-full border border-pebble bg-paper px-4 py-2 text-xs font-medium text-charcoal hover:bg-fog"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-full bg-forest-ink px-5 py-2 text-xs font-medium text-paper hover:bg-forest-ink/90 disabled:opacity-50"
              >
                <Plus className="size-3.5" /> Submit Demand to Board
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task 392: Merge Action Toolbar */}
      <div data-tour="demand-consolidation" className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-pebble bg-paper p-4">
        <div className="flex items-center gap-3">
          <GitMerge className="size-5 text-forest-ink" />
          <div>
            <div className="text-xs font-bold text-obsidian">
              Consolidated Cargo Pooling ({selectedIds.length} of 2 selected)
            </div>
            <div className="text-[11px] text-slate">
              Select exactly 2 requests destined for the same port to combine into a single charter parcel.
            </div>
          </div>
        </div>

        {/* Task 392: Enabled only when exactly 2 rows are checked */}
        <button
          type="button"
          disabled={selectedIds.length !== 2 || isMerging}
          onClick={handleMerge}
          className="flex items-center gap-2 rounded-full bg-lime-voltage px-4 py-2 text-xs font-medium text-forest-ink hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
        >
          <GitMerge className="size-3.5" />
          <span>Merge Selected Requests</span>
        </button>
      </div>

      {/* Task 391: Table of Open Requests */}
      <div className="overflow-hidden rounded-card border border-pebble bg-paper">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-pebble bg-linen-mist/40 font-mono text-[10px] uppercase tracking-wider text-slate">
              <tr>
                <th className="w-12 px-4 py-3 text-center">Select</th>
                <th className="px-4 py-3">Plant</th>
                <th className="px-4 py-3">Cargo Type</th>
                <th className="px-4 py-3 text-right">Quantity (MT)</th>
                <th className="px-4 py-3">Destination Port</th>
                <th className="px-4 py-3">Posted By</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pebble">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate font-mono">
                    Loading open demand board requests…
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate">
                    No open cargo requests. Post a new request using the button above.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const isChecked = selectedIds.includes(r.id);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => handleToggleSelect(r.id)}
                      className={`cursor-pointer transition-colors hover:bg-linen-mist/30 ${
                        isChecked ? "bg-forest-ink/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(r.id)}
                          aria-label={`Select request ${r.id}`}
                          className="size-4 rounded border-pebble text-forest-ink focus:ring-forest-ink"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 font-semibold text-charcoal">
                          <Building2 className="size-4 text-slate" />
                          <span>{r.plant_name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate">ID #{r.id}</span>
                      </td>
                      <td className="px-4 py-3.5 text-charcoal">
                        <div className="flex items-center gap-1.5">
                          <Flame className="size-3.5 text-amber-600" />
                          <span>{r.cargo_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-charcoal text-sm">
                        {r.quantity_mt.toLocaleString()} MT
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-charcoal">
                          <Anchor className="size-3.5 text-slate" />
                          <span>{r.destination_port}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate">
                        {r.requested_by || "SAIL Procurement Desk"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 className="size-3" /> OPEN
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DemandBoardPage;
