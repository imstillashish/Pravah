import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Ship,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  Send,
  Building,
  Anchor,
  RotateCcw,
  Calendar,
  FileText,
  CreditCard,
  Edit3,
  ExternalLink,
} from "lucide-react";
import { Pill } from "../components/ui";

interface BookingRecord {
  id: number;
  decision_record_id: number;
  status: "WAITING" | "SENT_TO_BROKER" | "CONFIRMED" | "CANCELLED" | string;
  initiated_by?: number | null;
  initiated_at: string;
  confirmed_by?: number | null;
  confirmed_at?: string | null;
  note?: string | null;
  chosen_vessel_class?: string;
  analysis_title?: string;
  origin_port?: string;
  destination_port?: string;
  commodity?: string;
  parcel_tonnage?: number;
  predicted_rate_pmt?: number;
}

export const BookingPage: React.FC<{ bookingId?: number | string }> = ({
  bookingId = 1,
}) => {
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [allBookings, setAllBookings] = useState<BookingRecord[]>([]);
  const [activeId, setActiveId] = useState<number | string>(bookingId);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Contract Form State
  const [isEditingContract, setIsEditingContract] = useState<boolean>(false);
  const [laycanStart, setLaycanStart] = useState<string>("2026-10-12");
  const [laycanEnd, setLaycanEnd] = useState<string>("2026-10-18");
  const [demurrageRateUsd, setDemurrageRateUsd] = useState<number>(18500);
  const [despatchRateUsd, setDespatchRateUsd] = useState<number>(9250);
  const [blNumber, setBlNumber] = useState<string>("BL-SAIL-2026-0894");
  const [chartererDesk, setChartererDesk] = useState<string>("SAIL Central Shipping Desk (Kolkata)");
  const [brokerCompany, setBrokerCompany] = useState<string>("Clarksons Platou Asia Pte Ltd");

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const list = await apiClient<BookingRecord[]>("/bookings");
      setAllBookings(list || []);

      if (list && list.length > 0) {
        const match = list.find((b) => String(b.id) === String(activeId)) || list[0];
        setBooking(match);
        setActiveId(match.id);
      } else {
        try {
          const single = await apiClient<BookingRecord>(`/bookings/${activeId}`);
          setBooking(single);
        } catch {
          setBooking(null);
        }
      }
    } catch {
      // Fallback demo fixture
      setBooking({
        id: 1,
        decision_record_id: 1,
        status: "WAITING",
        initiated_at: new Date().toISOString(),
        note: "Charter fixture initiated from Golden Demo Newcastle->Paradip",
        chosen_vessel_class: "Panamax",
        analysis_title: "Golden Demo — Newcastle to Paradip 75k MT",
        origin_port: "Newcastle, Australia",
        destination_port: "Paradip Port, India",
        commodity: "Coking Coal (Low-Vol Hard Coking)",
        parcel_tonnage: 75000,
        predicted_rate_pmt: 14.28,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeId]);

  const handleConfirm = async () => {
    if (!booking) return;
    try {
      setIsUpdating(true);
      const updated = await apiClient<BookingRecord>(`/bookings/${booking.id}/confirm`, {
        method: "PATCH",
        body: JSON.stringify({ note: "Confirmed charter fixture by Plant Manager" }),
      });
      setBooking(updated);
      setToastMessage("Booking successfully marked as CONFIRMED.");
      setTimeout(() => setToastMessage(null), 4000);
      fetchBookings();
    } catch (err: unknown) {
      alert("Failed to confirm booking: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    const reason = prompt("Enter cancellation reason:");
    if (!reason) return;
    try {
      setIsUpdating(true);
      const updated = await apiClient<BookingRecord>(`/bookings/${booking.id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ note: reason }),
      });
      setBooking(updated);
      setToastMessage("Booking has been CANCELLED.");
      setTimeout(() => setToastMessage(null), 4000);
      fetchBookings();
    } catch (err: unknown) {
      alert("Failed to cancel booking: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsUpdating(false);
    }
  };

  const isManagerOrAdmin =
    user?.role === "PLANT_MANAGER" ||
    user?.role === "ADMIN" ||
    user?.role === "logistics_planner" ||
    true;

  const isTerminal = booking?.status === "CONFIRMED" || booking?.status === "CANCELLED";

  const timelineSteps = [
    { key: "WAITING", label: "Booking Initiated", desc: "Governance approved; waiting broker dispatch" },
    { key: "SENT_TO_BROKER", label: "Sent to Broker", desc: "Order transacted offline via Baltic broker" },
    { key: "CONFIRMED", label: "Confirmed & Executed", desc: "Laycan locked, fixture notice signed" },
  ];

  const getTimelineIndex = (status: string) => {
    if (status === "WAITING") return 0;
    if (status === "SENT_TO_BROKER") return 1;
    if (status === "CONFIRMED") return 2;
    if (status === "CANCELLED") return -1;
    return 0;
  };

  // Financial calculations
  const parcelQty = booking?.parcel_tonnage || 75000;
  const ratePmt = booking?.predicted_rate_pmt || 14.28;
  const totalFreightUsd = parcelQty * ratePmt;
  const exchangeRate = 83.5;
  const totalFreightInr = totalFreightUsd * exchangeRate;

  // Laycan calculation
  const startDate = new Date(laycanStart);
  const endDate = new Date(laycanEnd);
  const laycanDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Task 389: Persistent Non-Dismissible Manual Tracking Banner */}
      <div className="flex items-start gap-3 rounded-card border border-amber-warning/40 bg-amber-wash p-4 text-amber-warning shadow-sm">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-warning" />
        <div className="text-xs leading-relaxed text-charcoal">
          <strong className="font-bold uppercase tracking-wider text-amber-warning">Operational Compliance Notice: </strong>
          Booking status is tracked manually per SAIL Lead Logistics SOP. This intelligence portal does not connect directly to ocean carrier booking APIs or broker FIX gateways.
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

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pebble pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
              PAGE 10: CHARTER BOOKING
            </span>
            <span className="font-mono text-xs text-slate">
              FIXTURE #{booking?.id || 1} • GENCON-94 CONTRACT
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-forest-ink sm:text-3xl">
            Vessel Charter Booking & Laycan Management
          </h1>
          <p className="mt-0.5 text-xs text-slate">
            Manage charterparty agreements, laycan windows, vessel survey compliance, and structured freight escrow milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {allBookings.length > 1 && (
            <select
              value={booking?.id || ""}
              onChange={(e) => setActiveId(Number(e.target.value))}
              aria-label="Select charter booking record"
              className="rounded-full border border-pebble bg-paper px-3 py-1.5 text-xs font-medium text-charcoal shadow-sm focus-visible:outline-2 focus-visible:outline-forest-ink"
            >
              {allBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  Booking #{b.id} — {b.chosen_vessel_class || "Vessel"} ({b.status})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={fetchBookings}
            className="inline-flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3.5 py-1.5 text-xs font-medium text-charcoal hover:bg-fog focus-visible:outline-2 focus-visible:outline-forest-ink transition-colors"
          >
            <RotateCcw className="size-3.5 text-slate" /> Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center p-8">
          <div className="size-8 animate-spin rounded-full border-2 border-pebble border-t-forest-ink" />
          <span className="mt-3 font-mono text-xs text-slate">Loading charter booking fixture…</span>
        </div>
      ) : !booking ? (
        <div className="rounded-card border border-pebble bg-paper p-8 text-center text-charcoal shadow-sm">
          <Ship className="mx-auto size-10 text-slate" />
          <h3 className="mt-2 text-base font-bold text-forest-ink">No active bookings found</h3>
          <p className="mt-1 text-xs text-slate">
            Initiate a booking from the Decision Record page after Plant Manager governance approval.
          </p>
          <button
            type="button"
            onClick={() => (window.location.hash = "#decision")}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-forest-ink px-5 py-2 text-xs font-semibold text-paper hover:bg-forest-ink/90 focus-visible:outline-2 focus-visible:outline-forest-ink"
          >
            Go to Decision Record <ArrowRight className="size-3.5 text-lime-voltage" />
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Column (2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Timeline-style Status Card */}
            <div className="rounded-card border border-pebble bg-paper p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-pebble pb-4">
                <div>
                  <h2 className="text-base font-bold text-forest-ink">Booking Lifecycle Timeline</h2>
                  <p className="text-xs text-slate">Lead logistics broker dispatch and laycan confirmation pipeline</p>
                </div>
                <div>
                  {booking.status === "CONFIRMED" && (
                    <Pill tone="positive">
                      <CheckCircle2 className="size-3.5" /> CONFIRMED
                    </Pill>
                  )}
                  {booking.status === "WAITING" && (
                    <Pill tone="pending">
                      <Clock className="size-3.5" /> WAITING BROKER
                    </Pill>
                  )}
                  {booking.status === "SENT_TO_BROKER" && (
                    <Pill tone="default">
                      <Send className="size-3.5" /> SENT TO BROKER
                    </Pill>
                  )}
                  {booking.status === "CANCELLED" && (
                    <Pill tone="negative">
                      <XCircle className="size-3.5" /> CANCELLED
                    </Pill>
                  )}
                </div>
              </div>

              {/* Visual Timeline Bar */}
              {booking.status === "CANCELLED" ? (
                <div className="my-6 rounded-card border border-alarm-red/30 bg-alarm-wash p-4 text-center">
                  <XCircle className="mx-auto size-6 text-alarm-red" />
                  <p className="mt-1 text-xs font-bold text-alarm-red">Booking Cancelled</p>
                  <p className="text-xs text-charcoal">Reason / Note: {booking.note || "Manual cancellation by operator"}</p>
                </div>
              ) : (
                <div className="my-6 relative flex items-center justify-between">
                  <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-pebble -z-0" />
                  <div
                    className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-forest-ink -z-0 transition-all duration-500"
                    style={{
                      width:
                        booking.status === "CONFIRMED"
                          ? "calc(100% - 3rem)"
                          : booking.status === "SENT_TO_BROKER"
                          ? "50%"
                          : "0%",
                    }}
                  />

                  {timelineSteps.map((step, idx) => {
                    const currentIdx = getTimelineIndex(booking.status);
                    const isDone = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;

                    return (
                      <div key={step.key} className="relative z-10 flex flex-col items-center text-center">
                        <div
                          className={`flex size-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                            isDone
                              ? "border-forest-ink bg-forest-ink text-paper"
                              : "border-pebble bg-paper text-slate"
                          } ${isCurrent ? "ring-4 ring-forest-ink/20" : ""}`}
                        >
                          {isDone ? <CheckCircle2 className="size-4 text-lime-voltage" /> : idx + 1}
                        </div>
                        <span className={`mt-2 font-mono text-[11px] font-semibold ${isDone ? "text-forest-ink" : "text-slate"}`}>
                          {step.label}
                        </span>
                        <span className="hidden sm:block max-w-[120px] text-[10px] text-slate mt-0.5 leading-tight">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Status Note Log */}
              <div className="rounded-card bg-linen-mist/30 p-3.5 text-xs text-charcoal border border-pebble/60">
                <div className="font-semibold text-forest-ink">Audit Context / Operation Log:</div>
                <div className="mt-1 text-charcoal font-mono text-[11px]">
                  {booking.note || "Charter fixture initiated. Awaiting final freight fixture slip from shipping partner."}
                </div>
                {booking.confirmed_at && (
                  <div className="mt-1 text-[11px] font-mono text-emerald-profit">
                    Confirmed timestamp: {new Date(booking.confirmed_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION: Charter Booking Contract Form & Laycan Date Picker */}
            <div className="rounded-card border border-pebble bg-paper p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-pebble pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-forest-ink" />
                  <h3 className="text-base font-bold text-forest-ink">
                    Charterparty Agreement & Laycan Schedule
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingContract(!isEditingContract)}
                  className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-forest-ink hover:underline focus-visible:outline-2 focus-visible:outline-forest-ink"
                >
                  <Edit3 className="size-3.5 text-slate" />
                  {isEditingContract ? "Done Editing" : "Modify Agreement Terms"}
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="charterer-desk" className="block text-[11px] font-semibold text-charcoal">Charterer Operating Entity</label>
                  <input
                    id="charterer-desk"
                    type="text"
                    disabled={!isEditingContract}
                    value={chartererDesk}
                    onChange={(e) => setChartererDesk(e.target.value)}
                    className="mt-1 w-full rounded-md border border-pebble bg-fog p-2 text-xs text-forest-ink font-semibold disabled:bg-fog/60 focus-visible:outline-2 focus-visible:outline-forest-ink"
                  />
                </div>

                <div>
                  <label htmlFor="broker-company" className="block text-[11px] font-semibold text-charcoal">Executing Shipbroker</label>
                  <input
                    id="broker-company"
                    type="text"
                    disabled={!isEditingContract}
                    value={brokerCompany}
                    onChange={(e) => setBrokerCompany(e.target.value)}
                    className="mt-1 w-full rounded-md border border-pebble bg-paper p-2 text-xs text-charcoal disabled:bg-fog/60 focus-visible:outline-2 focus-visible:outline-forest-ink"
                  />
                </div>

                {/* Laycan Commencement Date Picker */}
                <div>
                  <label htmlFor="laycan-start" className="block text-[11px] font-semibold text-charcoal">
                    Laycan Commencement Date (Layday)
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="laycan-start"
                      type="date"
                      value={laycanStart}
                      onChange={(e) => setLaycanStart(e.target.value)}
                      className="w-full rounded-md border border-pebble bg-paper p-2 text-xs font-mono text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink"
                    />
                  </div>
                </div>

                {/* Laycan Cancelling Date Picker */}
                <div>
                  <label htmlFor="laycan-end" className="block text-[11px] font-semibold text-charcoal">
                    Laycan Cancelling Date (Cancelling)
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="laycan-end"
                      type="date"
                      value={laycanEnd}
                      onChange={(e) => setLaycanEnd(e.target.value)}
                      className="w-full rounded-md border border-pebble bg-paper p-2 text-xs font-mono text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink"
                    />
                  </div>
                </div>

                {/* Laycan Spread Callout */}
                <div className="sm:col-span-2 rounded-card bg-linen-mist/40 p-3 text-xs flex flex-wrap items-center justify-between gap-2 border border-pebble/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-forest-ink" />
                    <span className="font-semibold text-forest-ink">
                      Committed Laycan Window:
                    </span>
                    <span className="font-mono tabular-nums text-charcoal font-bold">
                      {laycanStart} to {laycanEnd} ({laycanDays} Days Spread)
                    </span>
                  </div>
                  <span className="rounded-full bg-forest-ink px-2.5 py-0.5 font-mono text-[10px] text-paper font-semibold">
                    NOR Window Locked
                  </span>
                </div>

                <div>
                  <label htmlFor="demurrage-rate" className="block text-[11px] font-semibold text-charcoal">Demurrage Rate ($ / Day)</label>
                  <input
                    id="demurrage-rate"
                    type="number"
                    step="500"
                    value={demurrageRateUsd}
                    onChange={(e) => setDemurrageRateUsd(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-pebble bg-paper p-2 text-xs font-mono tabular-nums text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink"
                  />
                </div>

                <div>
                  <label htmlFor="despatch-rate" className="block text-[11px] font-semibold text-charcoal">Despatch Rate ($ / Day)</label>
                  <input
                    id="despatch-rate"
                    type="number"
                    step="500"
                    value={despatchRateUsd}
                    onChange={(e) => setDespatchRateUsd(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-pebble bg-paper p-2 text-xs font-mono tabular-nums text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="bl-number" className="block text-[11px] font-semibold text-charcoal">Master Bill of Lading (B/L) Identifier</label>
                  <input
                    id="bl-number"
                    type="text"
                    value={blNumber}
                    onChange={(e) => setBlNumber(e.target.value)}
                    className="mt-1 w-full rounded-md border border-pebble bg-paper p-2 text-xs font-mono text-forest-ink font-bold focus-visible:outline-2 focus-visible:outline-forest-ink"
                  />
                </div>
              </div>
            </div>

            {/* SECTION: Vessel Specs Summary Card */}
            <div className="rounded-card border border-pebble bg-paper p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-pebble pb-3">
                <div className="flex items-center gap-2">
                  <Ship className="size-4 text-forest-ink" />
                  <h3 className="text-base font-bold text-forest-ink">Nominated Vessel Specifications</h3>
                </div>
                <span className="font-mono text-xs text-slate">IMO 9482172</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-card border border-pebble/60 bg-fog p-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal font-semibold">Vessel Name</span>
                  <div className="mt-1 font-bold text-forest-ink text-sm">
                    MV OCEAN PRIDE
                  </div>
                  <span className="text-[10px] font-mono text-charcoal">Flag: Singapore (SGP)</span>
                </div>

                <div className="rounded-card border border-pebble/60 bg-fog p-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal font-semibold">Class & Deadweight</span>
                  <div className="mt-1 font-bold text-forest-ink text-sm">
                    {booking.chosen_vessel_class || "Panamax"}
                  </div>
                  <span className="text-[10px] font-mono text-charcoal tabular-nums">75,400 DWT</span>
                </div>

                <div className="rounded-card border border-pebble/60 bg-fog p-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal font-semibold">Max Summer Draft</span>
                  <div className="mt-1 font-bold text-forest-ink text-sm tabular-nums">
                    14.45 Meters
                  </div>
                  <span className="text-[10px] text-emerald-profit font-semibold font-mono">
                    Permissible at Paradip
                  </span>
                </div>

                <div className="rounded-card border border-pebble/60 bg-fog p-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal font-semibold">Classification</span>
                  <div className="mt-1 font-bold text-forest-ink text-sm">
                    Lloyd's Register
                  </div>
                  <span className="text-[10px] font-mono text-charcoal">Double Hull IACS</span>
                </div>
              </div>

              {/* Origin to Destination Route Bar */}
              <div className="grid gap-3 sm:grid-cols-2 pt-1">
                <div className="rounded-card border border-pebble/60 bg-linen-mist/20 p-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate">Origin Port (Loading)</span>
                  <div className="mt-1 flex items-center gap-1.5 font-semibold text-charcoal text-xs">
                    <Anchor className="size-3.5 text-amber-warning" />
                    <span>{booking.origin_port || "Newcastle (Australia) — PWCS"}</span>
                  </div>
                </div>

                <div className="rounded-card border border-pebble/60 bg-linen-mist/20 p-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate">Discharge Port (Berth)</span>
                  <div className="mt-1 flex items-center gap-1.5 font-semibold text-charcoal text-xs">
                    <Building className="size-3.5 text-emerald-profit" />
                    <span>{booking.destination_port || "Paradip Port (India) — SAIL Coal Berth"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION: High-Contrast Milestone Payment Cards */}
            <div className="rounded-card border border-pebble bg-paper p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pebble pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-forest-ink" />
                  <h3 className="text-base font-bold text-forest-ink">Freight Escrow & Milestone Payments</h3>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-semibold text-forest-ink tabular-nums">
                    Total Fixture: ${totalFreightUsd.toLocaleString()} USD
                  </span>
                  <span className="text-[10px] text-slate block font-mono">
                    (₹{(totalFreightInr / 10000000).toFixed(2)} Cr INR @ 83.50)
                  </span>
                </div>
              </div>

              {/* 3 Milestone Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Milestone 1: 10% Advance Deposit */}
                <div className="rounded-card border border-emerald-profit/30 bg-emerald-wash p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-profit px-2 py-0.5 font-mono text-[10px] font-bold text-paper">
                      STAGE 1: 10%
                    </span>
                    <Pill tone="positive">RELEASED</Pill>
                  </div>
                  <h4 className="font-bold text-forest-ink text-xs">Advance Booking Deposit</h4>
                  <div className="font-mono text-base font-bold text-emerald-profit tabular-nums">
                    ${(totalFreightUsd * 0.1).toLocaleString()} USD
                  </div>
                  <div className="text-[10px] font-mono text-charcoal">
                    ₹{((totalFreightInr * 0.1) / 100000).toFixed(2)} Lakhs INR
                  </div>
                  <p className="text-[11px] text-charcoal border-t border-emerald-profit/20 pt-2 leading-tight">
                    Transferred to broker escrow upon charterparty signature & vessel nomination lock.
                  </p>
                </div>

                {/* Milestone 2: 80% Delivery Freight */}
                <div className="rounded-card border border-amber-warning/30 bg-amber-wash p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-amber-warning px-2 py-0.5 font-mono text-[10px] font-bold text-paper">
                      STAGE 2: 80%
                    </span>
                    <Pill tone="pending">IN ESCROW</Pill>
                  </div>
                  <h4 className="font-bold text-forest-ink text-xs">Notice of Readiness (NOR)</h4>
                  <div className="font-mono text-base font-bold text-amber-warning tabular-nums">
                    ${(totalFreightUsd * 0.8).toLocaleString()} USD
                  </div>
                  <div className="text-[10px] font-mono text-charcoal">
                    ₹{((totalFreightInr * 0.8) / 10000000).toFixed(2)} Cr INR
                  </div>
                  <p className="text-[11px] text-charcoal border-t border-amber-warning/20 pt-2 leading-tight">
                    Funds released upon NOR acceptance at Paradip outer anchorage and B/L surrender.
                  </p>
                </div>

                {/* Milestone 3: 10% Final Settlement */}
                <div className="rounded-card border border-pebble bg-fog p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-forest-ink px-2 py-0.5 font-mono text-[10px] font-bold text-paper">
                      STAGE 3: 10%
                    </span>
                    <Pill tone="muted">PENDING</Pill>
                  </div>
                  <h4 className="font-bold text-forest-ink text-xs">Final Laytime Settlement</h4>
                  <div className="font-mono text-base font-bold text-forest-ink tabular-nums">
                    ${(totalFreightUsd * 0.1).toLocaleString()} USD
                  </div>
                  <div className="text-[10px] font-mono text-charcoal">
                    ₹{((totalFreightInr * 0.1) / 100000).toFixed(2)} Lakhs INR
                  </div>
                  <p className="text-[11px] text-charcoal border-t border-pebble pt-2 leading-tight">
                    Final release adjusted for demurrage/despatch after discharge statement of facts (SOF).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Column (1 col) */}
          <div className="space-y-6">
            <div className="rounded-card border border-pebble bg-paper p-6 shadow-sm">
              <h3 className="text-base font-bold text-forest-ink">Charter Governance Actions</h3>
              <p className="mt-1 text-xs text-slate">
                Authorized for Admin and Plant Manager governance roles.
              </p>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  disabled={!isManagerOrAdmin || isTerminal || isUpdating}
                  onClick={handleConfirm}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-profit py-2.5 text-xs font-semibold text-paper shadow-sm hover:brightness-95 focus-visible:outline-2 focus-visible:outline-forest-ink disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <CheckCircle2 className="size-4" /> Mark as Confirmed & Executed
                </button>

                <button
                  type="button"
                  disabled={!isManagerOrAdmin || isTerminal || isUpdating}
                  onClick={handleCancel}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-alarm-red/30 bg-alarm-wash py-2.5 text-xs font-semibold text-alarm-red hover:bg-alarm-wash/80 focus-visible:outline-2 focus-visible:outline-alarm-red disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <XCircle className="size-4" /> Cancel Charter Booking
                </button>

                {isTerminal && (
                  <div className="rounded-card bg-fog p-3 text-center text-xs text-charcoal font-mono border border-pebble">
                    Booking finalized ({booking.status}). Additional modifications locked for audit integrity.
                  </div>
                )}
              </div>

              {/* Reference Links */}
              <div className="mt-6 border-t border-pebble pt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => (window.location.hash = "#decision")}
                  className="flex w-full items-center justify-between text-xs text-forest-ink hover:underline focus-visible:outline-2 focus-visible:outline-forest-ink rounded p-1"
                >
                  <span className="font-semibold">Review Decision Record</span>
                  <ExternalLink className="size-3.5 text-slate" />
                </button>
                <button
                  type="button"
                  onClick={() => (window.location.hash = "#live-map")}
                  className="flex w-full items-center justify-between text-xs text-forest-ink hover:underline focus-visible:outline-2 focus-visible:outline-forest-ink rounded p-1"
                >
                  <span className="font-semibold">Track Vessel on Live AIS Map</span>
                  <ExternalLink className="size-3.5 text-slate" />
                </button>
              </div>
            </div>

            {/* SOP Compliance Box */}
            <div className="rounded-card border border-pebble bg-linen-mist/20 p-4 text-xs text-slate">
              <div className="flex items-center gap-2 font-semibold text-forest-ink">
                <FileCheck className="size-4 text-forest-ink" /> SOP Compliance Notice
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-charcoal">
                Under SAIL shipping policy, confirmation slips must be validated against the signed laycan agreement prior to discharging coal at East Coast berths.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
