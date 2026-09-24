import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface VendorQuote {
  id: number;
  quote_request_label?: string;
  broker_name: string;
  vessel_type: string;
  quoted_rate_usd_per_mt: number;
  delivery_days: number;
  valid_until: string;
  is_sample_data: boolean;
  sample_data_notice?: string;
}

export const VendorQuotesPage: React.FC = () => {
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // System P50 reference benchmark (Newcastle->Paradip 75k MT)
  const systemP50Rate = 14.28;

  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<VendorQuote[]>("/quotes");
      setQuotes(data || []);
    } catch {
      // Demo fallback quotes
      setQuotes([
        {
          id: 1,
          quote_request_label: "RFQ-2026-001",
          broker_name: "Clarksons Platou (Asia)",
          vessel_type: "Panamax",
          quoted_rate_usd_per_mt: 14.65,
          delivery_days: 18,
          valid_until: "2026-10-15",
          is_sample_data: true,
        },
        {
          id: 2,
          quote_request_label: "RFQ-2026-002",
          broker_name: "Braemar ACM Shipbroking",
          vessel_type: "Panamax",
          quoted_rate_usd_per_mt: 14.10,
          delivery_days: 17,
          valid_until: "2026-10-12",
          is_sample_data: true,
        },
        {
          id: 3,
          quote_request_label: "RFQ-2026-003",
          broker_name: "Simpson Spence Young (SSY)",
          vessel_type: "Capesize (Part-Discharge)",
          quoted_rate_usd_per_mt: 11.85,
          delivery_days: 20,
          valid_until: "2026-10-18",
          is_sample_data: true,
        },
        {
          id: 4,
          quote_request_label: "RFQ-2026-004",
          broker_name: "Banchero Costa & C",
          vessel_type: "Supramax",
          quoted_rate_usd_per_mt: 16.40,
          delivery_days: 19,
          valid_until: "2026-10-10",
          is_sample_data: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  // Task 397: Handle modal confirm
  const handleConfirmSendQuotes = () => {
    setShowModal(false);
    setToastMessage("Quote request logged.");
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Task 396: Persistent Non-Dismissible Amber Sample Data Banner */}
      <div className="flex items-start gap-3 rounded-card border border-amber-300 bg-amber-50 p-4 text-amber-900">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-warning" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-amber-950">
            Sample Data Notice:{" "}
          </span>
          Sample data only. These quotes are shown to demonstrate how real broker replies would appear. No live broker integration is connected.
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center gap-2 rounded-card bg-forest-ink p-3.5 text-xs font-semibold text-paper">
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
              BROKER BENCHMARK DESK
            </span>
          </div>
          <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight text-obsidian sm:text-3xl">
            Baltic Shipbroker Quotations & Valuation
          </h1>
          <p className="mt-0.5 text-xs text-slate">
            Evaluate live charter market indications against Astitva's ML-forecasted P50 freight baseline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Task 397: Send for Quotes Button */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-full bg-lime-voltage px-4 py-2 text-xs font-medium text-forest-ink hover:brightness-95 active:scale-95 transition-all"
          >
            <Send className="size-3.5" />
            <span>Send for Quotes</span>
          </button>

          <button
            type="button"
            onClick={fetchQuotes}
            aria-label="Refresh quotes"
            className="flex items-center gap-1.5 rounded-full border border-forest-ink bg-paper px-3 py-2 text-xs font-medium text-forest-ink hover:bg-fog transition-colors"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Comparison Reference KPI */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-pebble bg-paper p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate">
            System P50 Model Forecast
          </span>
          <div className="mt-1 font-mono text-2xl font-bold text-forest-ink">
            ${systemP50Rate.toFixed(2)}{" "}
            <span className="text-xs font-sans font-normal text-slate">/ MT</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate">
            Median rate predicted for Newcastle → Paradip Panamax
          </p>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate">
            Active Broker Quotes
          </span>
          <div className="mt-1 font-mono text-2xl font-bold text-obsidian">
            {quotes.length}{" "}
            <span className="text-xs font-sans font-normal text-slate">indications</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate">
            Leading London & Singapore dry bulk desks
          </p>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate">
            Best Market Offer
          </span>
          <div className="mt-1 flex items-center gap-2 font-mono text-2xl font-bold text-forest-ink">
            <TrendingDown className="size-5 text-forest-ink" />
            <span>
              $
              {quotes.length > 0
                ? Math.min(...quotes.map((q) => q.quoted_rate_usd_per_mt)).toFixed(2)
                : "14.10"}
              <span className="text-xs font-sans font-normal text-slate"> / MT</span>
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate">
            Lowest broker indication within current laycan
          </p>
        </div>
      </div>

      {/* Task 395: Table of Quotes with P50 Comparison */}
      <div className="overflow-hidden rounded-card border border-pebble bg-paper">
        <div className="border-b border-pebble bg-linen-mist/20 px-6 py-3.5">
          <h2 className="font-sans text-sm font-bold text-obsidian">
            Received Broker Quotes vs Astitva P50 Engine
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-pebble bg-linen-mist/40 font-mono text-[10px] uppercase tracking-wider text-slate">
              <tr>
                <th className="px-5 py-3">Broker</th>
                <th className="px-5 py-3">Vessel Type</th>
                <th className="px-5 py-3 text-right">Quoted Rate ($/MT)</th>
                <th className="px-5 py-3 text-right">Astitva P50 Comparison</th>
                <th className="px-5 py-3 text-center">Delivery Days</th>
                <th className="px-5 py-3">Valid Until</th>
                <th className="px-5 py-3 text-center">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pebble">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate font-mono">
                    Loading broker quotation ledger…
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate">
                    No quotes received.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => {
                  const variance = q.quoted_rate_usd_per_mt - systemP50Rate;
                  const isLower = variance < 0;

                  return (
                    <tr key={q.id} className="hover:bg-linen-mist/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 font-semibold text-charcoal">
                          <Building className="size-4 text-slate" />
                          <span>{q.broker_name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate">
                          {q.quote_request_label || `REF-#${q.id}`}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-charcoal">
                          <Ship className="size-3.5 text-forest-ink" />
                          <span>{q.vessel_type}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono text-sm font-bold text-charcoal">
                        ${q.quoted_rate_usd_per_mt.toFixed(2)}
                      </td>

                      {/* Task 395: Alongside each row show P50 comparison */}
                      <td className="px-5 py-3.5 text-right font-mono text-xs">
                        <div className="flex items-center justify-end gap-1">
                          {isLower ? (
                            <TrendingDown className="size-3.5 text-forest-ink" />
                          ) : (
                            <TrendingUp className="size-3.5 text-alarm-red" />
                          )}
                          <span
                            className={`font-semibold ${
                              isLower ? "text-forest-ink" : "text-alarm-red"
                            }`}
                          >
                            {isLower ? "-" : "+"}${Math.abs(variance).toFixed(2)} / MT
                          </span>
                        </div>
                        <span className="text-[10px] text-slate">
                          vs P50 (${systemP50Rate.toFixed(2)})
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center font-mono">
                        <span className="inline-flex items-center gap-1 text-slate">
                          <Clock className="size-3 text-slate" />
                          <span>{q.delivery_days} days</span>
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-slate">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-slate" />
                          <span>{q.valid_until}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center rounded-full bg-amber-wash px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-warning border border-amber-300">
                          SAMPLE DATA
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

      {/* Task 397: Modal for "Send for Quotes" */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-pebble bg-paper p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-pebble pb-3">
              <div className="flex items-center gap-2">
                <Send className="size-4 text-forest-ink" />
                <h3 className="font-sans text-sm font-bold text-obsidian">
                  Request Broker Quotations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate hover:text-charcoal"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Task 397 exact modal text */}
            <div className="rounded-card border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
              <div className="flex items-center gap-2 font-bold mb-1">
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
                className="rounded-full border border-pebble bg-paper px-4 py-2 text-xs font-medium text-charcoal hover:bg-fog"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendQuotes}
                className="rounded-full bg-forest-ink px-4 py-2 text-xs font-medium text-paper hover:bg-forest-ink/90 active:scale-95 transition-all"
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
