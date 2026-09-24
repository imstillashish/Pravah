import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "../api/client";
import {
  AlertTriangle,
  RotateCcw,
  Send,
  Building,
  Ship,
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  X,
  CheckCircle2,
  HelpCircle,
  Award,
  ArrowUpDown,
  LayoutGrid,
  List,
  Sparkles,
} from "lucide-react";
import { Pill, LoadingSkeleton, EmptyState } from "../components/ui";

interface VendorQuote {
  id: number;
  quote_request_label?: string;
  broker_name: string;
  broker_desk?: string;
  vessel_type: string;
  vessel_name?: string;
  quoted_rate_usd_per_mt: number;
  delivery_days: number;
  valid_until: string;
  is_sample_data: boolean;
  sample_data_notice?: string;
  broker_rating?: number;
  parcel_mt?: number;
}

type SortField = "rate_asc" | "rate_desc" | "delivery_asc" | "variance_asc" | "broker_name";

export const VendorQuotesPage: React.FC = () => {
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("rate_asc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // System P50 reference benchmark (Newcastle->Paradip 75k MT)
  const systemP50Rate = 14.28;
  const parcelTonnage = 75000;

  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<VendorQuote[]>("/quotes");
      setQuotes(data || []);
    } catch {
      // Demo fallback quotes with rich broker indications
      setQuotes([
        {
          id: 1,
          quote_request_label: "RFQ-2026-001",
          broker_name: "Clarksons Platou (Asia)",
          broker_desk: "Singapore Dry Bulk Desk",
          vessel_type: "Panamax",
          vessel_name: "MV PACIFIC HORIZON",
          quoted_rate_usd_per_mt: 14.65,
          delivery_days: 18,
          valid_until: "2026-10-15",
          is_sample_data: true,
          broker_rating: 4.9,
          parcel_mt: 75000,
        },
        {
          id: 2,
          quote_request_label: "RFQ-2026-002",
          broker_name: "Braemar ACM Shipbroking",
          broker_desk: "London Baltic Exchange",
          vessel_type: "Panamax",
          vessel_name: "MV OCEAN INTEGRITY",
          quoted_rate_usd_per_mt: 14.10,
          delivery_days: 17,
          valid_until: "2026-10-12",
          is_sample_data: true,
          broker_rating: 4.8,
          parcel_mt: 75000,
        },
        {
          id: 3,
          quote_request_label: "RFQ-2026-003",
          broker_name: "Simpson Spence Young (SSY)",
          broker_desk: "Singapore Coal Chartering",
          vessel_type: "Capesize (Part-Discharge)",
          vessel_name: "MV CAPE ENDEAVOUR",
          quoted_rate_usd_per_mt: 11.85,
          delivery_days: 20,
          valid_until: "2026-10-18",
          is_sample_data: true,
          broker_rating: 4.95,
          parcel_mt: 75000,
        },
        {
          id: 4,
          quote_request_label: "RFQ-2026-004",
          broker_name: "Banchero Costa & C",
          broker_desk: "Genoa / Tokyo Operations",
          vessel_type: "Supramax",
          vessel_name: "MV LIGURIAN LEADER",
          quoted_rate_usd_per_mt: 16.40,
          delivery_days: 19,
          valid_until: "2026-10-10",
          is_sample_data: true,
          broker_rating: 4.7,
          parcel_mt: 75000,
        },
        {
          id: 5,
          quote_request_label: "RFQ-2026-005",
          broker_name: "Oldendorff Carriers (Direct)",
          broker_desk: "Lübeck / Mumbai Desk",
          vessel_type: "Post-Panamax",
          vessel_name: "MV EMERALD SENTINEL",
          quoted_rate_usd_per_mt: 13.90,
          delivery_days: 16,
          valid_until: "2026-10-14",
          is_sample_data: true,
          broker_rating: 4.85,
          parcel_mt: 75000,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleConfirmSendQuotes = () => {
    setShowModal(false);
    setToastMessage("Simulated quote RFQ logged for reference across Baltic Exchange brokers.");
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Sorted and ranked quotes
  const sortedQuotes = useMemo(() => {
    const list = [...quotes];
    return list.sort((a, b) => {
      if (sortBy === "rate_asc") return a.quoted_rate_usd_per_mt - b.quoted_rate_usd_per_mt;
      if (sortBy === "rate_desc") return b.quoted_rate_usd_per_mt - a.quoted_rate_usd_per_mt;
      if (sortBy === "delivery_asc") return a.delivery_days - b.delivery_days;
      if (sortBy === "variance_asc") {
        const varA = a.quoted_rate_usd_per_mt - systemP50Rate;
        const varB = b.quoted_rate_usd_per_mt - systemP50Rate;
        return varA - varB;
      }
      if (sortBy === "broker_name") return a.broker_name.localeCompare(b.broker_name);
      return 0;
    });
  }, [quotes, sortBy, systemP50Rate]);

  // Rank determination based on lowest rate
  const lowestRateQuote = useMemo(() => {
    if (quotes.length === 0) return null;
    return quotes.reduce((min, q) => (q.quoted_rate_usd_per_mt < min.quoted_rate_usd_per_mt ? q : min), quotes[0]);
  }, [quotes]);

  const bestRate = lowestRateQuote?.quoted_rate_usd_per_mt || 11.85;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Task 396: Persistent Non-Dismissible Amber Sample Data Banner */}
      <div className="flex items-start gap-3 rounded-card border border-amber-warning/40 bg-amber-wash p-4 text-amber-warning shadow-sm">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-warning" />
        <div className="text-xs leading-relaxed text-charcoal">
          <strong className="font-bold uppercase tracking-wider text-amber-warning">
            Sample Data Notice:{" "}
          </strong>
          Sample data only. These broker indications are modeled to demonstrate market spread valuation against Astitva's ML P50 freight baseline. No live broker trading API is connected.
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-card bg-forest-ink p-3.5 text-xs font-semibold text-paper border border-lime-voltage/30 shadow-md"
        >
          <CheckCircle2 className="size-4 text-lime-voltage" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pebble pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
              PAGE 12: VENDOR QUOTES
            </span>
            <span className="font-mono text-xs text-slate">
              BALTIC BENCHMARK DESK • NEWCASTLE → PARADIP 75K MT
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-forest-ink sm:text-3xl">
            Baltic Shipbroker Quotations & Market Valuation
          </h1>
          <p className="mt-0.5 text-xs text-slate">
            Evaluate received broker indications with automated P50 delta scoring, ranking badges, and laycan viability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-forest-ink px-4 py-2 text-xs font-semibold text-paper shadow-sm hover:bg-forest-ink/90 focus-visible:outline-2 focus-visible:outline-forest-ink active:scale-95 transition-all"
          >
            <Send className="size-3.5 text-lime-voltage" />
            <span>Send for Quotes (RFQ)</span>
          </button>

          <button
            type="button"
            onClick={fetchQuotes}
            aria-label="Refresh quotes"
            className="inline-flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3.5 py-2 text-xs font-medium text-charcoal hover:bg-fog focus-visible:outline-2 focus-visible:outline-forest-ink transition-colors"
          >
            <RotateCcw className="size-3.5 text-slate" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-pebble bg-paper p-4 shadow-sm">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate">
            System P50 Model Forecast
          </span>
          <div className="mt-1 font-mono text-2xl font-bold text-forest-ink tabular-nums">
            ${systemP50Rate.toFixed(2)}{" "}
            <span className="text-xs font-sans font-normal text-slate">/ MT</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate">
            Median rate predicted for Newcastle → Paradip Panamax
          </p>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4 shadow-sm">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate">
            Received Broker Indications
          </span>
          <div className="mt-1 font-mono text-2xl font-bold text-charcoal tabular-nums">
            {quotes.length}{" "}
            <span className="text-xs font-sans font-normal text-slate">bids active</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate">
            Leading London, Singapore & Tokyo dry bulk desks
          </p>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4 shadow-sm">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate">
            Best Market Offer
          </span>
          <div className="mt-1 flex items-center gap-2 font-mono text-2xl font-bold text-emerald-profit tabular-nums">
            <TrendingDown className="size-5 text-emerald-profit" />
            <span>
              ${bestRate.toFixed(2)}{" "}
              <span className="text-xs font-sans font-normal text-slate">/ MT</span>
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate">
            Arbitrage savings:{" "}
            <strong className="text-emerald-profit font-mono">
              ${((systemP50Rate - bestRate) * parcelTonnage).toLocaleString()} USD
            </strong>
          </p>
        </div>
      </div>

      {/* Controls Bar: Sorting & View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-pebble bg-paper p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-charcoal flex items-center gap-1.5">
            <ArrowUpDown className="size-3.5 text-forest-ink" /> Sort Quotes:
          </span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            aria-label="Sort quotes by"
            className="rounded-full border border-pebble bg-paper px-3 py-1 text-xs font-medium text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink"
          >
            <option value="rate_asc">Quoted Rate: Lowest to Highest (Best Value)</option>
            <option value="rate_desc">Quoted Rate: Highest to Lowest</option>
            <option value="delivery_asc">Delivery Transit: Fastest (Fewest Days)</option>
            <option value="variance_asc">Variance vs P50: Maximum Discount</option>
            <option value="broker_name">Broker Name (Alphabetical)</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-full border border-pebble bg-fog p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-all focus-visible:outline-2 focus-visible:outline-forest-ink ${
              viewMode === "cards"
                ? "bg-forest-ink text-paper shadow-sm"
                : "text-charcoal hover:text-forest-ink"
            }`}
          >
            <LayoutGrid className="size-3" /> Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-all focus-visible:outline-2 focus-visible:outline-forest-ink ${
              viewMode === "table"
                ? "bg-forest-ink text-paper shadow-sm"
                : "text-charcoal hover:text-forest-ink"
            }`}
          >
            <List className="size-3" /> Ledger Table
          </button>
        </div>
      </div>

      {/* Main Content Area: Cards or Table */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LoadingSkeleton className="h-64 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      ) : sortedQuotes.length === 0 ? (
        <div className="rounded-card border border-pebble bg-paper p-8">
          <EmptyState
            icon={<Sparkles className="size-10 text-lime-voltage" />}
            title="No broker quotes found"
            description="Broadcast a new RFQ transmission across Baltic Exchange dry bulk brokers."
            action={
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-forest-ink px-4 py-2 text-xs font-semibold text-paper"
              >
                <Send className="size-3.5 text-lime-voltage" /> Request Quotes
              </button>
            }
          />
        </div>
      ) : viewMode === "cards" ? (
        /* SECTION: Broker Quote Comparison Cards */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedQuotes.map((q, idx) => {
            const variance = q.quoted_rate_usd_per_mt - systemP50Rate;
            const isDiscount = variance < 0;
            const isLowest = q.id === lowestRateQuote?.id;
            const isSecond = idx === 1 && !isLowest;
            const totalCostUsd = q.quoted_rate_usd_per_mt * (q.parcel_mt || parcelTonnage);
            const totalSavingsUsd = Math.abs(variance * (q.parcel_mt || parcelTonnage));

            return (
              <div
                key={q.id}
                className={`relative rounded-card border bg-paper p-5 transition-all hover:border-forest-ink shadow-sm space-y-3 flex flex-col justify-between ${
                  isLowest
                    ? "border-emerald-profit/50 ring-2 ring-emerald-profit/20"
                    : isSecond
                    ? "border-lime-voltage/40"
                    : "border-pebble"
                }`}
              >
                {/* Ranking & Status Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {isLowest ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-profit px-2.5 py-0.5 font-mono text-[10px] font-bold text-paper shadow-sm">
                        <Award className="size-3 text-lime-voltage" /> RANK #1 — LOWEST OFFER
                      </span>
                    ) : isSecond ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-linen-mist px-2.5 py-0.5 font-mono text-[10px] font-bold text-forest-ink border border-lime-voltage/40">
                        <Sparkles className="size-3 text-spruce" /> RANK #2 — COMPETITIVE
                      </span>
                    ) : (
                      <span className="rounded-full bg-fog px-2 py-0.5 font-mono text-[10px] font-semibold text-charcoal">
                        OFFER #{idx + 1}
                      </span>
                    )}
                  </div>

                  <Pill tone={isDiscount ? "positive" : "pending"}>
                    {isDiscount ? (
                      <>
                        <TrendingDown className="size-3" />
                        <span>Save ${Math.abs(variance).toFixed(2)}/MT</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="size-3" />
                        <span>+${variance.toFixed(2)}/MT</span>
                      </>
                    )}
                  </Pill>
                </div>

                {/* Broker Details */}
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-forest-ink text-base">
                    <Building className="size-4 text-slate" />
                    <span>{q.broker_name}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-xs text-slate font-mono">
                    <span>{q.broker_desk || "Baltic Broker Desk"}</span>
                    <span>{q.quote_request_label || `REF-${q.id}`}</span>
                  </div>
                </div>

                {/* Big Price Callout */}
                <div className="rounded-card bg-fog p-3 border border-pebble/60 flex items-baseline justify-between">
                  <div>
                    <span className="font-mono text-[10px] uppercase text-slate block">Quoted Freight Rate</span>
                    <div className="font-mono text-xl font-bold text-forest-ink tabular-nums">
                      ${q.quoted_rate_usd_per_mt.toFixed(2)}{" "}
                      <span className="text-xs font-sans font-normal text-slate">/ MT</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] uppercase text-slate block">Total Lump Voyage</span>
                    <div className="font-mono text-sm font-bold text-charcoal tabular-nums">
                      ${totalCostUsd.toLocaleString()} USD
                    </div>
                  </div>
                </div>

                {/* Vessel & Delivery Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-pebble/60 pt-3">
                  <div className="flex items-center gap-1.5 text-charcoal">
                    <Ship className="size-3.5 text-forest-ink" />
                    <span className="font-semibold">{q.vessel_type}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-charcoal font-mono tabular-nums">
                    <Clock className="size-3.5 text-slate" />
                    <span>{q.delivery_days} Transit Days</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate font-mono col-span-2">
                    <Calendar className="size-3.5 text-slate" />
                    <span>Valid until: {q.valid_until}</span>
                  </div>
                </div>

                {/* Variance vs P50 Summary Strip */}
                <div className={`rounded-card p-2 text-[11px] font-mono flex items-center justify-between ${
                  isDiscount ? "bg-emerald-wash text-emerald-profit border border-emerald-profit/20" : "bg-amber-wash text-amber-warning border border-amber-warning/20"
                }`}>
                  <span>vs P50 Baseline (${systemP50Rate.toFixed(2)}):</span>
                  <span className="font-bold tabular-nums">
                    {isDiscount ? `-$${totalSavingsUsd.toLocaleString()} USD` : `+$${totalSavingsUsd.toLocaleString()} USD`}
                  </span>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    setToastMessage(`Selected quote from ${q.broker_name} (${q.vessel_type}) for charter execution.`);
                    setTimeout(() => setToastMessage(null), 4000);
                  }}
                  className={`w-full rounded-full py-2 text-xs font-semibold shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-forest-ink active:scale-95 ${
                    isLowest
                      ? "bg-forest-ink text-paper hover:bg-forest-ink/90"
                      : "border border-forest-ink bg-paper text-forest-ink hover:bg-fog"
                  }`}
                >
                  Select for Booking Fixture
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* SECTION: Table View with P50 Comparison & Badges */
        <div className="overflow-hidden rounded-card border border-pebble bg-paper shadow-sm">
          <div className="border-b border-pebble bg-linen-mist/20 px-6 py-3.5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-forest-ink">
              Broker Ledger vs Astitva P50 Engine
            </h2>
            <span className="font-mono text-xs text-slate">
              Baseline: ${systemP50Rate.toFixed(2)}/MT
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-pebble bg-fog font-mono text-[10px] uppercase tracking-wider text-charcoal">
                <tr>
                  <th className="px-5 py-3">Broker Desk</th>
                  <th className="px-5 py-3">Vessel Class</th>
                  <th className="px-5 py-3 text-right">Quoted Rate ($/MT)</th>
                  <th className="px-5 py-3 text-right">Total Cargo Cost ($)</th>
                  <th className="px-5 py-3 text-right">Astitva P50 Delta</th>
                  <th className="px-5 py-3 text-center">Delivery Days</th>
                  <th className="px-5 py-3">Valid Until</th>
                  <th className="px-5 py-3 text-center">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pebble">
                {sortedQuotes.map((q) => {
                  const variance = q.quoted_rate_usd_per_mt - systemP50Rate;
                  const isLower = variance < 0;
                  const isLowest = q.id === lowestRateQuote?.id;
                  const totalCostUsd = q.quoted_rate_usd_per_mt * (q.parcel_mt || parcelTonnage);

                  return (
                    <tr key={q.id} className="hover:bg-linen-mist/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 font-semibold text-forest-ink">
                          <Building className="size-4 text-slate" />
                          <span>{q.broker_name}</span>
                          {isLowest && (
                            <span className="rounded-full bg-emerald-profit px-2 py-0.5 font-mono text-[9px] font-bold text-paper">
                              LOWEST
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-slate">
                          {q.broker_desk || q.quote_request_label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-charcoal">
                          <Ship className="size-3.5 text-forest-ink" />
                          <span>{q.vessel_type}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono text-sm font-bold text-forest-ink tabular-nums">
                        ${q.quoted_rate_usd_per_mt.toFixed(2)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold text-charcoal tabular-nums">
                        ${totalCostUsd.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono text-xs">
                        <div className="flex items-center justify-end gap-1">
                          {isLower ? (
                            <TrendingDown className="size-3.5 text-emerald-profit" />
                          ) : (
                            <TrendingUp className="size-3.5 text-alarm-red" />
                          )}
                          <span
                            className={`font-semibold tabular-nums ${
                              isLower ? "text-emerald-profit" : "text-alarm-red"
                            }`}
                          >
                            {isLower ? "-" : "+"}${Math.abs(variance).toFixed(2)} / MT
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-center font-mono tabular-nums">
                        <span className="inline-flex items-center gap-1 text-charcoal">
                          <Clock className="size-3 text-slate" />
                          <span>{q.delivery_days}d</span>
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-slate">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-slate" />
                          <span>{q.valid_until}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center rounded-full bg-emerald-wash px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-profit border border-emerald-profit/20">
                          ★ {q.broker_rating || 4.8}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task 397: Modal for "Send for Quotes" */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-ink/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card border border-pebble bg-paper p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-pebble pb-3">
              <div className="flex items-center gap-2">
                <Send className="size-4 text-forest-ink" />
                <h3 className="text-sm font-bold text-forest-ink">
                  Request Broker Quotations (RFQ Broadcast)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded p-1 text-slate hover:text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink"
                aria-label="Close modal"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Task 397 exact text requirement */}
            <div className="rounded-card border border-amber-warning/30 bg-amber-wash p-4 text-xs text-charcoal leading-relaxed">
              <div className="flex items-center gap-2 font-bold mb-1 text-amber-warning">
                <HelpCircle className="size-4 text-amber-warning" />
                <span>Simulation Protocol</span>
              </div>
              In the full system, this would notify registered brokers. Currently logged for reference only.
            </div>

            <p className="text-xs text-slate">
              Simulating an RFQ transmission across Baltic Exchange registered brokers for the 75,000 MT Newcastle → Paradip parcel.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-pebble">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full border border-pebble bg-paper px-4 py-2 text-xs font-semibold text-charcoal hover:bg-fog focus-visible:outline-2 focus-visible:outline-forest-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendQuotes}
                className="rounded-full bg-forest-ink px-5 py-2 text-xs font-semibold text-paper hover:bg-forest-ink/90 active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-forest-ink"
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorQuotesPage;
