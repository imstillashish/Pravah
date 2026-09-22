import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutGrid,
  Ship,
  BarChart3,
  BookOpen,
  Settings,
  LogOut,
  Compass,
} from "lucide-react";

/**
 * Left icon rail (56px) — Admiralty Chart sheet margin. Foam panel,
 * hairline right edge. 24px icons in Slate ink; the active item
 * carries the 2px Abyss left bar + Shoal wash (DESIGN.md §6).
 * Bottom cluster: settings and sign-out.
 */
const RAIL_ITEMS = [
  { icon: LayoutGrid, label: "Overview" },
  { icon: Ship, label: "Vessels" },
  { icon: BarChart3, label: "Markets" },
  { icon: BookOpen, label: "Reports" },
];

export const IconRail: React.FC = () => {
  const { user, logout } = useAuth();
  const initials = user ? user.full_name.charAt(0).toUpperCase() : "?";

  return (
    <aside
      aria-label="Primary navigation"
      className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col items-center justify-between border-r border-line bg-card py-4 md:flex"
    >
      {/* Brand mark — the one filled-Abyss anchor on the rail */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex size-8 items-center justify-center rounded-md bg-mint-500 text-sea-900">
          <Compass className="size-5" aria-hidden="true" />
        </div>

        <nav aria-label="Workspace sections" className="flex flex-col items-center gap-2">
          {RAIL_ITEMS.map(({ icon: Icon, label }, index) => {
            const active = index === 0;
            return (
              <button
                key={label}
                type="button"
                aria-current={active ? "page" : undefined}
                aria-label={label}
                title={label}
                className={`relative flex size-10 items-center justify-center rounded-sm transition-colors duration-150 ${
                  active
                    ? "bg-glass-100 text-sea-900 before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:bg-sea-600"
                    : "text-muted hover:bg-wash hover:text-sea-700"
                }`}
              >
                <Icon className="size-6" aria-hidden="true" />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom cluster */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          className="flex size-10 items-center justify-center rounded-sm text-muted transition-colors duration-150 hover:bg-wash hover:text-sea-700"
        >
          <Settings className="size-6" aria-hidden="true" />
        </button>
        <div className="my-1 h-px w-8 bg-line-strong" aria-hidden="true" />
        <button
          type="button"
          onClick={logout}
          aria-label="Sign out of account"
          title="Sign out"
          className="flex size-10 items-center justify-center rounded-sm text-muted transition-colors duration-150 hover:bg-wash hover:text-sea-700"
        >
          <LogOut className="size-5" aria-hidden="true" />
        </button>
        <div
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-glass-100 font-mono text-xs text-sea-900"
        >
          {initials}
        </div>
      </div>
    </aside>
  );
};

export default IconRail;
