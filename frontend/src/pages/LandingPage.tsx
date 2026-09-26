import React from "react";
import {
  Ship,
  TrendingDown,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import { PravahLogo } from "../components/PravahLogo";

export const LandingPage: React.FC<{
  onNavigateToLogin: () => void;
  onNavigateToSignUp: () => void;
}> = ({ onNavigateToLogin, onNavigateToSignUp }) => {
  return (
    <div className="min-h-screen bg-paper text-charcoal">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-pebble bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <PravahLogo size={32} variant="full" />
            <span className="hidden sm:inline rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-forest-ink">
              SIH26006 • SAIL LOGISTICS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="rounded-full border border-forest-ink bg-paper px-4 py-2 text-xs font-medium text-forest-ink hover:bg-fog transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onNavigateToSignUp}
              className="flex items-center gap-1.5 rounded-full bg-lime-voltage px-4 py-2 text-xs font-medium text-forest-ink hover:brightness-95 active:scale-95 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero / Introduction (Section 1) */}
      <section className="relative overflow-hidden border-b border-pebble py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-forest-ink/20 bg-linen-mist px-3.5 py-1 text-xs font-medium text-forest-ink">
            <Sparkles className="size-3.5 text-forest-ink" />
            <span>Intelligent Ocean Freight Decision Support Platform</span>
          </div>

          <h1 className="font-sans text-3xl font-black tracking-[-0.03em] text-obsidian sm:text-5xl lg:text-6xl leading-[1.08]">
            Empowering SAIL with predictive freight forecasting & vessel chartering intelligence.
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-charcoal leading-relaxed">
            Helps SAIL procurement officers decide which ship to hire, when to charter, and at what rate for optimal landed cost across India’s East Coast ports.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onNavigateToSignUp}
              className="flex items-center gap-2 rounded-full bg-lime-voltage px-6 py-3 text-sm font-medium text-forest-ink hover:brightness-95 active:scale-95 transition-all"
            >
              <span>Access SAIL Portal</span>
              <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="rounded-full border border-forest-ink bg-paper px-6 py-3 text-sm font-medium text-forest-ink hover:bg-fog transition-colors"
            >
              Officer Login
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Problem Statement in Simple Numbers */}
      <section className="border-b border-pebble bg-linen-mist/20 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-forest-ink font-semibold">
              The Operational Problem
            </span>
            <h2 className="font-sans text-2xl font-bold tracking-tight text-obsidian sm:text-3xl">
              Manual shipping decisions take too long and risk millions in landed cost variance.
            </h2>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-card border border-pebble bg-paper p-6">
              <div className="font-mono text-3xl font-bold text-alarm-red sm:text-4xl">48+ Hrs</div>
              <h3 className="mt-2 font-sans text-sm font-bold text-obsidian">Slow Charter Decisions</h3>
              <p className="mt-1 text-xs text-charcoal leading-relaxed">
                Traditional broker inquiries and port clearance checks delay charter fixtures during volatile market spikes.
              </p>
            </div>

            <div className="rounded-card border border-pebble bg-paper p-6">
              <div className="font-mono text-3xl font-bold text-forest-ink sm:text-4xl">$4.20/MT</div>
              <h3 className="mt-2 font-sans text-sm font-bold text-obsidian">Sub-Optimal Vessel Allocation</h3>
              <p className="mt-1 text-xs text-charcoal leading-relaxed">
                Mismatching parcel tonnages or chartering laden Capesize to draft-restricted berths incurs severe demurrage.
              </p>
            </div>

            <div className="rounded-card border border-pebble bg-paper p-6">
              <div className="font-mono text-3xl font-bold text-amber-warning sm:text-4xl">₹12 Cr+</div>
              <h3 className="mt-2 font-sans text-sm font-bold text-obsidian">Stockout & Landed Cost Exposure</h3>
              <p className="mt-1 text-xs text-charcoal leading-relaxed">
                Lack of plant inventory lookahead leads to emergency spot bookings and unnecessary premium charter rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: How It Works (4-Step Numbered List) */}
      <section className="border-b border-pebble py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-forest-ink font-semibold">
              Workflow Pipeline
            </span>
            <h2 className="font-sans text-2xl font-bold tracking-tight text-obsidian sm:text-3xl">
              How Pravah Works in 4 Simple Steps
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-card border border-pebble bg-paper p-6 relative">
              <div className="flex size-10 items-center justify-center rounded-full bg-forest-ink font-mono text-sm font-bold text-lime-voltage">
                1
              </div>
              <h3 className="mt-4 font-sans text-base font-bold text-obsidian">Enter Cargo Need</h3>
              <p className="mt-1 text-xs text-charcoal leading-relaxed">
                Provide cargo type, quantity, origin terminal (e.g. Newcastle), destination berth, and target delivery window.
              </p>
            </div>

            <div className="rounded-card border border-pebble bg-paper p-6 relative">
              <div className="flex size-10 items-center justify-center rounded-full bg-forest-ink font-mono text-sm font-bold text-lime-voltage">
                2
              </div>
              <h3 className="mt-4 font-sans text-base font-bold text-obsidian">Predict Prices & Berth Fit</h3>
              <p className="mt-1 text-xs text-charcoal leading-relaxed">
                Pravah runs ARIMA+GBM freight rates, checks physical draft/beam rules at Paradip/Dhamra, and scans risk alerts.
              </p>
            </div>

            <div className="rounded-card border border-pebble bg-paper p-6 relative">
              <div className="flex size-10 items-center justify-center rounded-full bg-forest-ink font-mono text-sm font-bold text-lime-voltage">
                3
              </div>
              <h3 className="mt-4 font-sans text-base font-bold text-obsidian">AI Recommendation</h3>
              <p className="mt-1 text-xs text-charcoal leading-relaxed">
                Get an explainable recommendation score (0.5 cost, 0.3 confidence, 0.2 fit) with comprehensive landed cost breakdown.
              </p>
            </div>

            <div className="rounded-card border border-pebble bg-paper p-6 relative">
              <div className="flex size-10 items-center justify-center rounded-full bg-forest-ink font-mono text-sm font-bold text-lime-voltage">
                4
              </div>
              <h3 className="mt-4 font-sans text-base font-bold text-obsidian">Decide & Book</h3>
              <p className="mt-1 text-xs text-charcoal leading-relaxed">
                Accept recommendation or log override with reason, obtain Plant Manager signoff, and track charter fixture lifecycle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: What You Get (4 Feature Cards) */}
      <section className="border-b border-pebble bg-linen-mist/20 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-forest-ink font-semibold">
              Capabilities
            </span>
            <h2 className="font-sans text-2xl font-bold tracking-tight text-obsidian sm:text-3xl">
              What You Get with Pravah
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-card border border-pebble bg-paper p-6 space-y-2">
              <TrendingDown className="size-6 text-forest-ink" />
              <h3 className="font-sans text-sm font-bold text-obsidian">Freight Rate Forecasting</h3>
              <p className="text-xs text-charcoal leading-relaxed">
                Probabilistic P10, P50, and P90 rates with market driver correlations and bunker fuel surcharges.
              </p>
            </div>

            <div className="rounded-card border border-pebble bg-paper p-6 space-y-2">
              <Ship className="size-6 text-forest-ink" />
              <h3 className="font-sans text-sm font-bold text-obsidian">Berth Draft Feasibility</h3>
              <p className="text-xs text-charcoal leading-relaxed">
                Instant safety pass/fail checks comparing vessel draft and beam against Paradip, Dhamra, Gangavaram, and Haldia.
              </p>
            </div>

            <div className="rounded-card border border-pebble bg-paper p-6 space-y-2">
              <ShieldCheck className="size-6 text-forest-ink" />
              <h3 className="font-sans text-sm font-bold text-obsidian">6-Factor Risk Matrix</h3>
              <p className="text-xs text-charcoal leading-relaxed">
                Monitors cyclone season, congestion queues, geopolitical chokepoints, and disruption alerts with confidence levels.
              </p>
            </div>

            <div className="rounded-card border border-pebble bg-paper p-6 space-y-2">
              <FileCheck className="size-6 text-forest-ink" />
              <h3 className="font-sans text-sm font-bold text-obsidian">Immutable Audit Trail</h3>
              <p className="text-xs text-charcoal leading-relaxed">
                Every user choice, override justification, and manager signoff is logged for regulatory compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Trust / Proof */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8 space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-linen-mist text-forest-ink">
            <AlertTriangle className="size-6" />
          </div>
          <h2 className="font-sans text-xl font-bold tracking-tight text-obsidian sm:text-2xl">
            Transparency & Governance Protocol
          </h2>
          <p className="text-xs text-charcoal leading-relaxed max-w-2xl mx-auto">
            Pravah clearly demarcates ML predictive models from simulated operational feeds. Freight rate forecasts, landed cost calculations, and vessel draft compatibility checks use verified engineering formulas. Baltic broker quotes and real-time ship positions are marked as sample demonstrations.
          </p>

          <div className="pt-4">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-2 rounded-full bg-lime-voltage px-6 py-3 text-xs font-medium text-forest-ink hover:brightness-95 active:scale-95 transition-all"
            >
              <span>Enter Authorized SAIL Portal</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-pebble bg-paper py-6 text-center text-xs text-slate">
        <p>© 2026 Steel Authority of India Limited (SAIL). Pravah Freight Intelligence Platform — SIH26006.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
