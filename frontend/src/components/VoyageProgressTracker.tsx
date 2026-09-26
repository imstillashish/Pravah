import React from "react";
import { Check } from "lucide-react";

export interface WizardStepItem {
  num: number;
  title: string;
  sub?: string;
}

export interface VoyageProgressTrackerProps {
  currentStep: number;
  onStepChange?: (newStep: number) => void;
  steps?: WizardStepItem[];
  showControls?: boolean;
  className?: string;
  isSubmitting?: boolean;
  onRunAnalysis?: () => void;
}

export const DEFAULT_STEPS: WizardStepItem[] = [
  { num: 1, title: "Cargo Type", sub: "Commodity Category" },
  { num: 2, title: "Cargo Details", sub: "Tonnage & Laycan" },
  { num: 3, title: "Ports & Route", sub: "Origin & Discharge" },
];

/**
 * Inline line-art cargo ship silhouette.
 * Features: raked bow, stern wheelhouse with cutout window, deck cargo containers,
 * radar mast, exhaust funnel, and waterline wave.
 */
export const SailingShipIcon: React.FC<{ className?: string }> = ({
  className = "w-9 h-6",
}) => (
  <svg
    viewBox="0 0 36 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Exhaust Funnel with lime accent tip */}
    <rect x="7" y="5" width="2.2" height="4" rx="0.5" fill="#163300" />
    <rect x="7" y="5" width="2.2" height="1.2" fill="#9fe870" />

    {/* Wheelhouse / Bridge at stern with hollow cutout window */}
    <path
      d="M5 9h6.5v6H5V9zm1.5 1.5h3.5v1.5H6.5v-1.5z"
      fill="#163300"
      fillRule="evenodd"
    />

    {/* Cargo Containers stacked on deck */}
    <rect x="13.5" y="10.5" width="5" height="4.5" rx="0.5" fill="#054d28" />
    <rect x="19.5" y="10.5" width="5" height="4.5" rx="0.5" fill="#9fe870" />
    <rect x="25.5" y="12" width="4.5" height="3" rx="0.5" fill="#054d28" />

    {/* Forward Mast */}
    <path d="M30 8v7" stroke="#163300" strokeWidth="1.2" strokeLinecap="round" />

    {/* Cargo Ship Hull (sailing west to east, bow facing right) */}
    <path
      d="M3 15h29a1.2 1.2 0 0 1 1.05.65l1.6 3.2a.8.8 0 0 1-.72 1.15H7.5a2.5 2.5 0 0 1-1.9-.88L2.5 16.2a.8.8 0 0 1 .5-1.2z"
      fill="#163300"
    />

    {/* Waterline Wave Accent */}
    <path
      d="M1 21.5c2 0 3-.7 5-.7s3 .7 5 .7 3-.7 5-.7 3 .7 5 .7 3-.7 5-.7"
      stroke="#9fe870"
      strokeWidth="1.4"
      strokeLinecap="round"
      opacity="0.9"
    />
  </svg>
);

/**
 * 5-Step Voyage Progress Tracker with a physically sailing ship.
 * The ship smoothly travels along the horizontal track between steps via a 1.8s cubic-bezier slide,
 * with gentle oceanic bobbing/rocking and synchronized track fill behind it.
 */
export const VoyageProgressTracker: React.FC<VoyageProgressTrackerProps> = ({
  currentStep,
  onStepChange,
  steps = DEFAULT_STEPS,
  showControls: _showControls = false,
  className = "",
  isSubmitting = false,
  onRunAnalysis: _onRunAnalysis,
}) => {
  const totalSteps = steps.length;
  // Progress fraction 0.0 to 1.0
  const progressRatio = Math.max(0, Math.min(1, (currentStep - 1) / (totalSteps - 1)));

  // CSS cubic-bezier for ~1.8s smooth voyage travel
  const easeTransition = "cubic-bezier(0.45, 0, 0.15, 1)";

  return (
    <div className={`w-full ${className}`}>
      {/* Tracker Bar Area */}
      <div className="relative pt-7 pb-2 px-3 sm:px-6">
        {/* Track Line Wrapper (aligned with centers of outer dots: 14px inset) */}
        <div className="relative h-1 w-full my-3">
          {/* Base Inactive Track */}
          <div className="absolute inset-y-0 left-[14px] right-[14px] rounded-full bg-pebble/30" />

          {/* Progress Fill Line (grows/shrinks in lockstep with the sailing ship) */}
          <div
            className="absolute inset-y-0 left-[14px] rounded-full bg-forest-ink"
            style={{
              width: `calc(${progressRatio} * (100% - 28px))`,
              transition: `width 1800ms ${easeTransition}`,
            }}
          />

          {/* The Sailing Ship: Sits on the active step and physically slides across the track */}
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `calc(14px + ${progressRatio} * (100% - 28px))`,
              transform: "translateX(-50%)",
              top: "-26px", // Positions ship directly on top of the step dot
              transition: `left 1800ms ${easeTransition}`,
            }}
            aria-hidden="true"
          >
            {/* Inner bobbing container (gentle rocking & wave swell while sailing) */}
            <div className="animate-ship-sail-bob filter drop-shadow-[0_2px_4px_rgba(22,51,0,0.25)]">
              <SailingShipIcon className="w-8 h-5.5 sm:w-9 sm:h-6" />
            </div>
          </div>
        </div>

        {/* 5 Step Dots & Labels */}
        <div className="relative flex items-start justify-between">
          {steps.map((s) => {
            const isDone = s.num < currentStep;
            const isCurrent = s.num === currentStep;

            return (
              <div
                key={s.num}
                className="flex flex-col items-center select-none"
                style={{ width: "28px" }}
              >
                {/* Step Circle / Dot */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onStepChange?.(s.num)}
                  aria-label={`Step ${s.num}: ${s.title}`}
                  title={`Step ${s.num}: ${s.title} (${
                    isDone ? "Completed" : isCurrent ? "Current Port" : "Upcoming"
                  })`}
                  className={`relative z-10 -mt-3.5 flex size-7 items-center justify-center rounded-full font-mono text-[11px] font-bold transition-all duration-500 cursor-pointer disabled:cursor-not-allowed ${
                    isDone
                      ? "bg-forest-ink text-lime-voltage shadow-xs hover:brightness-110 active:scale-95"
                      : isCurrent
                      ? "bg-lime-voltage text-forest-ink ring-4 ring-lime-voltage/40 shadow-[0_0_12px_rgba(159,232,112,0.65)] scale-105"
                      : "border-2 border-pebble/40 bg-paper text-slate hover:border-pebble hover:text-charcoal"
                  }`}
                >
                  {isDone ? (
                    <Check className="size-3.5 stroke-[3]" />
                  ) : (
                    <span>{s.num}</span>
                  )}
                </button>

                {/* Step Label below dot */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onStepChange?.(s.num)}
                  className="mt-2 flex flex-col items-center text-center cursor-pointer focus:outline-none"
                  style={{ width: "88px", marginLeft: "-30px", marginRight: "-30px" }}
                >
                  <span
                    className={`font-sans text-[11px] sm:text-xs leading-tight transition-colors duration-300 ${
                      isCurrent
                        ? "font-bold text-forest-ink"
                        : isDone
                        ? "font-semibold text-charcoal hover:text-forest-ink"
                        : "text-slate/75 hover:text-charcoal"
                    }`}
                  >
                    {s.title}
                  </span>
                  {s.sub && (
                    <span className="hidden sm:inline font-mono text-[9px] text-slate/70 mt-0.5">
                      {s.sub}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
};

export default VoyageProgressTracker;
