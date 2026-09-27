import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useTour } from "../context/TourContext";
import { TOUR_STEPS } from "../data/tourSteps";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  Cpu,
  Building2,
  Compass,
} from "lucide-react";

interface RectBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const SpotlightTour: React.FC = () => {
  const {
    isTourActive,
    currentStepIndex,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    jumpToStep,
    endTour,
  } = useTour();

  const [targetRect, setTargetRect] = useState<RectBounds | null>(null);
  const [cardHeight, setCardHeight] = useState<number>(300);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const cardRef = useRef<HTMLDivElement>(null);
  const targetElementRef = useRef<Element | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Update bounds from target element
  const updateTargetBounds = useCallback(() => {
    if (!targetElementRef.current) return;
    const rect = targetElementRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setTargetRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  // Update card height dynamically
  useLayoutEffect(() => {
    if (cardRef.current) {
      const h = cardRef.current.offsetHeight;
      if (h > 0) setCardHeight(h);
    }
  }, [currentStepIndex, isTourActive]);

  // Handle locating target with polling and smooth scroll centering
  useEffect(() => {
    if (!isTourActive) {
      targetElementRef.current = null;
      setTargetRect((prev) => (prev ? null : prev));
      return;
    }

    let isCancelled = false;
    let pollStart = Date.now();
    const timeoutMs = 2500;

    const findAndLockTarget = () => {
      if (isCancelled) return;

      const element = document.querySelector(currentStep.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          targetElementRef.current = element;
          element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          updateTargetBounds();
          return;
        }
      }

      if (Date.now() - pollStart < timeoutMs) {
        animFrameRef.current = requestAnimationFrame(findAndLockTarget);
      } else {
        // Fallback center if element missing on target page
        targetElementRef.current = null;
        setTargetRect({
          left: window.innerWidth / 2 - 150,
          top: window.innerHeight / 2 - 100,
          width: 300,
          height: 200,
        });
      }
    };

    // Give router 50ms to switch views before polling
    const timer = setTimeout(() => {
      findAndLockTarget();
    }, 60);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isTourActive, currentStepIndex, currentStep.selector, currentStep.route, updateTargetBounds]);

  // Real-time tracking on scroll, resize, and DOM mutations
  useEffect(() => {
    if (!isTourActive) return;

    const onScrollOrResize = () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(() => {
        setViewport({ width: window.innerWidth, height: window.innerHeight });
        updateTargetBounds();
      });
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true, capture: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    let observer: ResizeObserver | null = null;
    if (targetElementRef.current && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(onScrollOrResize);
      observer.observe(targetElementRef.current);
    }

    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      if (observer) observer.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isTourActive, updateTargetBounds]);

  if (!isTourActive || !targetRect) return null;

  const pad = 8;
  const cutoutX = Math.max(0, targetRect.left - pad);
  const cutoutY = Math.max(0, targetRect.top - pad);
  const cutoutW = Math.max(20, targetRect.width + pad * 2);
  const cutoutH = Math.max(20, targetRect.height + pad * 2);

  // Viewport-clamped floating card coordinates
  const cardWidth = Math.min(440, viewport.width - 32);
  const spaceBelow = viewport.height - (cutoutY + cutoutH + 16);
  const spaceAbove = cutoutY - 16;

  let cardTop: number;
  let isDockedBottom = false;

  if (spaceBelow >= cardHeight + 12 || spaceBelow >= spaceAbove) {
    // Position below
    cardTop = Math.min(viewport.height - cardHeight - 16, cutoutY + cutoutH + 14);
  } else if (spaceAbove >= cardHeight + 12) {
    // Position above
    cardTop = Math.max(16, cutoutY - cardHeight - 14);
  } else {
    // Viewport too tight: dock at bottom
    isDockedBottom = true;
    cardTop = viewport.height - cardHeight - 16;
  }

  // Horizontal clamping
  const idealLeft = cutoutX + cutoutW / 2 - cardWidth / 2;
  const cardLeft = isDockedBottom
    ? Math.max(16, (viewport.width - cardWidth) / 2)
    : Math.max(16, Math.min(viewport.width - cardWidth - 16, idealLeft));

  const progressPct = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  return (
    <div
      role="dialog"
      data-tour-overlay="true"
      aria-label={`Feature Tour: ${currentStep.title}`}
      aria-modal="true"
      className="fixed inset-0 z-[9990] overflow-hidden select-none pointer-events-auto"
    >
      {/* SVG Spotlight Mask */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        style={{ width: "100vw", height: "100vh" }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White area = covered by backdrop */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black area = cut-out hole showing underlying feature */}
            <rect
              x={cutoutX}
              y={cutoutY}
              width={cutoutW}
              height={cutoutH}
              rx="10"
              ry="10"
              fill="black"
            />
          </mask>
        </defs>
        {/* Dark backdrop with cutout */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(8, 16, 12, 0.70)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Target Focus Halo Ring */}
      <div
        style={{
          position: "fixed",
          left: `${cutoutX}px`,
          top: `${cutoutY}px`,
          width: `${cutoutW}px`,
          height: `${cutoutH}px`,
        }}
        className="pointer-events-none rounded-[10px] border-2 border-lime-voltage shadow-[0_0_24px_rgba(200,255,0,0.50)] transition-all duration-150"
      />

      {/* Viewport-Clamped Floating Explanation Card */}
      <div
        ref={cardRef}
        style={{
          position: "fixed",
          left: `${cardLeft}px`,
          top: `${cardTop}px`,
          width: `${cardWidth}px`,
        }}
        className="z-[9999] rounded-2xl border border-pebble bg-paper p-5 shadow-2xl transition-all duration-200"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-pebble pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-forest-ink">
              <Compass className="size-3" />
              <span>Step {currentStepIndex + 1} of {totalSteps}</span>
            </span>
            <span className="rounded-full bg-fog px-2 py-0.5 text-[10px] font-medium text-slate uppercase tracking-wide">
              {currentStep.category}
            </span>
          </div>
          <button
            type="button"
            onClick={endTour}
            aria-label="Close feature tour"
            className="flex size-7 items-center justify-center rounded-full text-slate hover:bg-fog hover:text-charcoal transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Feature Title */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-lime-voltage font-mono text-[10px] font-bold text-forest-ink">
              #{currentStep.featureNumber}
            </span>
            <h3 className="font-sans text-base font-bold text-obsidian leading-snug">
              {currentStep.title}
            </h3>
          </div>
        </div>

        {/* 3 Layman Explanations */}
        <div className="mt-3.5 space-y-2.5 text-xs text-charcoal">
          {/* 1. What You See */}
          <div className="flex items-start gap-2.5 rounded-card bg-fog/80 p-2.5">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-paper text-forest-ink border border-pebble">
              <Eye className="size-3" />
            </div>
            <div>
              <div className="font-semibold text-forest-ink uppercase tracking-wide text-[10px]">
                On Screen
              </div>
              <p className="mt-0.5 leading-relaxed text-charcoal/90">
                {currentStep.whatYouSee}
              </p>
            </div>
          </div>

          {/* 2. Under The Hood */}
          <div className="flex items-start gap-2.5 rounded-card bg-fog/80 p-2.5">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-paper text-signal-blue border border-pebble">
              <Cpu className="size-3" />
            </div>
            <div>
              <div className="font-semibold text-signal-blue uppercase tracking-wide text-[10px]">
                Under The Hood
              </div>
              <p className="mt-0.5 leading-relaxed text-charcoal/90">
                {currentStep.underTheHood}
              </p>
            </div>
          </div>

          {/* 3. Why It Matters To SAIL */}
          <div className="flex items-start gap-2.5 rounded-card bg-linen-mist/70 p-2.5 border border-forest-ink/15">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-paper text-emerald-profit border border-emerald-profit/30">
              <Building2 className="size-3" />
            </div>
            <div>
              <div className="font-semibold text-forest-ink uppercase tracking-wide text-[10px]">
                Why it matters to SAIL
              </div>
              <p className="mt-0.5 leading-relaxed text-charcoal">
                {currentStep.whyItMatters}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Jump Selector */}
        <div className="mt-3 flex items-center gap-2 border-t border-pebble pt-3">
          <label htmlFor="tour-jump-select" className="text-[11px] font-medium text-slate shrink-0">
            Jump to:
          </label>
          <select
            id="tour-jump-select"
            value={currentStepIndex}
            onChange={(e) => jumpToStep(Number(e.target.value))}
            className="flex-1 rounded-card border border-pebble bg-paper py-1 px-2 text-xs font-medium text-charcoal focus:border-forest-ink focus:outline-none cursor-pointer"
          >
            {TOUR_STEPS.map((s, idx) => (
              <option key={s.id} value={idx}>
                {idx + 1}. #{s.featureNumber} {s.title}
              </option>
            ))}
          </select>
        </div>

        {/* Footer Navigation Controls */}
        <div className="mt-3 flex items-center justify-between border-t border-pebble pt-3">
          <button
            type="button"
            disabled={currentStepIndex === 0}
            onClick={prevStep}
            className="flex items-center gap-1 rounded-full border border-pebble bg-paper px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-fog disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={endTour}
              className="rounded-full px-2.5 py-1 text-xs text-slate hover:text-charcoal transition-colors cursor-pointer"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-1 rounded-full bg-forest-ink px-4 py-1.5 text-xs font-semibold text-paper hover:bg-forest-ink/90 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <span>{currentStepIndex === totalSteps - 1 ? "Finish Tour" : "Next"}</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Progress Bar */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-fog">
          <div
            className="h-full bg-lime-voltage transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};
