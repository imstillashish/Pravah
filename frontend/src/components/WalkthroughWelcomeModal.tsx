import React, { useState, useEffect } from "react";
import { useTour } from "../context/TourContext";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Compass,
  ArrowRight,
  X,
  Building2,
} from "lucide-react";

interface WalkthroughWelcomeModalProps {
  currentView: string;
}

export const WalkthroughWelcomeModal: React.FC<WalkthroughWelcomeModalProps> = ({ currentView }) => {
  const { isTourActive, startTour } = useTour();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    // Show only on login, landing, or root views when tour is not active
    const isTargetView = currentView === "login" || currentView === "landing" || currentView === "";
    const hasSeen = localStorage.getItem("pravah_walkthrough_dismissed");

    if (isTargetView && !isTourActive && !hasSeen) {
      // Small timeout to allow UI to mount smoothly
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [currentView, isTourActive]);

  const handleStart = () => {
    setIsOpen(false);
    localStorage.setItem("pravah_walkthrough_dismissed", "true");
    startTour(0);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("pravah_walkthrough_dismissed", "true");
  };

  if (!isOpen || isTourActive) return null;

  return (
    <div
      role="dialog"
      aria-label="Welcome Walkthrough Invitation"
      aria-modal="true"
      className="fixed inset-0 z-[9985] flex items-center justify-center p-4 bg-obsidian/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-pebble bg-paper p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-full p-1 text-slate hover:bg-fog hover:text-charcoal transition-colors cursor-pointer"
          aria-label="Close welcome modal"
        >
          <X className="size-4" />
        </button>

        {/* Top Badges */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-forest-ink">
            <span className="size-1.5 rounded-full bg-lime-voltage animate-pulse" />
            SAIL LOGISTICS AI
          </span>
          <span className="rounded-full bg-linen-mist px-2.5 py-0.5 font-mono text-[10px] font-bold text-forest-ink">
            28-FEATURE TOUR
          </span>
        </div>

        {/* Header Content */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-forest-ink shrink-0" />
            <h2 className="font-sans text-xl font-bold tracking-tight text-obsidian sm:text-2xl">
              Welcome to PRAVAH
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-slate">
            Steel Authority of India's intelligent ocean freight forecasting and raw material procurement portal.
          </p>
        </div>

        {/* 3 Key Highlights Preview */}
        <div className="space-y-2.5 rounded-xl border border-pebble/80 bg-fog/60 p-3.5 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-lime-voltage text-forest-ink font-bold text-[10px]">
              <TrendingUp className="size-3" />
            </div>
            <div>
              <span className="font-semibold text-charcoal">Predictive Freight & Feasibility:</span>
              <p className="text-[11px] text-slate mt-0.5 leading-snug">
                ML quantile price forecasts (P10/P50/P90), bunker adjustments, and draft/LOA physical feasibility checks.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-paper text-signal-blue border border-pebble">
              <AlertTriangle className="size-3 text-signal-blue" />
            </div>
            <div>
              <span className="font-semibold text-charcoal">Disruptions & Stock-Out Radar:</span>
              <p className="text-[11px] text-slate mt-0.5 leading-snug">
                Maritime choke-point alerts, plant coal inventory depletion tracker, and multi-plant parcel pooling.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-paper text-emerald-profit border border-pebble">
              <Compass className="size-3 text-emerald-profit" />
            </div>
            <div>
              <span className="font-semibold text-charcoal">Governance & Nautical Telemetry:</span>
              <p className="text-[11px] text-slate mt-0.5 leading-snug">
                Immutable audit ledger, decision regret analysis, and interactive Great-Circle vessel tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate hover:text-charcoal transition-colors cursor-pointer"
          >
            Explore on My Own
          </button>

          <button
            type="button"
            onClick={handleStart}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-forest-ink px-5 py-2.5 text-xs font-bold text-paper shadow-md hover:bg-forest-ink/90 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="size-3.5 text-lime-voltage" />
            <span>Start Guided Walkthrough</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
