import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "../api/client";
import { RouteMap } from "../components/RouteMap";
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
} from "lucide-react";

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

export const LiveMapPage: React.FC = () => {
  const [route, setRoute] = useState<RouteData>({
    origin_lat: -32.9272,
    origin_lon: 151.7765,
    destination_lat: 20.3167,
    destination_lon: 86.6167,
    estimated_distance_nm: 5832,
  });

  const [progressPct, setProgressPct] = useState<number>(0.5);
  const [shipPosition, setShipPosition] = useState<ShipPositionData | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const progressRef = useRef<number>(0.5);

  // Keep ref synchronized
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

  // Task 399: Polling animated ship position every 3 seconds
  useEffect(() => {
    if (!isPlaying) return;

    const updatePosition = async () => {
      try {
        // Advance progress by 0.05
        let nextPct = progressRef.current + 0.05;
        if (nextPct > 1.0) nextPct = 0.0;
        nextPct = Math.round(nextPct * 100) / 100;
        setProgressPct(nextPct);

        const data = await apiClient<ShipPositionData>(
          `/map/ship-position?origin_lat=${route.origin_lat}&origin_lon=${route.origin_lon}&destination_lat=${route.destination_lat}&destination_lon=${route.destination_lon}&progress_pct=${nextPct}`
        );
        setShipPosition(data);
      } catch {
        // Fallback interpolation if backend endpoint is unavailable
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

    // Initial fetch
    updatePosition();

    // Task 399: setInterval every 3 seconds (3000ms)
    const intervalId = window.setInterval(updatePosition, 3000);

    // Task 399: clear interval on component unmount
    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, route]);

  const currentLat = shipPosition?.current_lat ?? -6.3;
  const currentLon = shipPosition?.current_lon ?? 119.2;
  const distanceCovered = Math.round(route.estimated_distance_nm * progressPct);
  const distanceRemaining = route.estimated_distance_nm - distanceCovered;
  const calculatedEtaDays = Math.max(1, Math.round((distanceRemaining / (13.5 * 24)) * 10) / 10);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Task 400: Persistent Non-Dismissible Simulation Banner */}
      <div className="flex items-start gap-3 rounded-card border border-pebble bg-linen-mist/50 p-4 text-forest-ink">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-forest-ink" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-forest-ink">
            Navigation Simulation Notice:{" "}
          </span>
          Ship position is automatically generated to demonstrate tracking. This is not a live AIS feed.
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pebble pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
              PAGE 13: LIVE FLEET MAP
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-forest-ink font-semibold">
              <span className="size-2 rounded-full bg-lime-voltage animate-pulse" />
              {isLoading ? "INITIALIZING AIS FEED…" : "SIMULATED AIS FEED (3s LOOP)"}
            </span>
          </div>
          <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight text-obsidian sm:text-3xl">
            Live Vessel Tracking & East Coast Port Corridor
          </h1>
          <p className="mt-0.5 text-xs text-slate">
            Voyage tracking for Newcastle (Australia) to Paradip (India) coking coal bulk corridor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3.5 py-2 text-xs font-semibold text-charcoal hover:bg-fog transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="size-3.5 text-slate" /> : <Play className="size-3.5 text-forest-ink" />}
            <span>{isPlaying ? "Pause Tracking" : "Resume Tracking"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProgressPct(0.0);
              progressRef.current = 0.0;
            }}
            className="flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3.5 py-2 text-xs font-medium text-slate hover:bg-fog"
          >
            <RotateCcw className="size-3.5" />
            <span>Restart Voyage</span>
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-card border border-pebble bg-paper p-4">
          <div className="flex items-center justify-between text-slate">
            <span className="font-mono text-[10px] uppercase tracking-wider">Active Vessel</span>
            <Ship className="size-4 text-forest-ink" />
          </div>
          <div className="mt-1 font-sans text-base font-bold text-obsidian">
            MV OCEAN PRIDE
          </div>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-slate">
            <span>Panamax Bulk</span>
            <span>•</span>
            <span>75,000 DWT</span>
          </div>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4">
          <div className="flex items-center justify-between text-slate">
            <span className="font-mono text-[10px] uppercase tracking-wider">Current Position</span>
            <Compass className="size-4 text-forest-ink" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-charcoal">
            {currentLat >= 0 ? `${currentLat.toFixed(2)}° N` : `${Math.abs(currentLat).toFixed(2)}° S`},{" "}
            {currentLon >= 0 ? `${currentLon.toFixed(2)}° E` : `${Math.abs(currentLon).toFixed(2)}° W`}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-slate">
            Interpolation Progress: {Math.round(progressPct * 100)}%
          </div>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4">
          <div className="flex items-center justify-between text-slate">
            <span className="font-mono text-[10px] uppercase tracking-wider">Sailing Distance</span>
            <Navigation className="size-4 text-forest-ink" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-charcoal">
            {distanceCovered.toLocaleString()} <span className="text-xs font-normal text-slate">/ {route.estimated_distance_nm.toLocaleString()} NM</span>
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-slate">
            {distanceRemaining.toLocaleString()} NM to berth
          </div>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-4">
          <div className="flex items-center justify-between text-slate">
            <span className="font-mono text-[10px] uppercase tracking-wider">Estimated Arrival (ETA)</span>
            <Clock className="size-4 text-forest-ink" />
          </div>
          <div className="mt-1 font-sans text-base font-bold text-forest-ink">
            {calculatedEtaDays} Days
          </div>
          <div className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-slate">
            <Gauge className="size-3 text-slate" />
            <span>Economic Speed: 13.5 Knots</span>
          </div>
        </div>
      </div>

      {/* Task 398: Full Prominent Map View with dynamic animated ship position */}
      <div data-tour="nautical-route" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-charcoal">
            <Radio className="size-4 text-forest-ink animate-pulse" />
            <span>Interactive Great-Circle Corridor & Port Bathymetry</span>
          </div>
          <span className="font-mono text-[11px] text-slate">
            Updates every 3,000ms (+5% step)
          </span>
        </div>

        <RouteMap
          originName="Newcastle, AU (AUNCL)"
          destinationName="Paradip, IN (INPRT)"
          distanceNm={route.estimated_distance_nm}
          shipProgress={progressPct}
          shipPositionText={`MV OCEAN PRIDE (${Math.round(progressPct * 100)}% • ${currentLat.toFixed(1)}°, ${currentLon.toFixed(1)}°)`}
          className="min-h-[520px] w-full"
        />
      </div>

      {/* Route Corridor Reference Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-pebble bg-paper p-5 space-y-2">
          <div className="flex items-center gap-2 font-sans text-sm font-bold text-obsidian">
            <Anchor className="size-4 text-forest-ink" />
            <span>Loading Terminal: Port of Newcastle (PWCS)</span>
          </div>
          <p className="text-xs text-slate leading-relaxed">
            Major coal export terminal in New South Wales, Australia. Accommodates fully laden Capesize and Panamax bulk vessels with draft capacity up to 15.2m.
          </p>
        </div>

        <div className="rounded-card border border-pebble bg-paper p-5 space-y-2">
          <div className="flex items-center gap-2 font-sans text-sm font-bold text-obsidian">
            <Anchor className="size-4 text-forest-ink" />
            <span>Discharge Port: Paradip Port (SAIL Berth)</span>
          </div>
          <p className="text-xs text-slate leading-relaxed">
            Designated primary discharge port for Bhilai & Rourkela coking coal. Operational draft limit is 16.5m (slack water) — restricting fully laden Capesize vessels above 125k DWT.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveMapPage;
