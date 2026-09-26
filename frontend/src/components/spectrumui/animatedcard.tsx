import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  animate,
  useReducedMotion,
} from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cx } from "../../lib/cn";

export interface AnimatedCardProps {
  imgSrc: string;
  title: string;
  aboutProduct: string;
  badge?: string;
  selected?: boolean;
  onClick?: () => void;
  extraInfo?: string;
  className?: string;
  index?: number;
}

const TRACK_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 20,
  mass: 0.5,
} as const;

const RESET_SPRING = {
  type: "spring",
  stiffness: 160,
  damping: 18,
  mass: 0.8,
} as const;

const REST_POINT = 0.5;

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  imgSrc,
  title,
  aboutProduct,
  badge,
  selected = false,
  onClick,
  extraInfo,
  className = "",
  index = 0,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Normalized pointer positions across the card [0, 1]
  const tiltX = useMotionValue(REST_POINT);
  const tiltY = useMotionValue(REST_POINT);
  const cardScale = useSpring(1, TRACK_SPRING);

  // 3D rotation angles (-12 to 12 degrees)
  const rotateX = useTransform(tiltY, [0, 1], [10, -10]);
  const rotateY = useTransform(tiltX, [0, 1], [-10, 10]);

  // Pointer-tracking glare highlight coordinates
  const glarePosX = useTransform(tiltX, (v) => v * 100);
  const glarePosY = useTransform(tiltY, (v) => v * 100);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glarePosX}% ${glarePosY}%, rgba(255, 255, 255, 0.35), transparent 65%)`;

  useEffect(() => {
    return () => {
      tiltX.stop();
      tiltY.stop();
    };
  }, [tiltX, tiltY]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      animate(tiltX, x, TRACK_SPRING);
      animate(tiltY, y, TRACK_SPRING);
    },
    [tiltX, tiltY, shouldReduceMotion]
  );

  const handlePointerEnter = useCallback(() => {
    if (shouldReduceMotion) return;
    setHovered(true);
    cardScale.set(1.035);
  }, [cardScale, shouldReduceMotion]);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    cardScale.set(1);
    animate(tiltX, REST_POINT, RESET_SPRING);
    animate(tiltY, REST_POINT, RESET_SPRING);
  }, [cardScale, tiltX, tiltY]);

  const handlePointerDown = useCallback(() => {
    if (shouldReduceMotion) return;
    cardScale.set(0.975);
  }, [cardScale, shouldReduceMotion]);

  const handlePointerUp = useCallback(() => {
    cardScale.set(hovered ? 1.035 : 1);
  }, [cardScale, hovered]);

  return (
    <div
      style={{ perspective: 1000 }}
      className="relative will-change-transform"
    >
      <motion.div
        ref={cardRef}
        onClick={onClick}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.35,
          delay: Math.min(index * 0.04, 0.4),
          ease: "easeOut",
        }}
        style={{
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
          scale: cardScale,
          transformStyle: "preserve-3d",
        }}
        className={cx(
          "relative flex flex-col items-center rounded-2xl border p-4 cursor-pointer select-none overflow-hidden",
          "transition-[border-color,background-color,box-shadow] duration-250 ease-out",
          selected
            ? "border-forest-ink bg-linen-mist/70 shadow-lg ring-2 ring-forest-ink/60"
            : "border-pebble bg-paper hover:border-forest-ink/50 hover:shadow-xl shadow-xs",
          className
        )}
      >
        {/* Pointer-following glare highlight */}
        {!shouldReduceMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 rounded-[inherit]"
            style={{
              background: glareBackground,
              transform: "translateZ(1px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {/* Selected Accent Glow in background */}
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -inset-1 rounded-2xl bg-lime-voltage/20 blur-md"
            aria-hidden="true"
          />
        )}

        {/* Top Badges (Lifted in 3D) */}
        <div
          style={{ transform: "translateZ(24px)", transformStyle: "preserve-3d" }}
          className="pointer-events-none absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between"
        >
          {selected ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="flex size-5 items-center justify-center rounded-full bg-forest-ink text-lime-voltage shadow-xs"
            >
              <CheckCircle2 className="size-3.5 stroke-[2.5]" />
            </motion.span>
          ) : (
            <span />
          )}

          {badge && (
            <span className="rounded-full bg-fog/90 border border-pebble/60 px-2 py-0.5 font-mono text-[9px] font-semibold text-charcoal shadow-2xs backdrop-blur-xs">
              {badge}
            </span>
          )}
        </div>

        {/* 3D Floating Media / Image with Parallax Lift */}
        <div
          style={{
            transform: hovered && !shouldReduceMotion ? "translateZ(32px)" : "translateZ(12px)",
            transformStyle: "preserve-3d",
            transition: "transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)",
          }}
          className="relative my-2 flex items-center justify-center"
        >
          {/* Ambient soft glow under image on hover */}
          <motion.div
            animate={{
              opacity: hovered ? 0.75 : 0,
              scale: hovered ? 1.15 : 0.9,
            }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-2 rounded-full bg-forest-ink/15 blur-lg"
          />

          <motion.img
            src={imgSrc}
            alt={`${title} visual`}
            className="relative z-10 h-24 w-24 object-contain drop-shadow-sm transition-transform duration-300"
            style={{
              transform: hovered && !shouldReduceMotion ? "scale(1.08) translateY(-4px)" : "scale(1) translateY(0px)",
            }}
            loading="lazy"
          />
        </div>

        {/* Text Content (Lifted in 3D) */}
        <div
          style={{
            transform: hovered && !shouldReduceMotion ? "translateZ(20px)" : "translateZ(6px)",
            transformStyle: "preserve-3d",
            transition: "transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)",
          }}
          className="w-full text-center space-y-1 mt-1 z-10"
        >
          <div className="font-sans text-sm font-bold text-obsidian leading-tight">
            {title}
          </div>
          <p className="font-mono text-[10px] text-slate line-clamp-2">
            {aboutProduct}
          </p>
          {extraInfo && (
            <p className="font-mono text-[10px] text-forest-ink font-semibold">
              {extraInfo}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AnimatedCard;