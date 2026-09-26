import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutGrid,
  Ship,
  BarChart3,
  BookOpen,
  Settings,
  LogOut,
} from "lucide-react";
import { PravahLogo } from "./PravahLogo";

/**
 * Left icon rail (56px) — Wise shell. Paper panel, Pebble hairline
 * right edge. Active item = Linen Mist pill wash + Forest Ink icon
 * (Wise segmented-control language — no left accent bar, spec §6).
 * Bottom cluster: settings and sign-out.
 */
const RAIL_ITEMS = [
  { icon: LayoutGrid, label: "Overview", hash: "#dashboard" },
  { icon: BarChart3, label: "Analysis", hash: "#results" },
  { icon: Ship, label: "Live Fleet Map", hash: "#live-map" },
  { icon: BookOpen, label: "Historical Records", hash: "#history" },
];

export interface IconRailProps {
  currentView?: string;
}

export const IconRail: React.FC<IconRailProps> = ({ currentView = "dashboard" }) => {
  const { user, logout } = useAuth();
  const initials = user ? user.full_name.charAt(0).toUpperCase() : "?";

  const isHashActive = (hash: string) => {
    const key = hash.replace("#", "");
    if (key === "dashboard") return currentView === "dashboard" || currentView === "";
    if (key === "results") return currentView === "results" || currentView === "analysis" || currentView.startsWith("analysis") || currentView === "new-analysis";
    if (key === "live-map") return currentView === "live-map" || currentView === "map";
    if (key === "history") return currentView === "history";
    return currentView === key;
  };

  return (
    <aside
      aria-label="Primary navigation"
      className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col items-center justify-between border-r border-pebble bg-paper py-4 md:flex"
    >
      {/* Brand mark — Pravah predictive prow mark */}
      <div className="flex flex-col items-center gap-6">
        <div 
          onClick={() => { window.location.hash = "#dashboard"; }}
          className="cursor-pointer"
          title="Return to Dashboard"
        >
          <PravahLogo size={32} variant="mark-only" />
        </div>

        <nav aria-label="Workspace sections" className="flex flex-col items-center gap-2">
          {RAIL_ITEMS.map(({ icon: Icon, label, hash }) => {
            const active = isHashActive(hash);
            return (
              <button
                key={label}
                type="button"
                onClick={() => { window.location.hash = hash; }}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                title={label}
                className={`flex size-10 items-center justify-center rounded-full transition-colors duration-150 ${
                  active
                    ? "bg-linen-mist text-forest-ink font-semibold"
                    : "text-charcoal hover:bg-fog hover:text-forest-ink"
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
          onClick={() => { window.location.hash = "#admin-reference"; }}
          aria-label="Settings"
          title="Settings / Admin"
          className="flex size-10 items-center justify-center rounded-full text-charcoal transition-colors duration-150 hover:bg-fog hover:text-forest-ink"
        >
          <Settings className="size-6" aria-hidden="true" />
        </button>
        <div className="my-1 h-px w-8 bg-pebble" aria-hidden="true" />
        <button
          type="button"
          onClick={logout}
          aria-label="Sign out of account"
          title="Sign out"
          className="flex size-10 items-center justify-center rounded-full text-charcoal transition-colors duration-150 hover:bg-fog hover:text-forest-ink"
        >
          <LogOut className="size-5" aria-hidden="true" />
        </button>
        <div
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-linen-mist font-mono text-xs text-forest-ink"
        >
          {initials}
        </div>
      </div>
    </aside>
  );
};

export default IconRail;
