import React, { useState, useEffect, useRef, useCallback } from "react";
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


// Smart context-aware smooth scrolling that handles any nested scroll container
function scrollTargetIntoView(element: Element) {
  const rect = element.getBoundingClientRect();
  const vh = window.innerHeight;
  const topNavHeight = 70;

  // If already comfortably within view with room for the card, don't scroll
  const isComfortablyVisible =
    rect.top >= topNavHeight &&
    rect.bottom <= vh - 20 &&
    (vh - rect.bottom >= 260 || rect.top - topNavHeight >= 260);

  if (isComfortablyVisible) {
    return;
  }

  // Ensure scroll margin so sticky top nav doesn't cover element when block is 'start'
  const htmlEl = element as HTMLElement;
  if (htmlEl.style && !htmlEl.style.scrollMarginTop) {
    htmlEl.style.scrollMarginTop = "80px";
  }

  // If the element is tall, align to start; otherwise center
  const isTall = rect.height > 350;

  try {
    element.scrollIntoView({
      behavior: "smooth",
      block: isTall ? "start" : "center",
      inline: "nearest",
    });
  } catch {
    element.scrollIntoView();
  }
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

  const [isAdvancing, setIsAdvancing] = useState(false);
  const [targetRect, setTargetRect] = useState<RectBounds | null>(null);
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
          scrollTargetIntoView(element);
          updateTargetBounds();

          // Active smooth-scroll tracking loop: continuously track target bounds
          // during smooth scroll animation (up to 30 frames / 500ms)
          let trackFrames = 0;
          const trackAnimation = () => {
            if (isCancelled) return;
            updateTargetBounds();
            trackFrames++;
            if (trackFrames < 30) {
              requestAnimationFrame(trackAnimation);
            }
          };
          requestAnimationFrame(trackAnimation);
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
  }, [isTourActive, currentStepIndex, updateTargetBounds]);

  if (!isTourActive || !targetRect) return null;

  const pad = 8;
  const cutoutX = Math.max(0, targetRect.left - pad);
  const cutoutY = Math.max(0, targetRect.top - pad);
  const cutoutW = Math.max(20, targetRect.width + pad * 2);
  // Cap spotlight height so oversized elements (tables, maps) don't cover the whole screen
  const maxCutoutH = Math.min(380, Math.max(200, Math.floor(viewport.height * 0.40)));
  const cutoutH = Math.min(Math.max(20, targetRect.height + pad * 2), maxCutoutH);

  const cutout = {
    left: cutoutX,
    top: cutoutY,
    width: cutoutW,
    height: cutoutH,
  };

  const cardWidth = Math.min(420, viewport.width - 32);
  const topNavLimit = 64;

  // Strict 4-way collision-free placement solver with directional edge anchoring
  const spaceBelow = viewport.height - (cutout.top + cutout.height + 14) - 16;
  const spaceAbove = cutout.top - 14 - topNavLimit;
  const spaceRight = viewport.width - (cutout.left + cutout.width + 14) - 16;
  const spaceLeft = cutout.left - 14 - 16;

  let cardStyle: React.CSSProperties;

  // Horizontal centering for above/below placements
  const centerLeft = Math.max(16, Math.min(viewport.width - cardWidth - 16, cutout.left + (cutout.width - cardWidth) / 2));

  if (spaceBelow >= 260) {
    // 1. Below Target: anchor TOP at cutout.bottom + 14 (grows downwards away from target)
    cardStyle = {
      position: "fixed",
      left: `${centerLeft}px`,
      top: `${cutout.top + cutout.height + 14}px`,
      width: `${cardWidth}px`,
      maxHeight: `${Math.max(160, spaceBelow)}px`,
    };
  } else if (spaceAbove >= 260) {
    // 2. Above Target: anchor BOTTOM at cutout.top - 14 (grows upwards away from target)
    cardStyle = {
      position: "fixed",
      left: `${centerLeft}px`,
      bottom: `${viewport.height - (cutout.top - 14)}px`,
      width: `${cardWidth}px`,
      maxHeight: `${Math.max(160, spaceAbove)}px`,
    };
  } else if (spaceRight >= 360) {
    // 3. Right of Target: anchor LEFT at cutout.right + 14
    const top = Math.max(topNavLimit, Math.min(viewport.height - 340 - 16, cutout.top));
    cardStyle = {
      position: "fixed",
      left: `${cutout.left + cutout.width + 14}px`,
      top: `${top}px`,
      width: `${Math.min(cardWidth, spaceRight)}px`,
      maxHeight: `${viewport.height - top - 16}px`,
    };
  } else if (spaceLeft >= 360) {
    // 4. Left of Target: anchor RIGHT at cutout.left - 14
    const top = Math.max(topNavLimit, Math.min(viewport.height - 340 - 16, cutout.top));
    cardStyle = {
      position: "fixed",
      right: `${viewport.width - (cutout.left - 14)}px`,
      top: `${top}px`,
      width: `${Math.min(cardWidth, spaceLeft)}px`,
      maxHeight: `${viewport.height - top - 16}px`,
    };
  } else {
    // 5. Fallback: whichever vertical direction has more space, safely clamped inside viewport
    if (spaceBelow >= spaceAbove) {
      const top = Math.max(topNavLimit, Math.min(viewport.height - 240, cutout.top + cutout.height + 8));
      cardStyle = {
        position: "fixed",
        left: `${centerLeft}px`,
        top: `${top}px`,
        width: `${cardWidth}px`,
        maxHeight: `${Math.max(160, viewport.height - top - 16)}px`,
      };
    } else {
      const bottom = Math.max(16, Math.min(viewport.height - topNavLimit - 180, viewport.height - (cutout.top - 8)));
      cardStyle = {
        position: "fixed",
        left: `${centerLeft}px`,
        bottom: `${bottom}px`,
        width: `${cardWidth}px`,
        maxHeight: `${Math.max(160, viewport.height - bottom - topNavLimit)}px`,
      };
    }
  }

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

      {/* Viewport-Clamped Floating Explanation Card with Zero-Collision Invariant */}
      <div
        ref={cardRef}
        style={cardStyle}
        className="z-[9999] flex flex-col rounded-2xl border border-pebble bg-paper p-4 shadow-2xl transition-all duration-200"
      >
        {/* Header Bar */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-pebble pb-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-forest-ink/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-forest-ink">
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
            className="flex size-6 items-center justify-center rounded-full text-slate hover:bg-fog hover:text-charcoal transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Feature Title */}
        <div className="mt-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-lime-voltage font-mono text-[10px] font-bold text-forest-ink">
              #{currentStep.featureNumber}
            </span>
            <h3 className="font-sans text-sm font-bold text-obsidian leading-snug">
              {currentStep.title}
            </h3>
          </div>
        </div>

        {/* 3 Layman Explanations (Scrollable if height constrained) */}
        <div className="mt-2.5 space-y-2 text-xs text-charcoal overflow-y-auto pr-1 flex-1 min-h-0">
          {/* 1. What You See */}
          <div className="flex items-start gap-2 rounded-card bg-fog/80 p-2">
            <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-paper text-forest-ink border border-pebble">
              <Eye className="size-2.5" />
            </div>
            <div>
              <div className="font-semibold text-forest-ink uppercase tracking-wide text-[9px]">
                On Screen
              </div>
              <p className="mt-0.5 leading-relaxed text-[11px] text-charcoal/90">
                {currentStep.whatYouSee}
              </p>
            </div>
          </div>

          {/* 2. Under The Hood */}
          <div className="flex items-start gap-2 rounded-card bg-fog/80 p-2">
            <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-paper text-signal-blue border border-pebble">
              <Cpu className="size-2.5" />
            </div>
            <div>
              <div className="font-semibold text-signal-blue uppercase tracking-wide text-[9px]">
                Under The Hood
              </div>
              <p className="mt-0.5 leading-relaxed text-[11px] text-charcoal/90">
                {currentStep.underTheHood}
              </p>
            </div>
          </div>

          {/* 3. Why It Matters To SAIL */}
          <div className="flex items-start gap-2 rounded-card bg-linen-mist/70 p-2 border border-forest-ink/15">
            <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-paper text-emerald-profit border border-emerald-profit/30">
              <Building2 className="size-2.5" />
            </div>
            <div>
              <div className="font-semibold text-forest-ink uppercase tracking-wide text-[9px]">
                Why it matters to SAIL
              </div>
              <p className="mt-0.5 leading-relaxed text-[11px] text-charcoal">
                {currentStep.whyItMatters}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Jump Selector */}
        <div className="mt-2 flex shrink-0 items-center gap-2 border-t border-pebble pt-2">
          <label htmlFor="tour-jump-select" className="text-[10px] font-medium text-slate shrink-0">
            Jump to:
          </label>
          <select
            id="tour-jump-select"
            value={currentStepIndex}
            onChange={(e) => jumpToStep(Number(e.target.value))}
            className="flex-1 rounded-card border border-pebble bg-paper py-0.5 px-2 text-[11px] font-medium text-charcoal focus:border-forest-ink focus:outline-none cursor-pointer"
          >
            {TOUR_STEPS.map((s, idx) => (
              <option key={s.id} value={idx}>
                {idx + 1}. #{s.featureNumber} {s.title}
              </option>
            ))}
          </select>
        </div>

        {/* Footer Navigation Controls */}
        <div className="mt-2.5 flex shrink-0 items-center justify-between border-t border-pebble pt-2">
          <button
            type="button"
            disabled={currentStepIndex === 0}
            onClick={prevStep}
            className="flex items-center gap-1 rounded-full border border-pebble bg-paper px-2.5 py-1 text-xs font-semibold text-charcoal hover:bg-fog disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={endTour}
              className="rounded-full px-2 py-1 text-xs text-slate hover:text-charcoal transition-colors cursor-pointer"
            >
              Skip
            </button>
            <button
              type="button"
              disabled={isAdvancing}
              onClick={async () => {
                if (isAdvancing) return;
                setIsAdvancing(true);
                try {
                  await nextStep();
                } finally {
                  setIsAdvancing(false);
                }
              }}
              className="flex items-center gap-1 rounded-full bg-forest-ink px-3.5 py-1 text-xs font-semibold text-paper hover:bg-forest-ink/90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
            >
              <span>{isAdvancing ? "Loading…" : currentStepIndex === totalSteps - 1 ? "Finish Tour" : "Next"}</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Progress Bar */}
        <div className="mt-2 h-1 w-full shrink-0 overflow-hidden rounded-full bg-fog">
          <div
            className="h-full bg-lime-voltage transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};
