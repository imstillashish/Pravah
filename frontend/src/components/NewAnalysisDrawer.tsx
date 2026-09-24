import React, { useState, useEffect, useId, useRef, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Ship, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api";
import { AnimatedSvgChart } from "./AnimatedSvgChart";
import { PrimaryButton, SecondaryButton } from "./ui";
import { EASE_OUT, EASE_DRAWER } from "../lib/motion";
import { cx } from "../lib/cn";

export interface NewAnalysisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisCreated: () => void;
}

const ORIGIN_DATA: Record<string, string[]> = {
  Australia: ["Hay Point", "Newcastle", "Gladstone", "Abbot Point"],
  US: ["Hampton Roads", "Baltimore"],
  Mozambique: ["Maputo", "Beira"],
  Indonesia: ["Balikpapan", "Samarinda"],
  Russia: ["Vostochny", "Ust-Luga"],
};

const ORIGIN_PORT_SPECS: Record<string, { draft: number; dwt: number; queue: number; waitDays: number }> = {
  "Hay Point": { draft: 19.5, dwt: 220000, queue: 14, waitDays: 3.4 },
  "Newcastle": { draft: 15.2, dwt: 160000, queue: 16, waitDays: 3.8 },
  "Gladstone": { draft: 17.5, dwt: 180000, queue: 8, waitDays: 2.2 },
  "Abbot Point": { draft: 18.5, dwt: 200000, queue: 5, waitDays: 1.6 },
  "Hampton Roads": { draft: 15.2, dwt: 150000, queue: 6, waitDays: 1.8 },
  "Baltimore": { draft: 14.5, dwt: 120000, queue: 4, waitDays: 1.4 },
  "Maputo": { draft: 13.0, dwt: 85000, queue: 7, waitDays: 4.1 },
  "Beira": { draft: 10.5, dwt: 55000, queue: 5, waitDays: 3.6 },
  "Balikpapan": { draft: 13.5, dwt: 85000, queue: 6, waitDays: 2.1 },
  "Samarinda": { draft: 12.0, dwt: 75000, queue: 10, waitDays: 2.9 },
};

const MONTH_NAMES = [
  { value: 1, label: "January (Wet/Cyclone Season)" },
  { value: 2, label: "February (Cyclone Peak)" },
  { value: 3, label: "March (Post-Wet Normalization)" },
  { value: 4, label: "April (Pre-Monsoon Stocking)" },
  { value: 5, label: "May (Pre-Monsoon Peak Import)" },
  { value: 6, label: "June (SW Monsoon Onset)" },
  { value: 7, label: "July (Active SW Monsoon)" },
  { value: 8, label: "August (Monsoon Sea Swell)" },
  { value: 9, label: "September (Late Monsoon)" },
  { value: 10, label: "October (Post-Monsoon Peak)" },
  { value: 11, label: "November (Winter Restocking)" },
  { value: 12, label: "December (Winter Demand Surge)" },
];

const DISCHARGE_TERMINALS = [
  {
    value: "Paradip",
    label: "Paradip",
    draftNote: "Max 17.5m draft, Capesize/Panamax",
  },
  {
    value: "Vizag",
    label: "Vizag / Gangavaram",
    draftNote: "Max 18.1m draft, Capesize/Panamax",
  },
  {
    value: "Gopalpur",
    label: "Gopalpur",
    draftNote: "Max 14.5m draft, Panamax/Supramax",
  },
  {
    value: "Dhamra",
    label: "Dhamra",
    draftNote: "Max 18.0m draft, Capesize/Panamax",
  },
  {
    value: "Sagar-Sandheads",
    label: "Sagar-Sandheads",
    draftNote: "Transshipment point",
  },
  {
    value: "Haldia",
    label: "Haldia",
    draftNote: "Max 14.5m lock gate draft - warns against Capesize vessels!",
  },
];

