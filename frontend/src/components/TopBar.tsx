import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTour } from "../context/TourContext";
import {
  Search,
  ArrowLeftRight,
  Anchor,
  TrendingUp,
  Loader2,
  ChevronDown,
  Menu,
  X,
  LogOut,
  LayoutGrid,
  BarChart3,
  Sliders,
  Layers,
  Ship,
  BookOpen,
  MessageSquareQuote,
  History,
  Shield,
  Users,
  FileText,
  Sparkles,
} from "lucide-react";

export interface TopBarProps {
  currentView?: string;
}

/**
 * Top nav band (48px, Paper + Pebble rule below) — Wise shell.
 * Pill search on a Fog fill; the workspace desk presented as a Wise
 * segmented pill with mono desk code and lime active segment.
 * Includes responsive mobile navigation drawer for screens < 768px.
 */
export const TopBar: React.FC<TopBarProps> = ({ currentView = "dashboard" }) => {
  const { user, switchRole, logout } = useAuth();
  const { isTourActive, startTour, endTour } = useTour();
  const [switching, setSwitching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const isPlanner = user.role === "logistics_planner";
  const targetRole = isPlanner ? "port_operator" : "logistics_planner";

  const handleSwitch = async () => {
    setSwitching(true);
    await switchRole(targetRole);
    setSwitching(false);
  };

  const navItems = [
    { label: "Dashboard", hash: "#dashboard", viewKey: "dashboard", icon: LayoutGrid },
    { label: "Analysis", hash: "#results", viewKey: "results", icon: BarChart3 },
    { label: "Scenario Studio", hash: "#scenario", viewKey: "scenario", icon: Sliders },
    { label: "Demand Board", hash: "#demand", viewKey: "demand", icon: Layers },
    { label: "Live Map", hash: "#live-map", viewKey: "live-map", icon: Ship },
    { label: "Bookings", hash: "#booking", viewKey: "booking", icon: BookOpen },
    { label: "Vendor Quotes", hash: "#quotes", viewKey: "quotes", icon: MessageSquareQuote },
    { label: "History", hash: "#history", viewKey: "history", icon: History },
  ];

  const adminItems = [
    { label: "Admin Ref", hash: "#admin-reference", viewKey: "admin-reference", icon: Shield },
    { label: "Admin Users", hash: "#admin-users", viewKey: "admin-users", icon: Users },
  ];

  const auditItem = { label: "Audit Logs", hash: "#audit-logs", viewKey: "audit-logs", icon: FileText };

  const isItemActive = (viewKey: string) => {
    if (viewKey === "dashboard") return currentView === "dashboard" || currentView === "";
    if (viewKey === "results") return currentView === "results" || currentView === "analysis" || currentView.startsWith("analysis") || currentView === "new-analysis";
    if (viewKey === "booking") return currentView === "booking" || currentView.startsWith("booking") || currentView === "bookings";
    if (viewKey === "demand") return currentView === "demand" || currentView === "demand-board";
    if (viewKey === "quotes") return currentView === "quotes" || currentView === "vendor-quotes";
    if (viewKey === "live-map") return currentView === "live-map" || currentView === "map";
    if (viewKey === "audit-logs") return currentView === "audit-logs" || currentView === "audit";
    return currentView === viewKey;
  };

  const navigateTo = (hash: string) => {
    window.location.hash = hash;
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-pebble bg-paper/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-3 md:pl-[72px] md:pr-4">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open navigation menu"}
          className="flex size-8 items-center justify-center rounded-full text-charcoal hover:bg-fog md:hidden"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>



        {/* Search — Wise pill search on Fog fill */}
        <div className="flex h-10 flex-1 items-center gap-2.5 rounded-full border border-transparent bg-fog px-4 transition-colors duration-150 focus-within:border-forest-ink focus-within:bg-paper">
          <Search className="size-5 text-slate shrink-0" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search routes, vessels, analyses"
            aria-label="Search routes, vessels, analyses"
            className="h-full w-full bg-transparent text-base text-charcoal placeholder:text-slate focus:outline-none"
          />
        </div>

        {/* Primary View Navigation Pills (Desktop) */}
        <nav aria-label="Main Views" className="hidden lg:flex items-center gap-1.5 ml-3">
          {navItems.map((item) => {
            const active = isItemActive(item.viewKey);
            return (
              <button
                key={item.hash}
                type="button"
                onClick={() => navigateTo(item.hash)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-linen-mist text-forest-ink border border-forest-ink/20 shadow-xs"
                    : "text-charcoal hover:bg-fog hover:text-forest-ink"
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {/* Admin Reference and Admin Users only visible if user is admin */}
          {(user.role === "ADMIN" || user.role === "admin") &&
            adminItems.map((item) => {
              const active = isItemActive(item.viewKey);
              return (
                <button
                  key={item.hash}
                  type="button"
                  onClick={() => navigateTo(item.hash)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-linen-mist text-forest-ink border border-forest-ink/20 shadow-xs"
                      : "text-charcoal hover:bg-fog hover:text-forest-ink"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

          <button
            type="button"
            onClick={() => navigateTo(auditItem.hash)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              isItemActive(auditItem.viewKey)
                ? "bg-linen-mist text-forest-ink border border-forest-ink/20 shadow-xs"
                : "text-charcoal hover:bg-fog hover:text-forest-ink"
            }`}
          >
            {auditItem.label}
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Feature Tour Pill */}
          <button
            type="button"
            onClick={() => (isTourActive ? endTour() : startTour())}
            data-tour-trigger="start"
            aria-label="Start Microscopic Feature Tour"
            className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition duration-150 cursor-pointer ${
              isTourActive
                ? "border-forest-ink bg-lime-voltage text-forest-ink shadow-xs"
                : "border-forest-ink/20 bg-lime-voltage/30 text-forest-ink hover:bg-lime-voltage hover:border-forest-ink"
            }`}
          >
            <Sparkles className="size-3.5 text-forest-ink" aria-hidden="true" />
            <span className="hidden sm:inline">{isTourActive ? "In Tour" : "Feature Tour"}</span>
          </button>

          {/* Desk pill — Wise segmented style, mono desk code */}
          <div className="hidden h-8 items-center gap-2.5 rounded-full border border-pebble bg-fog px-3 md:flex">
            <div className="leading-tight">
              <div className="text-[11px] font-semibold text-forest-ink">
                {isPlanner ? "Freight Planner" : "Port Operator"}
              </div>
              <div className="max-w-[160px] truncate text-[10px] text-charcoal">
                {user.full_name}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSwitch}
              disabled={switching}
              aria-label={
                isPlanner
                  ? "Switch to Vessel and Port Operations"
                  : "Switch to Freight and Chartering Desk"
              }
              className="ml-1 flex items-center gap-1 rounded-full bg-lime-voltage px-2 py-0.5 font-mono text-[10px] font-semibold text-forest-ink transition duration-150 hover:brightness-95 disabled:opacity-40"
            >
              {switching ? (
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowLeftRight className="size-3" aria-hidden="true" />
              )}
              <span className="hidden xl:inline">{isPlanner ? "OPS" : "FRT"}</span>
            </button>
          </div>

          {/* Mobile fallback: compact switch chip with mono desk code */}
          <button
            type="button"
            onClick={handleSwitch}
            disabled={switching}
            aria-label={
              isPlanner
                ? "Switch to Vessel and Port Operations"
                : "Switch to Freight and Chartering Desk"
            }
            className="flex h-8 items-center gap-1.5 rounded-full border border-pebble bg-paper px-2 text-forest-ink transition-colors duration-150 hover:border-forest-ink md:hidden"
          >
            {isPlanner ? (
              <TrendingUp className="size-4 text-forest-ink" aria-hidden="true" />
            ) : (
              <Anchor className="size-4 text-forest-ink" aria-hidden="true" />
            )}
            <span className="text-[11px] font-medium">{isPlanner ? "Freight Planner" : "Port Operator"}</span>
            <ChevronDown className="size-3 text-slate" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-pebble bg-paper px-4 py-4 md:hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              if (isTourActive) {
                endTour();
              } else {
                startTour();
              }
            }}
            className="mb-3 w-full flex items-center justify-center gap-2 rounded-full border border-forest-ink/30 bg-lime-voltage py-2 text-xs font-bold text-forest-ink shadow-xs"
          >
            <Sparkles className="size-4" />
            <span>{isTourActive ? "Exit Feature Tour" : "Start Feature Tour (28 Steps)"}</span>
          </button>

          <div className="mb-3 flex items-center justify-between border-b border-pebble pb-3">
            <div>
              <div className="font-sans text-sm font-semibold text-forest-ink">{user.full_name}</div>
              <div className="font-mono text-xs text-slate">{user.email}</div>
            </div>
            <button
              type="button"
              onClick={handleSwitch}
              disabled={switching}
              className="flex items-center gap-1 rounded-full bg-lime-voltage px-2.5 py-1 font-mono text-[11px] font-semibold text-forest-ink"
            >
              {switching ? <Loader2 className="size-3 animate-spin" /> : <ArrowLeftRight className="size-3" />}
              <span>Switch to {isPlanner ? "OPS" : "FR8"}</span>
            </button>
          </div>

          <nav aria-label="Mobile Navigation" className="grid grid-cols-2 gap-1.5 py-2">
            {[...navItems, ...((user.role === "ADMIN" || user.role === "admin") ? adminItems : []), auditItem].map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.viewKey);
              return (
                <button
                  key={item.hash}
                  type="button"
                  onClick={() => navigateTo(item.hash)}
                  className={`flex items-center gap-2 rounded-card px-3 py-2 text-left text-xs font-medium transition-colors ${
                    active
                      ? "bg-linen-mist text-forest-ink font-bold border border-forest-ink/20"
                      : "text-charcoal hover:bg-fog"
                  }`}
                >
                  <Icon className="size-4 shrink-0 text-forest-ink" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-3 flex items-center justify-between border-t border-pebble pt-3">
            <button
              type="button"
              onClick={() => navigateTo("#landing")}
              className="text-xs font-medium text-slate hover:text-forest-ink"
            >
              Public Overview
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-full border border-alarm-red/40 bg-fog px-3 py-1.5 text-xs font-semibold text-alarm-red hover:bg-alarm-red hover:text-paper transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default TopBar;
