import React, { useState } from "react";
import { Navigation, Anchor, Compass, ShieldCheck, AlertCircle } from "lucide-react";

interface PortInfo {
  id: string;
  name: string;
  locode: string;
  lat: number;
  lon: number;
  maxDraft: number;
  maxDwt: number;
  isDestination?: boolean;
  isOrigin?: boolean;
  notes: string;
}

const VERIFIED_PORTS: PortInfo[] = [
  {
    id: "INPRT",
    name: "Paradip Port",
    locode: "INPRT",
    lat: 20.3167,
    lon: 86.6167,
    maxDraft: 16.5,
    maxDwt: 125000,
    isDestination: true,
    notes: "Primary SAIL Coking Coal Terminal — Max draft 16.5m restricts laden Capesize",
  },
  {
    id: "INDHM",
    name: "Dhamra Port",
    locode: "INDHM",
    lat: 20.8333,
    lon: 86.9667,
    maxDraft: 18.0,
    maxDwt: 180000,
    notes: "Deep-draft Capesize capable alternative terminal",
  },
  {
    id: "INGGV",
    name: "Gangavaram Port",
    locode: "INGGV",
    lat: 17.625,
    lon: 83.235,
    maxDraft: 19.5,
    maxDwt: 200000,
    notes: "Deepest multi-purpose bulk terminal on East Coast",
  },
  {
    id: "INHLD",
    name: "Haldia Dock Complex",
    locode: "INHLD",
    lat: 22.02,
    lon: 88.06,
    maxDraft: 14.5,
    maxDwt: 65000,
    notes: "Riverine draft-restricted port — Handysize/Supramax only",
  },
];

