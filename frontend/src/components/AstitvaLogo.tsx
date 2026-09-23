import React from "react";

interface AstitvaLogoProps {
  className?: string;
  size?: number;
  variant?: "mark-only" | "full" | "inverse";
  subtitle?: boolean;
}

/**
 * Astitva Brand Logo:
 * - Option 1: Maritime Horizon & Predictive Delta (Forward prow cutting water + Letter 'A' chevron)
 * - Forest Ink (#163300) authority + Lime Voltage (#9fe870) forward velocity
 */
export const AstitvaLogo: React.FC<AstitvaLogoProps> = ({
  className = "",
  size = 32,
  variant = "mark-only",
  subtitle = true,
}) => {
  const isInverse = variant === "inverse";

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <rect
        width="64"
        height="64"
        rx="16"
        fill={isInverse ? "#9fe870" : "#163300"}
      />
      {/* Outer Vessel Bow Chevron 'A' */}
      <path
        d="M32 9L51.5 48H41.5L32 29L22.5 48H12.5L32 9Z"
        fill={isInverse ? "#163300" : "#ffffff"}
      />
      {/* Inner Predictive Delta Arrow */}
      <path
        d="M32 20L43 44H36.2L32 35L27.8 44H21L32 20Z"
        fill={isInverse ? "#054d28" : "#9fe870"}
      />
      {/* Dynamic Waterline & Draft Indicator */}
      <rect
        x="23"
        y="49.5"
        width="18"
        height="3.5"
        rx="1.75"
        fill={isInverse ? "#163300" : "#9fe870"}
      />
    </svg>
  );

  if (variant === "mark-only") {
    return <div className={`inline-flex items-center ${className}`}>{mark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {mark}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-semibold tracking-tight text-base ${
              isInverse ? "text-paper" : "text-forest-ink"
            }`}
          >
            Astitva
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-lime-voltage/20 text-forest-ink font-medium">
            SAIL
          </span>
        </div>
        {subtitle && (
          <span
            className={`font-mono text-[9px] uppercase tracking-[0.08em] mt-0.5 ${
              isInverse ? "text-paper/70" : "text-slate"
            }`}
          >
            Intelligent Freight Portal
          </span>
        )}
      </div>
    </div>
  );
};

export default AstitvaLogo;
