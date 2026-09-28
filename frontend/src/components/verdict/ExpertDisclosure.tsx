import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "../../lib/cn";

/**
 * The layering rule in one component: plain words stay visible, expert
 * density lives inside this <details> and is one click (or Enter) away.
 */
export function ExpertDisclosure({
  label = "Show expert detail",
  className,
  open,
  defaultOpen,
  children,
}: {
  label?: string;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={open ?? defaultOpen}
      className={cx("group rounded-card border border-pebble bg-paper", className)}
    >
      <summary
        className={cx(
          "flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3",
          "font-mono text-xs font-semibold uppercase tracking-[0.08em] text-charcoal",
          "hover:text-forest-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-ink",
        )}
      >
        <span>{label}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 transition-transform duration-150 group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-pebble px-4 py-4">{children}</div>
    </details>
  );
}

export default ExpertDisclosure;
