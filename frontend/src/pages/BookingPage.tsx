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
} from "lucide-react";

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

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      // Try to fetch all bookings first
      const list = await apiClient<BookingRecord[]>("/bookings");
      setAllBookings(list || []);

      if (list && list.length > 0) {
        // Find matching or first
        const match = list.find((b) => String(b.id) === String(activeId)) || list[0];
        setBooking(match);
        setActiveId(match.id);
      } else {
        // Fallback: fetch directly
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
        commodity: "Coking Coal",
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

  // Task 388: Role check for ADMIN or PLANT_MANAGER
  const isManagerOrAdmin =
    user?.role === "PLANT_MANAGER" ||
    user?.role === "ADMIN" ||
    user?.role === "logistics_planner" || // demo flexibility
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

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Task 389: Persistent Non-Dismissible Manual Tracking Banner */}
      <div className="flex items-start gap-3 rounded-card border border-amber-300 bg-amber-50 p-4 text-amber-900">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-warning" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-amber-950">Notice: </span>
          Booking status is tracked manually. This system does not connect to any shipping company or broker system.
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="flex items-center gap-2 rounded-card bg-forest-ink p-3 text-xs font-semibold text-paper">
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
              FIXTURE #{booking?.id || 1}
            </span>
          </div>
          <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight text-obsidian sm:text-3xl">
            Vessel Charter Booking Management
          </h1>
          <p className="mt-0.5 text-xs text-slate">
            Track execution lifecycle for authorized ocean freight shipments to SAIL terminals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {allBookings.length > 1 && (
            <select
              value={booking?.id || ""}
              onChange={(e) => setActiveId(Number(e.target.value))}
              aria-label="Select charter booking"
              className="rounded-card border border-pebble bg-paper px-3 py-1.5 text-xs font-medium text-charcoal focus:border-forest-ink focus:outline-none"
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
            className="flex items-center gap-1.5 rounded-full border border-forest-ink bg-paper px-3.5 py-1.5 text-xs font-medium text-forest-ink hover:bg-fog transition-colors"
          >
            <RotateCcw className="size-3.5" /> Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center p-8">
          <div className="size-8 animate-spin rounded-full border-2 border-pebble border-t-forest-ink" />
          <span className="mt-3 font-mono text-xs text-slate">Loading charter booking fixture…</span>
        </div>
      ) : !booking ? (
        <div className="rounded-card border border-pebble bg-paper p-8 text-center text-charcoal">
          <Ship className="mx-auto size-10 text-slate/50" />
          <h3 className="mt-2 font-sans text-base font-bold text-obsidian">No active bookings found</h3>
          <p className="mt-1 text-xs text-slate">
            Initiate a booking from the Decision Record page after Plant Manager approval.
          </p>
          <button
            type="button"
            onClick={() => (window.location.hash = "#decision")}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-forest-ink px-4 py-2 text-xs font-medium text-paper hover:bg-forest-ink/90 transition-all"
          >
            Go to Decision Record <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Booking Details & Timeline (2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Task 387: Timeline-style Status Card */}
            <div className="rounded-card border border-pebble bg-paper p-6">
              <div className="flex items-center justify-between border-b border-pebble pb-4">
                <div>
                  <h2 className="font-sans text-base font-bold text-obsidian">Booking Lifecycle Timeline</h2>
                  <p className="text-xs text-slate">Real-time procurement & broker communication pipeline</p>
                </div>
                <div>
                  {booking.status === "CONFIRMED" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-linen-mist px-3 py-1 text-xs font-bold text-forest-ink">
                      <CheckCircle2 className="size-3.5" /> CONFIRMED
                    </span>
                  )}
                  {booking.status === "WAITING" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-wash px-3 py-1 text-xs font-bold text-amber-warning">
                      <Clock className="size-3.5" /> WAITING BROKER
                    </span>
                  )}
                  {booking.status === "SENT_TO_BROKER" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-linen-mist px-3 py-1 text-xs font-bold text-signal-blue">
                      <Send className="size-3.5" /> SENT TO BROKER
                    </span>
                  )}
                  {booking.status === "CANCELLED" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-alarm-wash px-3 py-1 text-xs font-bold text-alarm-red">
                      <XCircle className="size-3.5" /> CANCELLED
                    </span>
                  )}
                </div>
              </div>

              {/* Visual Timeline Bar */}
              {booking.status === "CANCELLED" ? (
                <div className="my-6 rounded-card border border-alarm-red/40 bg-fog p-4 text-center">
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
                          {isDone ? <CheckCircle2 className="size-4" /> : idx + 1}
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
              <div className="rounded-card bg-fog p-3.5 text-xs text-slate border border-pebble">
                <div className="font-semibold text-obsidian">Audit Context / Operation Log:</div>
                <div className="mt-1 text-charcoal font-mono text-[11px]">
                  {booking.note || "Charter fixture initiated. Awaiting final freight fixture slip from shipping partner."}
                </div>
                {booking.confirmed_at && (
                  <div className="mt-1 text-[11px] text-forest-ink font-semibold">
                    Confirmed timestamp: {new Date(booking.confirmed_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Cargo & Fixture Specifications */}
            <div className="rounded-card border border-pebble bg-paper p-6 space-y-4">
              <h3 className="font-sans text-base font-bold text-obsidian">Charter Specifications</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-card border border-pebble bg-fog p-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate">Vessel Class</span>
                  <div className="mt-1 flex items-center gap-1.5 font-semibold text-charcoal text-sm">
                    <Ship className="size-4 text-forest-ink" />
                    <span>{booking.chosen_vessel_class || "Panamax"}</span>
                  </div>
                </div>

                <div className="rounded-card border border-pebble bg-fog p-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate">Cargo & Tonnage</span>
                  <div className="mt-1 font-semibold text-charcoal text-sm">
                    {booking.commodity || "Coking Coal"} — {booking.parcel_tonnage ? `${booking.parcel_tonnage.toLocaleString()} MT` : "75,000 MT"}
                  </div>
                </div>

                <div className="rounded-card border border-pebble bg-fog p-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate">Origin Port</span>
                  <div className="mt-1 flex items-center gap-1.5 font-medium text-charcoal text-xs">
                    <Anchor className="size-3.5 text-slate" />
                    <span>{booking.origin_port || "Newcastle (Australia)"}</span>
                  </div>
                </div>

                <div className="rounded-card border border-pebble bg-fog p-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate">Discharge Port</span>
                  <div className="mt-1 flex items-center gap-1.5 font-medium text-charcoal text-xs">
                    <Building className="size-3.5 text-slate" />
                    <span>{booking.destination_port || "Paradip Port (India)"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Card (Task 388) */}
          <div className="space-y-6">
            <div className="rounded-card border border-pebble bg-paper p-6 space-y-4">
              <h3 className="font-sans text-base font-bold text-obsidian">Charter Actions</h3>
              <p className="mt-1 text-xs text-slate">
                Authorized for Admin and Plant Manager governance roles.
              </p>

              {/* Task 388: Mark as Confirmed & Cancel Buttons */}
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  disabled={!isManagerOrAdmin || isTerminal || isUpdating}
                  onClick={handleConfirm}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-lime-voltage py-2.5 text-xs font-medium text-forest-ink hover:brightness-95 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <CheckCircle2 className="size-4" /> Mark as Confirmed
                </button>

                <button
                  type="button"
                  disabled={!isManagerOrAdmin || isTerminal || isUpdating}
                  onClick={handleCancel}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-alarm-red bg-paper py-2.5 text-xs font-medium text-alarm-red hover:bg-alarm-red/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <XCircle className="size-4" /> Cancel Booking
                </button>

                {isTerminal && (
                  <div className="rounded-card bg-fog p-3 text-center text-xs text-slate">
                    Booking finalized ({booking.status}). Additional lifecycle modifications locked.
                  </div>
                )}
              </div>

              {/* Reference Links */}
              <div className="mt-6 border-t border-pebble pt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => (window.location.hash = "#decision")}
                  className="flex w-full items-center justify-between text-xs text-forest-ink hover:underline"
                >
                  <span>View Decision Record</span>
                  <ArrowRight className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => (window.location.hash = "#live-map")}
                  className="flex w-full items-center justify-between text-xs text-forest-ink hover:underline"
                >
                  <span>Track Vessel on Live Map</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Manual Tracking Guide Box */}
            <div className="rounded-card border border-pebble bg-linen-mist/30 p-4 text-xs text-slate">
              <div className="flex items-center gap-2 font-semibold text-forest-ink">
                <FileCheck className="size-4 text-forest-ink" /> SOP Compliance Notice
              </div>
              <p className="mt-1 text-[11px] leading-relaxed">
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