const COMMODITIES = [
  { value: "Coking Coal", label: "Coking Coal (Metallurgical)" },
  { value: "Thermal Coal", label: "Thermal Coal" },
  { value: "PCI Coal", label: "PCI Coal" },
  { value: "Anthracite", label: "Anthracite" },
];

const TONNAGE_QUICK_CHIPS = [
  { label: "40,000 MT", vessel: "Handysize", value: 40000 },
  { label: "55,000 MT", vessel: "Supramax", value: 55000 },
  { label: "75,000 MT", vessel: "Panamax", value: 75000 },
  { label: "150,000 MT", vessel: "Capesize", value: 150000 },
];

/* Wise form-control recipe: Paper fill, Pebble border, Forest Ink focus. */
const INPUT_CLASS =
  "w-full rounded-card border border-pebble bg-paper px-3 py-2 text-sm " +
  "text-charcoal transition-colors duration-150 hover:border-charcoal " +
  "focus:border-forest-ink focus:outline-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-ink " +
  "focus-visible:ring-2 focus-visible:ring-forest-ink/20";

const FIELD_LABEL_CLASS =
  "mb-1 block font-mono text-xs font-semibold uppercase tracking-[0.08em] text-charcoal";
const GROUP_LABEL_CLASS =
  "block font-mono text-xs font-semibold uppercase tracking-[0.08em] text-charcoal";

