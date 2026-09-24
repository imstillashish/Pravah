import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "../api/client";
import { RouteMap } from "../components/RouteMap";
import { MaritimeGlobe } from "../components/MaritimeGlobe";
import {
  Ship,
  Navigation,
  AlertTriangle,
  Compass,
  Clock,
  Gauge,
  RotateCcw,
  Play,
  Pause,
  Anchor,
  Radio,
  Globe2,
  Map as MapIcon,
  Fuel,
  Waves,
  Eye,
  Building,
} from "lucide-react";
import { Pill } from "../components/ui";

interface RouteData {
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
  estimated_distance_nm: number;
  note?: string;
}

interface ShipPositionData {
  current_lat: number;
  current_lon: number;
  progress_pct: number;
  note?: string;
}

interface PortStatusInfo {
  id: string;
  name: string;
  locode: string;
  maxDraftM: number;
  waitingVessels: number;
  avgWaitDays: number;
  berthStatus: string;
  isTarget: boolean;
  statusLevel: "optimal" | "warning" | "restricted";
  notes: string;
}

const EAST_COAST_PORTS: PortStatusInfo[] = [
  {
    id: "INPRT",
    name: "Paradip Port",
    locode: "INPRT",
    maxDraftM: 16.5,
    waitingVessels: 4,
    avgWaitDays: 2.2,
    berthStatus: "SAIL Mechanized Berth #2 Available",
    isTarget: true,
    statusLevel: "warning",
    notes: "Designated primary SAIL discharge port. Draft restricted to 16.5m (slack water).",
  },
  {
    id: "INDHM",
    name: "Dhamra Port",
    locode: "INDHM",
    maxDraftM: 18.0,
    waitingVessels: 1,
    avgWaitDays: 0.8,
    berthStatus: "Capesize Bulk Berth #1 Open",
    isTarget: false,
    statusLevel: "optimal",
    notes: "Deep-draft all-weather port. Fully laden Capesize permissible without lightering.",
  },
  {
    id: "INGGV",
    name: "Gangavaram Port",
    locode: "INGGV",
    maxDraftM: 19.5,
    waitingVessels: 2,
    avgWaitDays: 1.1,
    berthStatus: "Deepwater Multipurpose Terminal",
    isTarget: false,
    statusLevel: "optimal",
    notes: "Deepest multi-cargo port in India. Excellent handling speeds for Panamax/Cape.",
  },
  {
    id: "INHLD",
    name: "Haldia Dock Complex",
    locode: "INHLD",
    maxDraftM: 14.5,
    waitingVessels: 6,
    avgWaitDays: 4.5,
    berthStatus: "Tidal Lock Operational",
    isTarget: false,
    statusLevel: "restricted",
    notes: "Riverine draft limit requires lightering for vessels exceeding 55,000 MT DWT.",
  },
];

