import React from "react";

export type ShipLegStatus = "completed" | "active" | "upcoming";

export interface ShipConnectorProps {
  status: ShipLegStatus;
  title?: string;
  className?: string;
}

/**
 * Line-art cargo ship connector icon for the Interactive Voyage Analysis Wizard.
 * Replaces plain dashes ("—") between step circles so it visually represents a ship sailing
 * along the progress path from one step to the next.
 *
 * States:
 * - "completed": solid dark green (#163300), fully opaque (leg already completed).
 * - "active": green, slightly animated with subtle 2.5s left-to-right drift & bobbing (active sailing leg).
 * - "upcoming": light gray, low opacity, static (future leg).
 */
export const ShipConnector: React.FC<ShipConnectorProps> = ({
  status,
  title,
  className = "",
}) => {
  const getStatusClasses = () => {
    switch (status) {
      case "completed":
        return "text-forest-ink opacity-100";
      case "active":
        return "text-forest-ink opacity-95 animate-ship-drift";
      case "upcoming":
      default:
        return "text-pebble opacity-35";
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 px-1 sm:px-1.5 select-none transition-all duration-300 ${className}`}
      aria-hidden="true"
      title={title}
    >
      <svg
        viewBox="0 0 32 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`h-4 w-6 sm:h-4.5 sm:w-7 transition-colors duration-300 ${getStatusClasses()}`}
      >
        {/* Exhaust Funnel */}
        <path d="M5.5 5h2v3h-2V5z" fill="currentColor" />

        {/* Bridge / Wheelhouse at Stern with cutout window */}
        <path
          d="M4 8h5.5v5H4V8zm1.5 1.5h2.5v1.2H5.5V9.5z"
          fill="currentColor"
          fillRule="evenodd"
        />

        {/* Cargo Container Stacks */}
        <rect x="11" y="9" width="4.5" height="4" rx="0.5" fill="currentColor" />
        <rect x="16.5" y="9" width="4.5" height="4" rx="0.5" fill="currentColor" />
        <rect x="22" y="10.5" width="4" height="2.5" rx="0.5" fill="currentColor" />

        {/* Forward Mast */}
        <path d="M26.5 7.5v5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />

        {/* Ship Hull (Sailing Left-to-Right) */}
        <path
          d="M2.5 13h25.8a1.2 1.2 0 0 1 1.05.65l1.6 3.1a.8.8 0 0 1-.72 1.15H6.5a2.5 2.5 0 0 1-1.9-.88L2 14.2a.8.8 0 0 1 .5-1.2z"
          fill="currentColor"
        />

        {/* Water Surface Waves / Wake */}
        <path
          d="M1 19.5c1.8 0 2.8-.8 4.6-.8s2.8.8 4.6.8 2.8-.8 4.6-.8 2.8.8 4.6.8 2.8-.8 4.6-.8 2.8.8 4.6.8 1.8-.8 2-.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
    </div>
  );
};

export default ShipConnector;
