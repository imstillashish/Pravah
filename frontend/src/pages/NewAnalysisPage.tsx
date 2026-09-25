import React from "react";
import { NewAnalysisDrawer } from "../components/NewAnalysisDrawer";
import { ArrowLeft, Ship } from "lucide-react";

export const NewAnalysisPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-pebble pb-4">
        <div>
          <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
            PAGE 5: NEW FREIGHT ANALYSIS
          </span>
          <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight text-obsidian sm:text-3xl">
            Initiate Predictive Voyage Analysis
          </h1>
          <p className="mt-0.5 text-xs text-slate">
            Enter cargo tonnage, route corridor, laycan window, and plant inventory to compute optimal charter fixture.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.hash = "#dashboard";
          }}
          className="flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3.5 py-2 text-xs font-medium text-charcoal hover:bg-fog"
        >
          <ArrowLeft className="size-3.5" /> Back to Dashboard
        </button>
      </div>

      <div className="rounded-card border border-pebble bg-paper p-8 text-center space-y-4">
        <div className="mx-auto flex size-12 items-center justify-center rounded-card bg-forest-ink/10 text-forest-ink">
          <Ship className="size-6" />
        </div>
        <h2 className="font-sans text-lg font-bold text-obsidian">
          Interactive Parameter Specification Drawer
        </h2>
        <p className="mx-auto max-w-md text-xs text-slate">
          The parameter input drawer is open. Configure the 5 mandatory cargo variables (Commodity, Tonnage, Origin, Destination, Laycan) and optional plant stockout levels.
        </p>
      </div>

      <NewAnalysisDrawer
        isOpen={true}
        onClose={() => {
          window.location.hash = "#dashboard";
        }}
        onAnalysisCreated={() => {
          window.location.hash = "#results";
        }}
      />
    </div>
  );
};

export default NewAnalysisPage;
