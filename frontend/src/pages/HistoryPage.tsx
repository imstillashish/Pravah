import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import {
  History,
  Filter,
  ArrowRight,
  RotateCcw,
  Calendar,
  Anchor,
} from "lucide-react";

interface AnalysisRecord {
  id: number;
  title: string;
  status: string;
  commodity: string;
  parcel_tonnage: number;
  origin_port: string;
  origin_country?: string;
  destination_port: string;
  predicted_rate_pmt: number;
  recommended_vessel: string;
  created_at: string;
}

export const HistoryPage: React.FC = () => {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters (Task 385)
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [cargoTypeFilter, setCargoTypeFilter] = useState<string>("");
  const [portFilter, setPortFilter] = useState<string>("");

  const fetchAnalyses = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<AnalysisRecord[]>("/analyses");
      setAnalyses(data || []);
      setFilteredAnalyses(data || []);
    } catch {
      // Demo fallback
      const fallback: AnalysisRecord[] = [
        {
          id: 1,
          title: "Golden Demo — Newcastle to Paradip 75k MT",
          status: "COMPLETED",
          commodity: "Coking Coal",
          parcel_tonnage: 75000,
          origin_port: "Newcastle",
          origin_country: "Australia",
          destination_port: "Paradip Port",
          predicted_rate_pmt: 14.28,
          recommended_vessel: "Panamax",
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 2,
          title: "Gladstone to Dhamra 80k MT Coking Coal",
          status: "COMPLETED",
          commodity: "Coking Coal",
          parcel_tonnage: 80000,
          origin_port: "Gladstone",
          origin_country: "Australia",
          destination_port: "Dhamra Port",
          predicted_rate_pmt: 13.90,
          recommended_vessel: "Panamax",
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: 3,
          title: "Hay Point to Gangavaram 120k MT Capesize Study",
          status: "COMPLETED",
          commodity: "Coking Coal",
          parcel_tonnage: 120000,
          origin_port: "Hay Point",
          origin_country: "Australia",
          destination_port: "Gangavaram Port",
          predicted_rate_pmt: 10.45,
          recommended_vessel: "Capesize",
          created_at: new Date(Date.now() - 259200000).toISOString(),
        },
      ];
      setAnalyses(fallback);
      setFilteredAnalyses(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  // Task 385: Filter logic
  useEffect(() => {
    let result = [...analyses];

    if (cargoTypeFilter.trim()) {
      result = result.filter((a) =>
        a.commodity.toLowerCase().includes(cargoTypeFilter.toLowerCase())
      );
    }

    if (portFilter.trim()) {
      result = result.filter(
        (a) =>
          a.destination_port.toLowerCase().includes(portFilter.toLowerCase()) ||
          a.origin_port.toLowerCase().includes(portFilter.toLowerCase())
      );
    }

    if (dateFrom) {
      result = result.filter((a) => new Date(a.created_at) >= new Date(dateFrom));
    }

    if (dateTo) {
      result = result.filter((a) => new Date(a.created_at) <= new Date(dateTo + "T23:59:59"));
    }

    setFilteredAnalyses(result);
  }, [analyses, cargoTypeFilter, portFilter, dateFrom, dateTo]);

  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCargoTypeFilter("");
    setPortFilter("");
    setFilteredAnalyses(analyses);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pebble pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
              PAGE 9: MY ANALYSES & HISTORY
            </span>
            <span className="font-mono text-xs text-slate">
              AUDIT LOG ARCHIVE
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-charcoal sm:text-3xl">
            Historical Freight & Charter Analyses
          </h1>
          <p className="mt-0.5 text-xs text-slate">
            Search, filter, and review historical procurement decisions, landed cost records, and vessel evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAnalyses}
            aria-label="Refresh analyses"
            className="flex items-center gap-1.5 rounded-xl border border-pebble bg-paper px-3 py-2 text-xs font-medium text-charcoal shadow-sm hover:bg-linen-mist/50"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Task 385: Filter Controls Above Table */}
      <div className="rounded-xl border border-pebble bg-paper p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-charcoal">
            <Filter className="size-4 text-forest-ink" />
            <span>Search & Filter Historical Analyses</span>
          </div>
          {(dateFrom || dateTo || cargoTypeFilter || portFilter) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-forest-ink hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-pebble bg-paper p-2 text-xs text-charcoal focus:border-forest-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-pebble bg-paper p-2 text-xs text-charcoal focus:border-forest-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate mb-1">
              Cargo Type
            </label>
            <input
              type="text"
              placeholder="e.g. Coking Coal"
              value={cargoTypeFilter}
              onChange={(e) => setCargoTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-pebble bg-paper p-2 text-xs text-charcoal focus:border-forest-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate mb-1">
              Port
            </label>
            <input
              type="text"
              placeholder="e.g. Paradip or Newcastle"
              value={portFilter}
              onChange={(e) => setPortFilter(e.target.value)}
              className="w-full rounded-lg border border-pebble bg-paper p-2 text-xs text-charcoal focus:border-forest-ink focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Task 384: Table of Analyses */}
      <div className="overflow-hidden rounded-xl border border-pebble bg-paper shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-pebble bg-linen-mist/40 font-mono text-[10px] uppercase tracking-wider text-slate">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Cargo Type</th>
                <th className="px-5 py-3">Origin → Destination</th>
                <th className="px-5 py-3 text-right">Quantity (MT)</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pebble">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate font-mono">
                    Loading historical analyses…
                  </td>
                </tr>
              ) : filteredAnalyses.length === 0 ? (
                /* Task 385 empty state */
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate">
                    <History className="mx-auto size-8 text-slate/40" />
                    <p className="mt-2 text-xs font-semibold text-charcoal">
                      No analyses match your filters
                    </p>
                    <p className="text-[11px] text-slate mt-0.5">
                      Try clearing or broadening your search parameters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAnalyses.map((a) => (
                  <tr key={a.id} className="hover:bg-linen-mist/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-slate" />
                        <span>{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-charcoal">
                      {a.commodity}
                    </td>

                    <td className="px-5 py-3.5 text-charcoal">
                      <div className="flex items-center gap-1.5">
                        <Anchor className="size-3 text-slate" />
                        <span>{a.origin_port}</span>
                        <span className="text-slate">→</span>
                        <span>{a.destination_port}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate">
                        Vessel: {a.recommended_vessel} (${a.predicted_rate_pmt?.toFixed(2)}/MT)
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono font-bold text-charcoal">
                      {a.parcel_tonnage?.toLocaleString()} MT
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                        {a.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {/* Task 384: Open Link to /analyses/{id} or #analysis-{id} */}
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = `#analysis-${a.id}`;
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-forest-ink/10 px-3 py-1.5 text-xs font-semibold text-forest-ink hover:bg-forest-ink hover:text-paper transition-all"
                      >
                        <span>Open</span>
                        <ArrowRight className="size-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