export const LiveMapPage: React.FC = () => {
  const [route, setRoute] = useState<RouteData>({
    origin_lat: -32.9272,
    origin_lon: 151.7765,
    destination_lat: 20.3167,
    destination_lon: 86.6167,
    estimated_distance_nm: 5832,
  });

  const [progressPct, setProgressPct] = useState<number>(0.52);
  const [shipPosition, setShipPosition] = useState<ShipPositionData | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mapMode, setMapMode] = useState<"corridor2d" | "globe3d">("corridor2d");
  const [showVesselTelemetry, setShowVesselTelemetry] = useState<boolean>(true);
  const [globeRotationActive, setGlobeRotationActive] = useState<boolean>(true);
  const [selectedPortId, setSelectedPortId] = useState<string>("INPRT");

  const progressRef = useRef<number>(0.52);

  useEffect(() => {
    progressRef.current = progressPct;
  }, [progressPct]);

  // Task 398: On mount call getRoute
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient<RouteData>(
          "/map/route?origin_locode=AUNCL&destination_locode=INPRT"
        );
        if (data) setRoute(data);
      } catch {
        // Fallback default Newcastle -> Paradip
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoute();
  }, []);

  // Task 399: Polling animated ship position every 3 seconds (3000ms)
  useEffect(() => {
    if (!isPlaying) return;

    const updatePosition = async () => {
      try {
        let nextPct = progressRef.current + 0.05;
        if (nextPct > 1.0) nextPct = 0.0;
        nextPct = Math.round(nextPct * 100) / 100;
        setProgressPct(nextPct);

        const data = await apiClient<ShipPositionData>(
          `/map/ship-position?origin_lat=${route.origin_lat}&origin_lon=${route.origin_lon}&destination_lat=${route.destination_lat}&destination_lon=${route.destination_lon}&progress_pct=${nextPct}`
        );
        setShipPosition(data);
      } catch {
        const lat =
          route.origin_lat +
          (route.destination_lat - route.origin_lat) * progressRef.current;
        const lon =
          route.origin_lon +
          (route.destination_lon - route.origin_lon) * progressRef.current;
        setShipPosition({
          current_lat: Math.round(lat * 1000) / 1000,
          current_lon: Math.round(lon * 1000) / 1000,
          progress_pct: progressRef.current,
        });
      }
    };

    updatePosition();
    const intervalId = window.setInterval(updatePosition, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, route]);

  const currentLat = shipPosition?.current_lat ?? -6.3;
  const currentLon = shipPosition?.current_lon ?? 119.2;
  const distanceCovered = Math.round(route.estimated_distance_nm * progressPct);
  const distanceRemaining = route.estimated_distance_nm - distanceCovered;
  const calculatedEtaDays = Math.max(1, Math.round((distanceRemaining / (13.5 * 24)) * 10) / 10);

  const selectedPort = EAST_COAST_PORTS.find((p) => p.id === selectedPortId) || EAST_COAST_PORTS[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Task 400: Persistent Non-Dismissible Amber Banner */}
      <div className="flex items-start gap-3 rounded-card border border-amber-warning/40 bg-amber-wash p-4 text-amber-warning shadow-sm">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-warning" />
        <div className="text-xs leading-relaxed text-charcoal">
          <strong className="font-bold uppercase tracking-wider text-amber-warning">
            Navigation Simulation Notice:{" "}
          </strong>
          Ship position is automatically generated to demonstrate voyage tracking. This is not a live AIS feed.
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pebble pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
              PAGE 13: LIVE FLEET MAP
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-profit font-semibold">
              <span className="size-2 rounded-full bg-emerald-profit animate-pulse" />
              {isLoading ? "INITIALIZING AIS FEED…" : "SIMULATED AIS FEED (3s TELEMETRY LOOP)"}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-forest-ink sm:text-3xl">
            Live Vessel Tracking & East Coast Port Corridor
          </h1>
          <p className="mt-0.5 text-xs text-slate">
            Voyage tracking for Newcastle (Australia) to Paradip (India) coking coal bulk corridor with 3D WebGL globe visualization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher: 2D RouteMap vs 3D Globe */}
          <div className="flex items-center rounded-full border border-pebble bg-fog p-1 text-xs">
            <button
              type="button"
              onClick={() => setMapMode("corridor2d")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-all focus-visible:outline-2 focus-visible:outline-forest-ink ${
                mapMode === "corridor2d"
                  ? "bg-forest-ink text-paper shadow-sm"
                  : "text-charcoal hover:text-forest-ink"
              }`}
            >
              <MapIcon className="size-3" /> 2D Sailing Corridor
            </button>
            <button
              type="button"
              onClick={() => setMapMode("globe3d")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-all focus-visible:outline-2 focus-visible:outline-forest-ink ${
                mapMode === "globe3d"
                  ? "bg-forest-ink text-paper shadow-sm"
                  : "text-charcoal hover:text-forest-ink"
              }`}
            >
              <Globe2 className="size-3 text-lime-voltage" /> 3D WebGL Globe
            </button>
          </div>

          {/* Pause / Resume Tracking */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="inline-flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3.5 py-1.5 text-xs font-semibold text-charcoal shadow-sm hover:bg-fog focus-visible:outline-2 focus-visible:outline-forest-ink transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="size-3.5 text-amber-warning" /> : <Play className="size-3.5 text-forest-ink" />}
            <span>{isPlaying ? "Pause" : "Resume"}</span>
          </button>

          {/* Restart Voyage */}
          <button
            type="button"
            onClick={() => {
              setProgressPct(0.0);
              progressRef.current = 0.0;
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-fog focus-visible:outline-2 focus-visible:outline-forest-ink transition-colors"
            aria-label="Restart voyage from origin"
          >
            <RotateCcw className="size-3.5 text-slate" />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-card border border-pebble bg-paper p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate">
            <span className="font-mono text-[10px] uppercase tracking-wider">Active Vessel</span>
            <Ship className="size-4 text-forest-ink" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-forest-ink">
            MV OCEAN PRIDE
          </div>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-charcoal tabular-nums">
            <span>Panamax Bulker</span>
            <span>•</span>
            <span>75,400 DWT</span>
          </div>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate">
            <span className="font-mono text-[10px] uppercase tracking-wider">Current Position</span>
            <Compass className="size-4 text-forest-ink" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-charcoal tabular-nums">
            {currentLat >= 0 ? `${currentLat.toFixed(2)}° N` : `${Math.abs(currentLat).toFixed(2)}° S`},{" "}
            {currentLon >= 0 ? `${currentLon.toFixed(2)}° E` : `${Math.abs(currentLon).toFixed(2)}° W`}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-slate tabular-nums">
            Voyage Progress: {Math.round(progressPct * 100)}%
          </div>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate">
            <span className="font-mono text-[10px] uppercase tracking-wider">Sailing Distance</span>
            <Navigation className="size-4 text-forest-ink" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-charcoal tabular-nums">
            {distanceCovered.toLocaleString()}{" "}
            <span className="text-xs font-sans font-normal text-slate">/ {route.estimated_distance_nm.toLocaleString()} NM</span>
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-slate tabular-nums">
            {distanceRemaining.toLocaleString()} NM to berth
          </div>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate">
            <span className="font-mono text-[10px] uppercase tracking-wider">Estimated Arrival (ETA)</span>
            <Clock className="size-4 text-forest-ink" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-forest-ink tabular-nums">
            {calculatedEtaDays.toFixed(1)} Days
          </div>
          <div className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-charcoal">
            <Gauge className="size-3 text-slate" />
            <span>Economic Speed: 13.5 Knots</span>
          </div>
        </div>
      </div>

      {/* Main Visualizer Area (3D WebGL Globe or 2D RouteMap SVG) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-forest-ink">
            <Radio className="size-4 text-forest-ink animate-pulse" />
            <span>
              {mapMode === "globe3d"
                ? "3D WebGL Maritime Sphere & Global Trade Lanes (Interactive Drag)"
                : "Interactive Great-Circle Corridor & Port Bathymetry (2D Vector)"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVesselTelemetry(!showVesselTelemetry)}
              className="inline-flex items-center gap-1 rounded-full border border-pebble bg-paper px-2.5 py-1 text-[11px] font-mono text-charcoal hover:bg-fog focus-visible:outline-2 focus-visible:outline-forest-ink"
            >
              <Eye className="size-3 text-slate" />
              <span>{showVesselTelemetry ? "Hide Vessel Card" : "Show Vessel Card"}</span>
            </button>
            <span className="font-mono text-[11px] text-slate">
              Tick: +5% step / 3s
            </span>
          </div>
        </div>

        {/* View Container */}
        <div className="relative min-h-[500px] w-full rounded-card overflow-hidden border border-pebble shadow-md bg-forest-ink">
          {mapMode === "globe3d" ? (
            /* 3D WebGL Globe View with Custom Controls */
            <div className="relative size-full min-h-[500px] flex items-center justify-center">
              <MaritimeGlobe className="h-[500px] w-full" interactive={globeRotationActive} />

              {/* 3D Globe HUD Overlay Controls */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 rounded-card border border-pebble/30 bg-forest-ink/80 p-3 text-paper backdrop-blur-md z-10">
                <div className="flex items-center gap-2 text-xs font-bold text-lime-voltage">
                  <Globe2 className="size-4" />
                  <span>3D Oceanic Globe Engine</span>
                </div>
                <span className="text-[10px] font-mono text-linen-mist">
                  Drag to rotate sphere • Multi-lane arcs
                </span>

                <div className="mt-2 flex items-center gap-2 border-t border-pebble/30 pt-2">
                  <button
                    type="button"
                    onClick={() => setGlobeRotationActive(!globeRotationActive)}
                    className="rounded-full bg-marine-spruce/60 border border-pebble/40 px-2.5 py-1 font-mono text-[10px] text-paper hover:bg-marine-spruce focus-visible:outline-2 focus-visible:outline-lime-voltage"
                  >
                    {globeRotationActive ? "Disable Interaction" : "Enable Interaction"}
                  </button>
                </div>
              </div>

              {/* 3D Globe Quick Legend */}
              <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-card border border-pebble/30 bg-forest-ink/80 px-3.5 py-2 text-[10px] font-mono text-linen-mist backdrop-blur-md z-10">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-lime-voltage" /> Indian Discharge Terminals
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-warning" /> Australian / African Coal Loading Ports
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-paper animate-ping" /> Active Bulk Fixtures
                </span>
              </div>
            </div>
          ) : (
            /* 2D Great-Circle Route Map View */
            <RouteMap
              originName="Newcastle, AU (AUNCL)"
              destinationName="Paradip, IN (INPRT)"
              distanceNm={route.estimated_distance_nm}
              shipProgress={progressPct}
              shipPositionText={`MV OCEAN PRIDE (${Math.round(progressPct * 100)}% • ${currentLat.toFixed(1)}°, ${currentLon.toFixed(1)}°)`}
              className="min-h-[500px] w-full"
            />
          )}

          {/* Floating Vessel Telemetry Popup Card (Oceanic Design Tokens) */}
          {showVesselTelemetry && (
            <div className="absolute top-4 right-4 w-72 rounded-card border border-lime-voltage/30 bg-forest-ink/90 p-4 text-paper shadow-xl backdrop-blur-md z-20 space-y-3">
              <div className="flex items-start justify-between border-b border-pebble/20 pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-paper">
                    <Ship className="size-4 text-lime-voltage" />
                    <span>MV OCEAN PRIDE</span>
                  </div>
                  <span className="font-mono text-[10px] text-linen-mist">
                    MMSI: 563012900 • IMO: 9482172
                  </span>
                </div>
                <Pill tone="positive">UNDERWAY</Pill>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="rounded bg-marine-spruce/40 p-2 border border-pebble/20">
                  <span className="text-[9px] uppercase text-linen-mist block">Speed Over Ground</span>
                  <span className="font-bold text-lime-voltage tabular-nums text-sm">13.5 Kts</span>
                </div>

                <div className="rounded bg-marine-spruce/40 p-2 border border-pebble/20">
                  <span className="text-[9px] uppercase text-linen-mist block">Heading Course</span>
                  <span className="font-bold text-paper tabular-nums text-sm">312° NW</span>
                </div>

                <div className="rounded bg-marine-spruce/40 p-2 border border-pebble/20">
                  <span className="text-[9px] uppercase text-linen-mist block">Daily Bunker Burn</span>
                  <span className="font-bold text-amber-warning tabular-nums text-xs flex items-center gap-1">
                    <Fuel className="size-3" /> 24.2 MT/d
                  </span>
                </div>

                <div className="rounded bg-marine-spruce/40 p-2 border border-pebble/20">
                  <span className="text-[9px] uppercase text-linen-mist block">Water Depth</span>
                  <span className="font-bold text-linen-mist tabular-nums text-xs flex items-center gap-1">
                    <Waves className="size-3" /> 3,420 m
                  </span>
                </div>
              </div>

              {/* Position Readout */}
              <div className="rounded bg-marine-spruce/30 p-2 text-[10px] font-mono text-linen-mist border border-pebble/20">
                <div>Current Lat/Lon:</div>
                <div className="font-bold text-paper tabular-nums">
                  {currentLat >= 0 ? `${currentLat.toFixed(3)}° N` : `${Math.abs(currentLat).toFixed(3)}° S`},{" "}
                  {currentLon >= 0 ? `${currentLon.toFixed(3)}° E` : `${Math.abs(currentLon).toFixed(3)}° W`}
                </div>
              </div>

              {/* Destination & Laycan */}
              <div className="text-[11px] text-linen-mist leading-tight border-t border-pebble/20 pt-2 flex items-center justify-between">
                <span>Destination: Paradip Port</span>
                <span className="font-mono text-lime-voltage font-semibold">ETA: {calculatedEtaDays} Days</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION: Indian East Coast Port Status Markers & Bathymetry Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="size-4 text-forest-ink" />
            <h3 className="text-base font-bold text-forest-ink">
              Indian East Coast Port Corridor & Berth Constraints
            </h3>
          </div>
          <span className="font-mono text-xs text-slate">4 Monitored Terminals</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EAST_COAST_PORTS.map((port) => {
            const isSelected = selectedPortId === port.id;
            return (
              <div
                key={port.id}
                onClick={() => setSelectedPortId(port.id)}
                className={`rounded-card border p-4 cursor-pointer transition-all bg-paper shadow-sm space-y-2.5 ${
                  isSelected
                    ? "border-forest-ink ring-2 ring-forest-ink/20"
                    : "border-pebble hover:border-forest-ink/60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-forest-ink text-sm flex items-center gap-1.5">
                      <Building className="size-3.5 text-slate" />
                      <span>{port.name}</span>
                    </h4>
                    <span className="font-mono text-[10px] text-slate block">{port.locode}</span>
                  </div>

                  {port.statusLevel === "optimal" && (
                    <Pill tone="positive">OPTIMAL</Pill>
                  )}
                  {port.statusLevel === "warning" && (
                    <Pill tone="pending">CONGESTION</Pill>
                  )}
                  {port.statusLevel === "restricted" && (
                    <Pill tone="negative">RESTRICTED</Pill>
                  )}
                </div>

                {/* Draft and Queue Callouts */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-pebble/60 pt-2 font-mono">
                  <div>
                    <span className="text-[10px] text-slate block uppercase">Max Draft</span>
                    <span className="font-bold text-forest-ink tabular-nums text-sm">
                      {port.maxDraftM.toFixed(1)} m
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate block uppercase">Anchorage Queue</span>
                    <span className="font-bold text-charcoal tabular-nums text-sm">
                      {port.waitingVessels} Vessels ({port.avgWaitDays}d)
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-charcoal leading-tight border-t border-pebble/40 pt-2">
                  <div className="font-semibold text-forest-ink text-[10px] uppercase">Berth Status:</div>
                  <div className="text-slate font-mono text-[10px] mt-0.5">{port.berthStatus}</div>
                </div>

                {port.isTarget && (
                  <div className="rounded bg-linen-mist/50 p-1.5 text-center font-mono text-[10px] font-bold text-spruce border border-lime-voltage/30">
                    TARGET ANALYSIS DESTINATION
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Port Detailed Intelligence Drawer */}
        <div className="rounded-card border border-pebble bg-linen-mist/20 p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-forest-ink">
            <Anchor className="size-4 text-forest-ink" />
            <span>Terminal Operational Guidance: {selectedPort.name} ({selectedPort.locode})</span>
          </div>
          <p className="text-xs text-charcoal leading-relaxed">
            {selectedPort.notes} Maximum channel draft is rated at <strong className="font-mono text-forest-ink">{selectedPort.maxDraftM.toFixed(1)} meters</strong>. Average queue waiting time is currently <strong className="font-mono text-forest-ink">{selectedPort.avgWaitDays.toFixed(1)} days</strong> across {selectedPort.waitingVessels} awaiting vessels.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveMapPage;
