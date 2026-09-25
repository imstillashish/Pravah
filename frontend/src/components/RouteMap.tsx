import React, { useState, useEffect } from "react";
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
  const cleanOrigin = originName.replace(/\s*\([^)]*\)/g, "").trim();
  const cleanDest = destinationName.replace(/\s*\([^)]*\)/g, "").trim();
  const isCircularRoute = cleanOrigin.toLowerCase() === cleanDest.toLowerCase();

  const [selectedPort, setSelectedPort] = useState<PortInfo>(() => {
    const match = VERIFIED_PORTS.find(
      (p) =>
        destinationName.toLowerCase().includes(p.name.toLowerCase()) ||
        destinationName.toLowerCase().includes(p.id.toLowerCase()) ||
        p.name.toLowerCase().includes(cleanDest.toLowerCase()) ||
        cleanDest.toLowerCase().includes(p.name.toLowerCase()),
    );
    return match || VERIFIED_PORTS[0];
  });

  useEffect(() => {
    const match = VERIFIED_PORTS.find(
      (p) =>
        destinationName.toLowerCase().includes(p.name.toLowerCase()) ||
        destinationName.toLowerCase().includes(p.id.toLowerCase()) ||
        p.name.toLowerCase().includes(cleanDest.toLowerCase()) ||
        cleanDest.toLowerCase().includes(p.name.toLowerCase()),
    );
    if (match) {
      setSelectedPort(match);
    }
  }, [destinationName, cleanDest]);

  const [zoomLevel, setZoomLevel] = useState<"corridor" | "bay">("corridor");

  const t = typeof shipProgress === "number" ? Math.max(0, Math.min(1, shipProgress)) : 0.52;
  const shipX = (1 - t) * (1 - t) * 720 + 2 * (1 - t) * t * 420 + t * t * 205;
  const shipY = (1 - t) * (1 - t) * 230 + 2 * (1 - t) * t * 280 + t * t * 130;

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-pebble bg-paper ${className}`}
    >
      {/* Map Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-pebble bg-linen-mist/50 px-4 py-2.5 text-xs text-charcoal">
        <div className="flex items-center gap-2 font-semibold">
          <Navigation className="size-4 text-forest-ink" aria-hidden="true" />
          <span className="text-forest-ink">Maritime Sailing Corridor & Port Constraints</span>
          <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-forest-ink">
            Great-Circle Approximation
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-pebble bg-paper p-0.5" role="group" aria-label="Map view mode">
            <button
              type="button"
              onClick={() => setZoomLevel("corridor")}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:outline-none ${
                zoomLevel === "corridor"
                  ? "bg-forest-ink font-semibold text-paper shadow-xs"
                  : "text-charcoal hover:bg-fog hover:text-forest-ink"
              }`}
            >
              Voyage Route
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel("bay")}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:outline-none ${
                zoomLevel === "bay"
                  ? "bg-forest-ink font-semibold text-paper shadow-xs"
                  : "text-charcoal hover:bg-fog hover:text-forest-ink"
              }`}
            >
              East Coast Ports (Zoom)
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Viewport (Interactive SVG Canvas with Strict Oceanic Abyss #07192f) */}
      <div className="relative h-80 w-full bg-[#07192f] select-none" role="region" aria-label="Interactive maritime navigation map">
        {/* Ocean Background Grid */}
        <svg
          className="absolute inset-0 size-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Maritime sailing route from ${originName} to ${destinationName}`}
        >
          <defs>
            <pattern id="nautical-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(56, 189, 248, 0.08)"
                strokeWidth="1"
              />
            </pattern>
            <linearGradient id="route-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#nautical-grid)" />

          {zoomLevel === "corridor" ? (
            /* Global Trans-Ocean Corridor Mode */
            <g>
              {/* Australian East Coast silhouette representation */}
              <path
                d="M 680 280 Q 720 220 740 180 T 780 120"
                fill="none"
                stroke="rgba(203, 213, 225, 0.35)"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              {/* Indian East Coast silhouette representation */}
              <path
                d="M 160 30 Q 180 80 200 130 T 230 200 T 220 260"
                fill="none"
                stroke="rgba(56, 189, 248, 0.45)"
                strokeWidth="2.5"
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
              <g transform={`translate(${shipX}, ${shipY})`} aria-label="Current Vessel Position">
                <circle r="14" fill="rgba(56, 189, 248, 0.3)" className="animate-ping" />
                <circle r="7" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                <text
                  x="12"
                  y="4"
                  fill="#f1f5f9"
                  fontSize="11"
                  fontFamily="IBM Plex Mono, monospace"
                  fontWeight="600"
                  className="tracking-wider tabular-nums drop-shadow"
                >
                  {shipPositionText || `MV OCEAN PRIDE (${Math.round(t * 100)}% ETA)`}
                </text>
              </g>

              {/* Origin Marker */}
              <g
                transform="translate(720, 230)"
                className="cursor-pointer focus:outline-none"
                tabIndex={0}
                role="button"
                aria-label={`Origin: ${cleanOrigin}`}
              >
                <circle r="8" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                <circle r="16" fill="rgba(245, 158, 11, 0.25)" className="animate-pulse" />
                <text x="14" y="4" fill="#fde68a" fontSize="11" fontWeight="bold">
                  ORIGIN: {cleanOrigin}
                </text>
                <text x="14" y="18" fill="#e2e8f0" fontSize="9" fontFamily="IBM Plex Mono, monospace">
                  Loading Port Terminal
                </text>
              </g>

              {/* Destination Marker */}
              <g
                transform="translate(205, 130)"
                className="cursor-pointer focus:outline-none"
                tabIndex={0}
                role="button"
                aria-label={`Destination: ${cleanDest}, Draft limit ${selectedPort.maxDraft}m`}
                onClick={() => setSelectedPort(selectedPort)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedPort(selectedPort);
                  }
                }}
              >
                <circle
                  r={9}
                  fill={isCircularRoute ? "#ef4444" : "#047857"}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle
                  r={18}
                  fill={isCircularRoute ? "rgba(239, 68, 68, 0.3)" : "rgba(4, 120, 87, 0.3)"}
                  className="animate-ping"
                />
                <text
                  x="-135"
                  y="-8"
                  fill={isCircularRoute ? "#f87171" : "#a7f3d0"}
                  fontSize={12}
                  fontWeight="bold"
                >
                  DESTINATION: {cleanDest}
                </text>
                <text x="-135" y="6" fill="#f1f5f9" fontSize={10} fontFamily="IBM Plex Mono, monospace">
                  Draft Limit: {selectedPort.maxDraft}m
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
                stroke="rgba(203, 213, 225, 0.45)"
                strokeWidth="3"
              />

              {/* Haldia */}
              <g
                transform="translate(370, 60)"
                className="cursor-pointer focus:outline-none"
                tabIndex={0}
                role="button"
                aria-label="Haldia Port, max draft 14.5m"
                onClick={() => setSelectedPort(VERIFIED_PORTS[3])}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedPort(VERIFIED_PORTS[3]);
                }}
              >
                <circle
                  r={selectedPort.id === "INHLD" ? 9 : 6}
                  fill="#be123c"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text x="14" y="4" fill="#fca5a5" fontSize="11" fontWeight="600">
                  Haldia (14.5m)
                </text>
              </g>

              {/* Dhamra */}
              <g
                transform="translate(355, 110)"
                className="cursor-pointer focus:outline-none"
                tabIndex={0}
                role="button"
                aria-label="Dhamra Port, max draft 18.0m"
                onClick={() => setSelectedPort(VERIFIED_PORTS[1])}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedPort(VERIFIED_PORTS[1]);
                }}
              >
                <circle
                  r={selectedPort.id === "INDHM" ? 9 : 6}
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text x="14" y="4" fill="#7dd3fc" fontSize="11" fontWeight="600">
                  Dhamra (18.0m)
                </text>
              </g>

              {/* Paradip */}
              <g
                transform="translate(345, 155)"
                className="cursor-pointer focus:outline-none"
                tabIndex={0}
                role="button"
                aria-label="Paradip Port primary terminal, max draft 16.5m"
                onClick={() => setSelectedPort(VERIFIED_PORTS[0])}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedPort(VERIFIED_PORTS[0]);
                }}
              >
                <circle
                  r={selectedPort.id === "INPRT" ? 10 : 7}
                  fill="#047857"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle r="18" fill="rgba(4, 120, 87, 0.25)" className="animate-ping" />
                <text x="16" y="4" fill="#a7f3d0" fontSize="12" fontWeight="bold">
                  ★ Paradip (16.5m) — Primary
                </text>
              </g>

              {/* Gangavaram */}
              <g
                transform="translate(310, 230)"
                className="cursor-pointer focus:outline-none"
                tabIndex={0}
                role="button"
                aria-label="Gangavaram Port, max draft 19.5m"
                onClick={() => setSelectedPort(VERIFIED_PORTS[2])}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedPort(VERIFIED_PORTS[2]);
                }}
              >
                <circle
                  r={selectedPort.id === "INGGV" ? 9 : 6}
                  fill="#818cf8"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text x="14" y="4" fill="#c7d2fe" fontSize="11" fontWeight="600">
                  Gangavaram (19.5m)
                </text>
              </g>
            </g>
          )}
        </svg>

        {/* Distance Badge Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 rounded-card border border-pebble/30 bg-forest-ink/90 p-2.5 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-paper">
            <Compass className={`size-3.5 ${isCircularRoute ? "text-amber-warning" : "text-lime-voltage"}`} />
            <span className="font-mono tabular-nums">
              {isCircularRoute
                ? "0.0 Nautical Miles (Invalid Corridor)"
                : `${distanceNm.toLocaleString()} Nautical Miles`}
            </span>
          </div>
          <span className="text-[10px] text-fog">
            Route: {cleanOrigin} → {cleanDest}
          </span>
          {isCircularRoute && (
            <span className="rounded bg-alarm-red/20 px-1.5 py-0.5 text-[9px] font-semibold text-alarm-red">
              ⚠️ Identical Origin &amp; Destination Terminal
            </span>
          )}
        </div>

        {/* Quick Legend Overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-card border border-pebble/30 bg-forest-ink/90 px-3 py-1.5 text-[10px] text-fog backdrop-blur-md">
          <span className="flex items-center gap-1.5 text-paper">
            <span className="size-2 rounded-full bg-emerald-profit" /> Destination Port
          </span>
          <span className="flex items-center gap-1.5 text-paper">
            <span className="size-2 rounded-full bg-amber-warning" /> Origin Port
          </span>
          <span className="flex items-center gap-1.5 text-paper">
            <span className="size-2 rounded-full bg-lime-voltage" /> Alternate Ports
          </span>
        </div>
      </div>

      {/* Port Specification Details Drawer */}
      <div className="border-t border-pebble bg-paper p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Anchor className="size-4 text-forest-ink" aria-hidden="true" />
            <h4 className="font-bold text-forest-ink">{selectedPort.name}</h4>
            <span className="rounded-full bg-fog px-2 py-0.5 font-mono text-[10px] font-semibold text-charcoal border border-pebble">
              LOCODE: {selectedPort.locode}
            </span>
            {selectedPort.isDestination && (
              <span className="flex items-center gap-1 rounded-full bg-linen-mist px-2.5 py-0.5 text-[10px] font-semibold text-forest-ink border border-forest-ink/20">
                <ShieldCheck className="size-3" aria-hidden="true" /> Target Analysis Port
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div>
              <span className="text-slate">Max Draft: </span>
              <strong className="font-mono tabular-nums text-forest-ink">{selectedPort.maxDraft.toFixed(1)} m</strong>
            </div>
            <div>
              <span className="text-slate">Max DWT: </span>
              <strong className="font-mono tabular-nums text-forest-ink">{selectedPort.maxDwt.toLocaleString()} MT</strong>
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs text-charcoal leading-relaxed">{selectedPort.notes}</p>

        {/* Constraint Warning for Paradip */}
        {selectedPort.id === "INPRT" && (
          <div className="mt-2.5 flex items-start gap-2 rounded-card border border-pebble bg-linen-mist/50 p-2.5 text-xs text-forest-ink">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-forest-ink" aria-hidden="true" />
            <span>
              <strong className="font-bold">Draft Restriction Notice:</strong> Paradip's 16.5m maximum permissible draught requires Capesize vessels (18.2m draft) to undergo offshore lightering or diverts to Panamax class (recommended).
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteMap;