export const NewAnalysisDrawer: React.FC<NewAnalysisDrawerProps> = ({
  isOpen,
  onClose,
  onAnalysisCreated,
}) => {
  const { token } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [originCountry, setOriginCountry] = useState<string>("Australia");
  const [originPort, setOriginPort] = useState<string>("Hay Point");
  const [destinationPort, setDestinationPort] = useState<string>("Paradip");
  const [laycanMonth, setLaycanMonth] = useState<number>(7);
  const [commodity, setCommodity] = useState<string>("Coking Coal");
  const [parcelTonnage, setParcelTonnage] = useState<number>(75000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const getSeasonalProfile = (month: number, destPort: string) => {
    if ([6, 7, 8].includes(month)) {
      return {
        name: "South-West Monsoon (Bay of Bengal)",
        factor: destPort.toLowerCase().includes("haldia") ? "1.31x" : "1.26x",
        alert: "⚠️ Rough sea swell reduces discharge rate by ~28%; offshore lightering at Sandheads suspended.",
        badgeColor: "bg-amber-wash text-amber-warning border-amber-warning/30",
      };
    }
    if ([1, 2].includes(month)) {
      return {
        name: "Queensland Wet & Cyclone Window",
        factor: "1.22x",
        alert: "⚠️ Potential loading berth/rail washouts at DBCT/Gladstone; elevated Capesize charter demand.",
        badgeColor: "bg-amber-wash text-amber-warning border-amber-warning/30",
      };
    }
    if ([11, 12].includes(month)) {
      return {
        name: "Asian Winter Restocking Surge",
        factor: "1.18x",
        alert: "⚡ Blast furnace coal replenishment across East Asia; tight Capesize vessel supply.",
        badgeColor: "bg-linen-mist text-signal-blue border-signal-blue/30",
      };
    }
    if ([4, 5].includes(month)) {
      return {
        name: "Pre-Monsoon Strategic Stocking",
        factor: "1.12x",
        alert: "📦 Accelerated procurement by Indian mills to build 30-day stockyard buffer.",
        badgeColor: "bg-emerald-wash text-emerald-profit border-emerald-profit/30",
      };
    }
    return {
      name: "Normal Navigation Climatology",
      factor: "1.05x",
      alert: "✅ Favorable weather window with high handling productivity and low queue risk.",
      badgeColor: "bg-fog text-charcoal border-pebble",
    };
  };

  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Reset originPort when originCountry changes
  const handleCountryChange = (country: string) => {
    setOriginCountry(country);
    const availablePorts = ORIGIN_DATA[country] || [];
    if (availablePorts.length > 0) {
      setOriginPort(availablePorts[0]);
    }
  };

  /* Focus management: move focus into the sheet on open, trap Tab while
     open, restore focus to the trigger on close. */
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement | null;

    const sheet = sheetRef.current;
    if (sheet) {
      const firstFocusable = sheet.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      firstFocusable?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;

      const focusables = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      triggerRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  // ponytail: real-time heuristic vessel calculation matching backend logic
  const getRecommendedVessel = (tonnage: number, destPort: string): string => {
    let vessel = "Handysize";
    if (tonnage >= 100000) vessel = "Capesize";
    else if (tonnage >= 60000) vessel = "Panamax";
    else if (tonnage >= 40000) vessel = "Supramax";

    if (destPort.toLowerCase().includes("haldia") && vessel === "Capesize") {
      vessel = tonnage >= 60000 ? "Panamax" : "Handysize";
    }
    return vessel;
  };

  const recommendedVessel = getRecommendedVessel(parcelTonnage, destinationPort);
  const isHaldiaAlert = destinationPort.toLowerCase().includes("haldia") && parcelTonnage > 60000;

  const handleSubmit = useCallback(
    async (status: "draft" | "finalized") => {
      if (!token) {
        setSubmitError("You must be logged in to create an analysis.");
        return;
      }
      if (!parcelTonnage || parcelTonnage <= 0) {
        setSubmitError("Please specify a valid cargo volume.");
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const res = await fetch(`${API_BASE}/analyses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            origin_country: originCountry,
            origin_port: originPort,
            destination_port: destinationPort,
            commodity,
            parcel_tonnage: parcelTonnage,
            status,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.detail || `Server responded with ${res.status}`);
        }

        onAnalysisCreated();
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create analysis.";
        setSubmitError(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      token,
      parcelTonnage,
      originCountry,
      originPort,
      destinationPort,
      commodity,
      onAnalysisCreated,
      onClose,
    ],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {/* Backdrop — Obsidian wash on the sheet */}
          <motion.div
            className="fixed inset-0 bg-obsidian/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: EASE_OUT }}
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
            <motion.div
              ref={sheetRef}
              className="relative flex h-full w-screen max-w-xl flex-col border-l border-pebble bg-paper shadow-xl"
              initial={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
              animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: EASE_DRAWER }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-pebble px-6 py-4">
                <div>
                  <div className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
                    SIMULATION CONSOLE
                  </div>
                  <h2 id={titleId} className="text-xl font-semibold leading-tight text-forest-ink">
                    Run New Analysis
                  </h2>
                  <p className="mt-0.5 text-xs text-charcoal">
                    Configure voyage parameters, parcel sizing, and terminal draft clearance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close drawer"
                  className="cursor-pointer rounded-full p-2 text-slate transition-colors duration-150 hover:bg-fog hover:text-forest-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-ink"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              {/* Form content */}
              <div className="flex-1 space-y-6 overflow-y-auto bg-paper p-6">
                {submitError && (
                  <div
                    role="alert"
                    className="flex items-center gap-3 rounded-card border border-pebble bg-fog p-3.5"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-5 shrink-0 items-center justify-center rounded-full border border-alarm-red/40 bg-paper font-mono text-xs font-semibold text-alarm-red"
                    >
                      !
                    </span>
                    <span className="text-xs font-semibold text-alarm-red">{submitError}</span>
                  </div>
                )}

                {/* Origin country & port */}
                <div className="space-y-3">
                  <span className={GROUP_LABEL_CLASS}>Origin Country &amp; Port</span>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="origin-country" className={FIELD_LABEL_CLASS}>
                        Country
                      </label>
                      <select
                        id="origin-country"
                        value={originCountry}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className={INPUT_CLASS}
                      >
                        {Object.keys(ORIGIN_DATA).map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="origin-port" className={FIELD_LABEL_CLASS}>
                        Port
                      </label>
                      <select
                        id="origin-port"
                        value={originPort}
                        onChange={(e) => setOriginPort(e.target.value)}
                        className={INPUT_CLASS}
                      >
                        {(ORIGIN_DATA[originCountry] || []).map((port) => (
                          <option key={port} value={port}>
                            {port}
                          </option>
                        ))}
                      </select>
                    </div>

                    {ORIGIN_PORT_SPECS[originPort] && (
                      <div className="col-span-2 flex flex-wrap items-center justify-between gap-1 rounded-lg border border-pebble bg-fog px-3 py-1.5 font-mono text-[11px] text-charcoal tabular-nums">
                        <span>Max Draft: <strong className="font-semibold text-forest-ink">{ORIGIN_PORT_SPECS[originPort].draft.toFixed(1)}m</strong></span>
                        <span className="text-pebble" aria-hidden="true">·</span>
                        <span>Max DWT: <strong className="font-semibold text-forest-ink">{ORIGIN_PORT_SPECS[originPort].dwt.toLocaleString()} MT</strong></span>
                        <span className="text-pebble" aria-hidden="true">·</span>
                        <span>Queue: <strong className="font-semibold text-forest-ink">{ORIGIN_PORT_SPECS[originPort].queue} ships (~{ORIGIN_PORT_SPECS[originPort].waitDays.toFixed(1)}d)</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Discharge terminal */}
                <div className="space-y-2">
                  <label htmlFor="destination-port" className={GROUP_LABEL_CLASS}>
                    Discharge Terminal (East Coast of India)
                  </label>
                  <select
                    id="destination-port"
                    value={destinationPort}
                    onChange={(e) => setDestinationPort(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    {DISCHARGE_TERMINALS.map((terminal) => (
                      <option key={terminal.value} value={terminal.value}>
                        {terminal.label} — {terminal.draftNote}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Laycan Window & Seasonal Demand-Supply Factor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="laycan-month" className={GROUP_LABEL_CLASS}>
                      Laycan Window (Seasonal Demand-Supply Factor)
                    </label>
                    <span className="font-mono text-xs font-semibold tabular-nums text-forest-ink">
                      Multiplier: {getSeasonalProfile(laycanMonth, destinationPort).factor}
                    </span>
                  </div>
                  <select
                    id="laycan-month"
                    value={laycanMonth}
                    onChange={(e) => setLaycanMonth(Number(e.target.value))}
                    className={INPUT_CLASS}
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <div
                    aria-live="polite"
                    className={cx("rounded-lg border p-2.5 text-xs transition-colors", getSeasonalProfile(laycanMonth, destinationPort).badgeColor)}
                  >
                    <div className="font-semibold">{getSeasonalProfile(laycanMonth, destinationPort).name}</div>
                    <div className="mt-0.5 text-[11px] opacity-90">{getSeasonalProfile(laycanMonth, destinationPort).alert}</div>
                  </div>
                </div>

                {/* Commodity */}
                <div className="space-y-2">
                  <label htmlFor="commodity" className={GROUP_LABEL_CLASS}>
                    Commodity Type
                  </label>
                  <select
                    id="commodity"
                    value={commodity}
                    onChange={(e) => setCommodity(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    {COMMODITIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cargo volume & quick chips */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="parcel-tonnage" className={GROUP_LABEL_CLASS}>
                      Cargo Volume (Metric Tonnes)
                    </label>
                    <span className="font-mono text-xs font-medium tabular-nums text-forest-ink">
                      {parcelTonnage.toLocaleString()} MT
                    </span>
                  </div>

                  <input
                    type="number"
                    id="parcel-tonnage"
                    min="10000"
                    max="300000"
                    step="1000"
                    value={parcelTonnage || ""}
                    onChange={(e) => setParcelTonnage(Number(e.target.value) || 0)}
                    className={cx(INPUT_CLASS, "font-mono tabular-nums")}
                    placeholder="Enter cargo volume e.g. 75000"
                  />

                  {/* Quick volume chips */}
                  <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
                    {TONNAGE_QUICK_CHIPS.map((chip) => {
                      const isSelected = parcelTonnage === chip.value;
                      return (
                        <button
                          key={chip.value}
                          type="button"
                          onClick={() => setParcelTonnage(chip.value)}
                          aria-pressed={isSelected}
                          className={cx(
                            "min-h-11 cursor-pointer rounded-card border px-2.5 py-2 text-left transition duration-150 active:scale-[0.98]",
                            isSelected
                              ? "border-forest-ink bg-linen-mist ring-1 ring-forest-ink"
                              : "border-pebble bg-paper hover:border-forest-ink hover:bg-fog/60 active:bg-fog",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-ink",
                          )}
                        >
                          <div className="font-mono text-xs font-medium tabular-nums text-forest-ink">
                            {chip.label}
                          </div>
                          <div
                            className={cx(
                              "mt-0.5 font-mono text-[10px] tabular-nums",
                              isSelected ? "font-semibold text-forest-ink" : "text-charcoal",
                            )}
                          >
                            {chip.vessel}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Real-time heuristic feedback */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-3 rounded-card border border-pebble bg-paper p-4">
                    <div className="flex items-center justify-between">
                      <span className={GROUP_LABEL_CLASS}>Vessel Recommendation</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-linen-mist px-2.5 py-1 font-mono text-xs font-medium text-forest-ink">
                        <Ship className="size-3.5 text-forest-ink" aria-hidden="true" />
                        <span>{recommendedVessel}</span>
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-charcoal">
                      Based on{" "}
                      <span className="font-mono font-medium tabular-nums text-forest-ink">
                        {parcelTonnage.toLocaleString()} MT
                      </span>{" "}
                      shipment to {destinationPort}, the algorithm identifies{" "}
                      <strong className="font-semibold text-forest-ink">{recommendedVessel}</strong> as
                      the optimal bulk carrier envelope.
                    </p>

                    <div className="mt-3 border-t border-pebble pt-3">
                      <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
                        <span>Forward Rate Trajectory</span>
                        <span>30-DAY MODEL</span>
                      </div>
                      <AnimatedSvgChart
                        key={`${originCountry}-${originPort}-${destinationPort}-${parcelTonnage}`}
                        variant="forecast"
                        height={72}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Haldia lock-gate draft advisory — a hazard, not a hue */}
                  <AnimatePresence>
                    {isHaldiaAlert && (
                      <motion.div
                        role="alert"
                        className="flex items-start gap-3 rounded-card border border-pebble bg-fog p-4"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.18,
                          ease: EASE_OUT,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-alarm-red/40 bg-paper font-mono text-xs font-semibold text-alarm-red"
                        >
                          !
                        </span>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-alarm-red">
                            Terminal Draft Advisory
                          </div>
                          <p className="leading-relaxed text-charcoal">
                            Haldia port lock-gate has a 14.5m maximum permissible draft. Parcel
                            will require transshipment at Sagar-Sandheads or lighter vessel sizing.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex flex-col items-center justify-end gap-3 border-t border-pebble bg-paper px-6 py-4 sm:flex-row">
                <SecondaryButton
                  disabled={isSubmitting}
                  onClick={() => handleSubmit("draft")}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      <span>Saving…</span>
                    </span>
                  ) : (
                    "Save as Draft"
                  )}
                </SecondaryButton>

                <PrimaryButton
                  disabled={isSubmitting}
                  onClick={() => handleSubmit("finalized")}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      <span>Recording Forecast…</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle className="size-4" aria-hidden="true" />
                      <span>Finalize &amp; Record Forecast</span>
                    </span>
                  )}
                </PrimaryButton>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