interface RouteMapProps {
  originName?: string;
  destinationName?: string;
  distanceNm?: number;
  className?: string;
  interactive?: boolean;
  shipProgress?: number;
  shipPositionText?: string;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  originName = "Newcastle, AU (AUNCL)",
  destinationName = "Paradip, IN (INPRT)",
  distanceNm = 5832,
  className = "",
  shipProgress,
  shipPositionText,
}) => {
  const [selectedPort, setSelectedPort] = useState<PortInfo>(VERIFIED_PORTS[0]);
  const [zoomLevel, setZoomLevel] = useState<"corridor" | "bay">("corridor");

  const t = typeof shipProgress === "number" ? Math.max(0, Math.min(1, shipProgress)) : 0.52;
  const shipX = (1 - t) * (1 - t) * 720 + 2 * (1 - t) * t * 420 + t * t * 205;
  const shipY = (1 - t) * (1 - t) * 230 + 2 * (1 - t) * t * 280 + t * t * 130;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-pebble bg-paper shadow-sm ${className}`}
    >
      {/* Map Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-pebble bg-linen-mist/40 px-4 py-2.5 text-xs text-charcoal">
        <div className="flex items-center gap-2 font-medium">
          <Navigation className="size-4 text-forest-ink" />
          <span>Maritime Sailing Corridor & Port Constraints</span>
          <span className="rounded-full bg-forest-ink/10 px-2 py-0.5 font-mono text-[10px] text-forest-ink">
            Great-Circle Approximation
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-pebble bg-paper p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel("corridor")}
              className={`rounded px-2 py-1 text-[11px] transition-colors ${
                zoomLevel === "corridor"
                  ? "bg-forest-ink font-medium text-paper"
                  : "text-slate hover:text-forest-ink"
              }`}
            >
              Voyage Route
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel("bay")}
              className={`rounded px-2 py-1 text-[11px] transition-colors ${
                zoomLevel === "bay"
                  ? "bg-forest-ink font-medium text-paper"
                  : "text-slate hover:text-forest-ink"
              }`}
            >
              East Coast Ports (Zoom)
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Viewport (Interactive SVG Canvas) */}
      <div className="relative h-80 w-full bg-[#0b192c] select-none">
        {/* Ocean Background Grid */}
        <svg
          className="absolute inset-0 size-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="nautical-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1"
              />
            </pattern>
            <linearGradient id="route-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#nautical-grid)" />

          {zoomLevel === "corridor" ? (
            /* Global Trans-Ocean Corridor Mode */
            <g>
              {/* Coastline simplified silhouettes */}
              {/* Australian East Coast silhouette representation */}
              <path
                d="M 680 280 Q 720 220 740 180 T 780 120"
                fill="none"
                stroke="rgba(148, 163, 184, 0.25)"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              {/* Indian East Coast silhouette representation */}
              <path
                d="M 160 30 Q 180 80 200 130 T 230 200 T 220 260"
                fill="none"
                stroke="rgba(148, 163, 184, 0.3)"
                strokeWidth="2"
              />

              {/* Great Circle Sailing Route Arc */}
              <path
                d="M 720 230 Q 420 280 205 130"
                fill="none"
                stroke="url(#route-gradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="6 3"
              />

              {/* Animated Cargo Vessel Icon */}
              <g transform={`translate(${shipX}, ${shipY})`}>
                <circle r="14" fill="rgba(56, 189, 248, 0.25)" className="animate-ping" />
                <circle r="7" fill="#38bdf8" />
                <text
                  x="12"
                  y="4"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  className="tracking-wider"
                >
                  {shipPositionText || `MV OCEAN PRIDE (${Math.round(t * 100)}% ETA)`}
                </text>
              </g>

              {/* Origin Marker (Newcastle, AU) */}
              <g transform="translate(720, 230)" className="cursor-pointer">
                <circle r="8" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                <circle r="16" fill="rgba(245, 158, 11, 0.2)" className="animate-pulse" />
                <text x="14" y="4" fill="#fbbf24" fontSize="11" fontWeight="bold">
                  ORIGIN: Newcastle (AU)
                </text>
                <text x="14" y="16" fill="#94a3b8" fontSize="9">
                  -32.9° S, 151.8° E
                </text>
              </g>

              {/* Destination Marker (Paradip, IN) */}
              <g
                transform="translate(205, 130)"
                className="cursor-pointer"
                onClick={() => setSelectedPort(VERIFIED_PORTS[0])}
              >
                <circle r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                <circle r="18" fill="rgba(16, 185, 129, 0.25)" className="animate-ping" />
                <text x="-120" y="-8" fill="#34d399" fontSize="12" fontWeight="bold">
                  DESTINATION: Paradip (IN)
                </text>
                <text x="-120" y="5" fill="#94a3b8" fontSize="9">
                  Draft Limit: 16.5m
                </text>
              </g>
            </g>
          ) : (
            /* East Coast Ports Regional Detail Mode */
            <g>
              {/* Detailed Coastline Arc */}
              <path
                d="M 280 20 Q 320 80 340 140 T 360 220 T 330 300"
                fill="none"
                stroke="rgba(148, 163, 184, 0.4)"
                strokeWidth="3"
              />

              {/* Haldia */}
              <g
                transform="translate(370, 60)"
                className="cursor-pointer"
                onClick={() => setSelectedPort(VERIFIED_PORTS[3])}
              >
                <circle
                  r={selectedPort.id === "INHLD" ? 9 : 6}
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text x="14" y="4" fill="#f87171" fontSize="11" fontWeight="500">
                  Haldia (14.5m)
                </text>
              </g>

              {/* Dhamra */}
              <g
                transform="translate(355, 110)"
                className="cursor-pointer"
                onClick={() => setSelectedPort(VERIFIED_PORTS[1])}
              >
                <circle
                  r={selectedPort.id === "INDHM" ? 9 : 6}
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text x="14" y="4" fill="#7dd3fc" fontSize="11" fontWeight="500">
                  Dhamra (18.0m)
                </text>
              </g>

              {/* Paradip */}
              <g
                transform="translate(345, 155)"
                className="cursor-pointer"
                onClick={() => setSelectedPort(VERIFIED_PORTS[0])}
              >
                <circle
                  r={selectedPort.id === "INPRT" ? 10 : 7}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle r="18" fill="rgba(16, 185, 129, 0.2)" className="animate-ping" />
                <text x="16" y="4" fill="#34d399" fontSize="12" fontWeight="bold">
                  ★ Paradip (16.5m) — Primary
                </text>
              </g>

              {/* Gangavaram */}
              <g
                transform="translate(310, 230)"
                className="cursor-pointer"
                onClick={() => setSelectedPort(VERIFIED_PORTS[2])}
              >
                <circle
                  r={selectedPort.id === "INGGV" ? 9 : 6}
                  fill="#818cf8"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text x="14" y="4" fill="#a5b4fc" fontSize="11" fontWeight="500">
                  Gangavaram (19.5m)
                </text>
              </g>
            </g>
          )}
        </svg>

        {/* Distance Badge Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 rounded-lg border border-white/10 bg-slate-900/80 p-2.5 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <Compass className="size-3.5 text-sky-400" />
            <span>{distanceNm.toLocaleString()} Nautical Miles</span>
          </div>
          <span className="text-[10px] text-slate-400">
            Route: {originName.split(" ")[0]} → {destinationName.split(" ")[0]}
          </span>
        </div>

        {/* Quick Legend Overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/80 px-3 py-1.5 text-[10px] text-slate-300 backdrop-blur-md">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" /> Destination Port
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-500" /> Origin Port
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-sky-400" /> Alternate Ports
          </span>
        </div>
      </div>

      {/* Port Specification Details Drawer */}
      <div className="border-t border-pebble bg-paper p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Anchor className="size-4 text-forest-ink" />
            <h4 className="font-semibold text-charcoal">{selectedPort.name}</h4>
            <span className="rounded bg-fog px-1.5 py-0.5 font-mono text-[10px] text-slate">
              LOCODE: {selectedPort.locode}
            </span>
            {selectedPort.isDestination && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                <ShieldCheck className="size-3" /> Target Analysis Port
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate">Max Draft: </span>
              <strong className="font-mono text-charcoal">{selectedPort.maxDraft} m</strong>
            </div>
            <div>
              <span className="text-slate">Max DWT: </span>
              <strong className="font-mono text-charcoal">{selectedPort.maxDwt.toLocaleString()} MT</strong>
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate">{selectedPort.notes}</p>

        {/* Constraint Warning for Paradip */}
        {selectedPort.id === "INPRT" && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-900">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-700" />
            <span>
              <strong>Draft Restriction Notice:</strong> Paradip's 16.5m maximum permissible draught requires Capesize vessels (18.2m draft) to undergo offshore lightering or diverts to Panamax class (recommended).
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteMap;
