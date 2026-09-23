import { useEffect } from "react";
import { useSpring } from "framer-motion";

/*
 * Spring-driven number (spec §5.2): the returned MotionValue updates
 * the DOM text node directly via the consumer's useTransform — no
 * per-frame React re-renders. enabled=false (reduced motion) snaps.
 */
export function useSpringNumber(value: number, enabled: boolean) {
  const spring = useSpring(value, { stiffness: 170, damping: 26 });
  useEffect(() => {
    if (enabled) {
      spring.set(value);
    } else {
      spring.jump(value);
    }
  }, [value, enabled, spring]);
  return spring;
}
