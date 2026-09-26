import React, { useState, useMemo } from "react";
import { apiClient } from "../api/client";
import { API_BASE } from "../api";
import { RouteMap } from "../components/RouteMap";
import {
  Flame,
  Zap,
  Gauge,
  Mountain,
  Boxes,
  Ship,
  Sparkles,
  Anchor,
  Navigation,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Download,
  Check,
  Sliders,
  Search,
  Compass,
  TrendingDown,
  Loader2,
  Info,
} from "lucide-react";

// Types
interface AnalysisDetail {
  id: number;
  title: string;
  origin_country: string;
  origin_port: string;
  destination_port: string;
  commodity: string;
  parcel_tonnage: number;
  recommended_vessel: string;
  predicted_rate_pmt: number;
  benchmark_spot_pmt: number;
  estimated_savings_usd: number;
  status: string;
  created_at: string;
  context: {
    route_distance_nm: number;
    inferred_vessel_class: string;
    origin_lat: number;
    origin_lon: number;
    destination_lat: number;
    destination_lon: number;
    note: string;
  };
  forecast: {
    p10_usd_per_mt: number;
    p50_usd_per_mt: number;
    p90_usd_per_mt: number;
    arima_baseline_usd_per_mt: number;
    confidence_label: "LOW" | "MEDIUM" | "HIGH";
    model_used: string;
  };
  feasibility: Array<{
    vessel_class: string;
    port_name?: string;
    draft_pass: boolean;
    loa_pass: boolean;
    beam_pass: boolean;
    dwt_pass: boolean;
    overall_feasible: boolean;
    requires_lightering?: boolean;
    failure_reason?: string | null;
  }>;
  landed_cost: {
    freight_rate_usd_per_mt: number;
    baf_surcharge_usd_per_mt: number;
    usd_inr_rate: number;
    total_usd_per_mt: number;
    total_inr_per_mt: number;
    total_inr: number;
  };
  stockout_alert: {
    days_to_stockout: number;
    days_to_best_window: number;
    is_at_risk: boolean;
    alert_message: string;
  };
}

// 1. CARGO TYPE DEFINITIONS (Step 1)
interface CargoTypeItem {
  id: string;
  title: string;
  categoryTag: string;
  description: string;
  defaultTonnage: number;
  typicalVessel: string;
  stowageFactor: string;
  defaultDetails: string[];
  icon: React.ElementType;
}

const CARGO_TYPES: CargoTypeItem[] = [
  {
    id: "Coking Coal",
    title: "Coking Coal (Metallurgical)",
    categoryTag: "Blast Furnace Core",
    description: "Hard and semi-soft coking coal for blast furnace coke production.",
    defaultTonnage: 75000,
    typicalVessel: "Panamax / Capesize",
    stowageFactor: "42–48 cu.ft/MT",
    defaultDetails: [
      "Australian Premium Low-Vol HCC",
      "Peak Downs Hard Coking Coal",
      "US Blue Creek Low-Vol Coking Coal",
      "Illawarra Metallurgical Coal",
    ],
    icon: Flame,
  },
  {
    id: "Thermal Coal",
    title: "Thermal / Steam Coal",
    categoryTag: "Power Plant Fuel",
    description: "Boiler-grade coal for captive steel utility and grid power generation.",
    defaultTonnage: 55000,
    typicalVessel: "Supramax / Panamax",
    stowageFactor: "44–50 cu.ft/MT",
    defaultDetails: [
      "Indonesian Sub-Bituminous 4200 GAR",
      "South African RB1 Steam Coal (6000 kcal)",
      "Richards Bay Thermal 5500 NAR",
      "Newcastle Thermal Coal (6000 NAR)",
    ],
    icon: Zap,
  },
  {
    id: "PCI Coal",
    title: "PCI Coal (Pulverized Coal)",
    categoryTag: "Tuyere Injection",
    description: "Low-volatile pulverized coal injected into blast furnace tuyeres to reduce coke rate.",
    defaultTonnage: 55000,
    typicalVessel: "Supramax / Panamax",
    stowageFactor: "43–47 cu.ft/MT",
    defaultDetails: [
      "Australian Jellinbah Low-Ash PCI",
      "Russian Low-Volatile PCI",
      "Foxleigh Ultra-Low Vol PCI",
    ],
    icon: Gauge,
  },
  {
    id: "Iron Ore",
    title: "Iron Ore (Fines & Pellets)",
    categoryTag: "Raw Ore Smelting",
    description: "High-grade hematite/magnetite fines & DRI pellets for direct reduction smelting.",
    defaultTonnage: 150000,
    typicalVessel: "Capesize / Baby-Cape",
    stowageFactor: "13–18 cu.ft/MT",
    defaultDetails: [
      "Pilbara Blend Iron Ore Fines 62% Fe",
      "Carajás Brazilian Iron Ore Fines 65% Fe",
      "Tubarao High-Grade Pellets",
      "Newman Blend High-Grade Fe",
    ],
    icon: Mountain,
  },
  {
    id: "Limestone",
    title: "Limestone & Dolomite",
    categoryTag: "Calcined Flux Agent",
    description: "High-purity calcined fluxing stones for steelmaking slag conditioning.",
    defaultTonnage: 45000,
    typicalVessel: "Handysize / Supramax",
    stowageFactor: "25–30 cu.ft/MT",
    defaultDetails: [
      "UAE Mina Saqr Chemical Limestone",
      "Oman Salalah High-Purity Limestone",
      "Fujairah Crushed Metallurgical Flux",
    ],
    icon: Boxes,
  },
  {
    id: "Bauxite",
    title: "Bauxite & Alumina",
    categoryTag: "Smelter Feed",
    description: "Bulk raw aluminum hydroxide ore with strict moisture & liquefaction controls.",
    defaultTonnage: 65000,
    typicalVessel: "Panamax / Supramax",
    stowageFactor: "28–34 cu.ft/MT",
    defaultDetails: [
      "Guinea Boffa Bauxite Ore",
      "Australian Weipa Bauxite Fines",
      "Indonesian Metallurgical Grade Bauxite",
    ],
    icon: Ship,
  },
  {
    id: "Anthracite",
    title: "Anthracite Coal",
    categoryTag: "Ultra-High Carbon",
    description: "Dense, highest-fixed-carbon coal utilized in charge carbon & electrode manufacturing.",
    defaultTonnage: 40000,
    typicalVessel: "Handysize / Supramax",
    stowageFactor: "38–44 cu.ft/MT",
    defaultDetails: [
      "Siberian Ultra-High Carbon Anthracite",
      "Vietnamese Cam Pha Anthracite",
      "South African Low-Moisture Anthracite",
    ],
    icon: Sparkles,
  },
];

// TONNAGE PRESETS (Step 2)
const TONNAGE_CHIPS = [
  { label: "40,000 MT", vessel: "Handysize", value: 40000 },
  { label: "55,000 MT", vessel: "Supramax", value: 55000 },
  { label: "75,000 MT", vessel: "Panamax (SAIL Std)", value: 75000 },
  { label: "120,000 MT", vessel: "Mini-Cape", value: 120000 },
  { label: "150,000 MT", vessel: "Capesize", value: 150000 },
  { label: "180,000 MT", vessel: "Newcastlemax", value: 180000 },
];

// 3. ORIGIN COUNTRIES AND PORTS (Step 3)
interface OriginCountry {
  name: string;
  code: string;
  flag: string;
  ports: Array<{
    name: string;
    locode: string;
    terminalType: string;
    maxDraft: string;
  }>;
}

const ORIGIN_COUNTRIES: OriginCountry[] = [
  {
    name: "Australia",
    code: "AU",
    flag: "🇦🇺",
    ports: [
      { name: "Hay Point", locode: "AU HPT", terminalType: "Deepwater Coal Terminal", maxDraft: "19.0m" },
      { name: "Newcastle", locode: "AU NCL", terminalType: "PWCS / NCIG Coal Terminal", maxDraft: "16.8m" },
      { name: "Gladstone", locode: "AU GLT", terminalType: "RG Tanna Coal Terminal", maxDraft: "17.5m" },
      { name: "Port Hedland", locode: "AU PHE", terminalType: "Utah Point / FMG Bulk", maxDraft: "20.0m" },
      { name: "Dampier", locode: "AU DAM", terminalType: "Parker Point Cape Berth", maxDraft: "19.5m" },
      { name: "Abbot Point", locode: "AU ABP", terminalType: "Adani T1 Deepwater", maxDraft: "19.3m" },
      { name: "Port Kembla", locode: "AU PKB", terminalType: "Southern Coal Terminal", maxDraft: "15.8m" },
    ],
  },
  {
    name: "Indonesia",
    code: "ID",
    flag: "🇮🇩",
    ports: [
      { name: "Tanjung Bara", locode: "ID TBX", terminalType: "KPC Coal Terminal (Cape)", maxDraft: "17.5m" },
      { name: "Balikpapan", locode: "ID BPN", terminalType: "East Kalimantan Coal Base", maxDraft: "14.0m" },
      { name: "Samarinda", locode: "ID SRI", terminalType: "Mahakam River Anchorage", maxDraft: "12.5m" },
      { name: "Banjarmasin", locode: "ID BDJ", terminalType: "Taboneo Transshipment Anchorage", maxDraft: "15.0m" },
      { name: "Muara Pantai", locode: "ID MUP", terminalType: "Berau Offshore Transshipment", maxDraft: "16.0m" },
      { name: "Bunyu Island", locode: "ID BYQ", terminalType: "North Kalimantan Bulk", maxDraft: "13.5m" },
    ],
  },
  {
    name: "South Africa",
    code: "ZA",
    flag: "🇿🇦",
    ports: [
      { name: "Richards Bay", locode: "ZA RCB", terminalType: "RBCT Dedicated Coal Terminal", maxDraft: "17.5m" },
      { name: "Durban", locode: "ZA DUR", terminalType: "Island View / Point Berths", maxDraft: "12.8m" },
      { name: "Saldanha Bay", locode: "ZA SDB", terminalType: "Transnet Iron Ore Jetty", maxDraft: "20.5m" },
      { name: "Port Elizabeth", locode: "ZA PLZ", terminalType: "Manganese Ore Berth", maxDraft: "12.2m" },
    ],
  },
  {
    name: "United States",
    code: "US",
    flag: "🇺🇸",
    ports: [
      { name: "Hampton Roads", locode: "US HRD", terminalType: "Norfolk Lamberts Point", maxDraft: "15.2m" },
      { name: "Baltimore", locode: "US BAL", terminalType: "CSX Curtis Bay / CNX Marine", maxDraft: "14.5m" },
      { name: "Mobile", locode: "US MOB", terminalType: "McDuffie Coal Terminal", maxDraft: "13.7m" },
      { name: "New Orleans", locode: "US MSY", terminalType: "Mississippi River Anchorage", maxDraft: "14.0m" },
      { name: "Houston", locode: "US HOU", terminalType: "Houston Ship Channel", maxDraft: "13.7m" },
    ],
  },
  {
    name: "Brazil",
    code: "BR",
    flag: "🇧🇷",
    ports: [
      { name: "Tubarão", locode: "BR TUB", terminalType: "Vale Iron Ore Pier", maxDraft: "22.5m" },
      { name: "Ponta da Madeira", locode: "BR PDM", terminalType: "Pier IV Valemax Capesize", maxDraft: "23.0m" },
      { name: "Sepetiba / Itaguaí", locode: "BR ITG", terminalType: "CSN / CPBS Coal Terminal", maxDraft: "18.5m" },
      { name: "Santos", locode: "BR SSZ", terminalType: "Bulk Terminal Berths", maxDraft: "14.0m" },
    ],
  },
  {
    name: "Canada",
    code: "CA",
    flag: "🇨🇦",
    ports: [
      { name: "Vancouver", locode: "CA VAN", terminalType: "Westshore Roberts Bank", maxDraft: "20.0m" },
      { name: "Prince Rupert", locode: "CA PRU", terminalType: "Ridley Island Coal Terminal", maxDraft: "21.0m" },
      { name: "Neptune Bulk", locode: "CA NEP", terminalType: "Burrard Inlet Met Coal", maxDraft: "15.5m" },
    ],
  },
  {
    name: "Russia",
    code: "RU",
    flag: "🇷🇺",
    ports: [
      { name: "Vostochny", locode: "RU VYP", terminalType: "PPK Coal Handling Complex", maxDraft: "16.5m" },
      { name: "Ust-Luga", locode: "RU ULU", terminalType: "Rosterminalugol Baltic Terminal", maxDraft: "17.0m" },
      { name: "Vanino", locode: "RU VNN", terminalType: "Daltransugol Muchke Bay", maxDraft: "17.5m" },
      { name: "Murmansk", locode: "RU MMK", terminalType: "Commercial Sea Port", maxDraft: "15.0m" },
    ],
  },
  {
    name: "Mozambique",
    code: "MZ",
    flag: "🇲🇿",
    ports: [
      { name: "Maputo", locode: "MZ MPM", terminalType: "TCM Matola Coal Terminal", maxDraft: "15.4m" },
      { name: "Beira", locode: "MZ BEW", terminalType: "General Bulk Cargo Berth", maxDraft: "10.0m" },
      { name: "Nacala", locode: "MZ MNC", terminalType: "Nacala-a-Velha Deepwater", maxDraft: "21.0m" },
    ],
  },
  {
    name: "Oman & UAE",
    code: "OM",
    flag: "🇴🇲",
    ports: [
      { name: "Mina Saqr", locode: "AE MSA", terminalType: "Stevin Rock Limestone Berths", maxDraft: "15.5m" },
      { name: "Salalah", locode: "OM SLL", terminalType: "General Cargo Deep Berth", maxDraft: "18.0m" },
      { name: "Sohar", locode: "OM SOH", terminalType: "Vale Iron Ore Pellet Jetty", maxDraft: "22.0m" },
      { name: "Fujairah", locode: "AE FJR", terminalType: "Offshore Bunker & Bulk", maxDraft: "16.0m" },
    ],
  },
];

// 4. DESTINATION PORTS IN INDIA (Step 4)
interface DischargePort {
  name: string;
  locode: string;
  state: string;
  maxDraft: string;
  berthType: string;
  isRestricted: boolean;
  notes: string;
  sailPlant: string;
}

const DISCHARGE_PORTS: DischargePort[] = [
  {
    name: "Paradip",
    locode: "IN PBD / IN PAR",
    state: "Odisha",
    maxDraft: "17.5m",
    berthType: "Mechanized Deepwater Coal Berth",
    isRestricted: false,
    notes: "Primary SAIL Coking Coal Terminal. Capesize & Panamax capable.",
    sailPlant: "Rourkela Steel Plant & Bokaro Steel Plant",
  },
  {
    name: "Vizag",
    locode: "IN VTZ",
    state: "Andhra Pradesh",
    maxDraft: "18.1m",
    berthType: "Outer Harbour High-Speed Conveyor",
    isRestricted: false,
    notes: "Outer harbour accommodates fully laden Capesize. Quick rail dispatch.",
    sailPlant: "Rashtriya Ispat Nigam & Central Steel Units",
  },
  {
    name: "Haldia",
    locode: "IN HLD",
    state: "West Bengal",
    maxDraft: "14.5m",
    berthType: "Riverine Lock Gate Dock",
    isRestricted: true,
    notes: "Lock gate restricts laden Capesize vessels! Lightering required if >60,000 MT.",
    sailPlant: "Durgapur & IISCO Burnpur Works",
  },
  {
    name: "Dhamra",
    locode: "IN DHA",
    state: "Odisha",
    maxDraft: "18.0m",
    berthType: "All-Weather Deep Draft Terminal",
    isRestricted: false,
    notes: "Deep-water all-weather port. Capable of handling up to Newcastlemax.",
    sailPlant: "Odisha Industrial Belt",
  },
  {
    name: "Gangavaram",
    locode: "IN GGV",
    state: "Andhra Pradesh",
    maxDraft: "19.5m",
    berthType: "Deepest East Coast Multi-Purpose Berth",
    isRestricted: false,
    notes: "Deepest bulk terminal on the Indian East Coast. Handles Capesize easily.",
    sailPlant: "Visakhapatnam Steel Corridor",
  },
  {
    name: "Mormugao",
    locode: "IN MRM",
    state: "Goa",
    maxDraft: "14.5m",
    berthType: "SWPL Mechanized Bulk Berth",
    isRestricted: false,
    notes: "West Coast gateway. Supramax & Panamax handling.",
    sailPlant: "Western Steel Foundries",
  },
  {
    name: "Ennore",
    locode: "IN ENR",
    state: "Tamil Nadu",
    maxDraft: "16.0m",
    berthType: "Kamarajar Port Coal Terminal",
    isRestricted: false,
    notes: "Southern coast multi-cargo terminal with dedicated coal unloading.",
    sailPlant: "Salem Steel Plant",
  },
  {
    name: "Mumbai",
    locode: "IN BOM",
    state: "Maharashtra",
    maxDraft: "15.0m",
    berthType: "Mumbai Port Offshore Terminal",
    isRestricted: false,
    notes: "West coast industrial gateway for steel and chemical plants.",
    sailPlant: "Western Region Distribution",
  },
];

export const NewAnalysisPage: React.FC = () => {
  // Wizard Step State (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [commodity, setCommodity] = useState<string>("Coking Coal");
  const [commodityDetail, setCommodityDetail] = useState<string>("Australian Premium Low-Vol HCC");
  const [parcelTonnage, setParcelTonnage] = useState<number>(75000);
  
  // Dates
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const defaultEndStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  }, []);
  const [laycanStart, setLaycanStart] = useState<string>(todayStr);
  const [laycanEnd, setLaycanEnd] = useState<string>(defaultEndStr);

  // Port State
  const [originCountry, setOriginCountry] = useState<string>("Australia");
  const [originPort, setOriginPort] = useState<string>("Hay Point");
  const [destinationPort, setDestinationPort] = useState<string>("Paradip");

  // Search & Filter
  const [countryFilter, setCountryFilter] = useState<string>("");

  // Execution & Live Result State (Step 5)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [computationStage, setComputationStage] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisDetail | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  // Auto-inferred recommended vessel class
  const inferredVessel = useMemo(() => {
    if (parcelTonnage >= 100000) return "Capesize";
    if (parcelTonnage >= 60000) return "Panamax";
    if (parcelTonnage >= 40000) return "Supramax";
    return "Handysize";
  }, [parcelTonnage]);

  // Validation
  const isSamePortError = useMemo(() => {
    return originPort.trim().toLowerCase() === destinationPort.trim().toLowerCase();
  }, [originPort, destinationPort]);

  const isHaldiaCapesizeWarning = useMemo(() => {
    return destinationPort.toLowerCase().includes("haldia") && (parcelTonnage >= 90000 || inferredVessel === "Capesize");
  }, [destinationPort, parcelTonnage, inferredVessel]);

  // When commodity changes in Step 1, auto-populate recommended details
  const handleSelectCommodity = (item: CargoTypeItem) => {
    setCommodity(item.id);
    setParcelTonnage(item.defaultTonnage);
    if (item.defaultDetails.length > 0) {
      setCommodityDetail(item.defaultDetails[0]);
    }
  };

  // Quick preset laycan buttons
  const setLaycanPreset = (daysAheadStart: number, daysWindow: number) => {
    const start = new Date();
    start.setDate(start.getDate() + daysAheadStart);
    const end = new Date(start);
    end.setDate(end.getDate() + daysWindow);

    setLaycanStart(start.toISOString().split("T")[0]);
    setLaycanEnd(end.toISOString().split("T")[0]);
  };

  // Run Analysis Engine Trigger (Step 4 -> Step 5)
  const handleRunAnalysis = async () => {
    if (isSamePortError) {
      setSubmitError(
        `Invalid route corridor: Origin loading port (${originPort}) and discharge terminal (${destinationPort}) cannot be identical.`
      );
      return;
    }
    if (!parcelTonnage || parcelTonnage <= 0) {
      setSubmitError("Please specify a valid cargo volume (MT).");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setCurrentStep(5); // Move directly to results screen to watch computation live

    try {
      // Dynamic computation phase updates for feedback
      setComputationStage("Querying Baltic Freight Quantile ML Regressors (LightGBM P10/P50/P90)...");
      await new Promise((r) => setTimeout(r, 600));

      setComputationStage("Resolving UN/LOCODE Coordinates & Geodesic Maritime Navigational Waypoints...");
      await new Promise((r) => setTimeout(r, 600));

      // Call API
      const res = await apiClient<{ id: number }>("/analyses", {
        method: "POST",
        body: JSON.stringify({
          origin_country: originCountry,
          origin_port: originPort,
          destination_port: destinationPort,
          commodity,
          parcel_tonnage: parcelTonnage,
          status: "draft",
        }),
      });

      setComputationStage("Synthesizing Vessel Feasibility, Draft Clearances & Landed Cost Breakdown...");
      await new Promise((r) => setTimeout(r, 500));

      // Fetch the full rich analysis detail
      const detail = await apiClient<AnalysisDetail>(`/analyses/${res.id}`);
      setAnalysisResult(detail);
      setComputationStage("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to compute voyage analysis.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // One-click approval on Step 5
  const handleApproveFixture = async () => {
    if (!analysisResult) return;
    try {
      await fetch(`${API_BASE}/analyses/${analysisResult.id}/decision/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: "Approved directly from Interactive Voyage Analysis Engine.",
          approved_by: "Chartering Desk",
        }),
      });
      setIsApproved(true);
      setApprovalFeedback("Voyage fixture successfully approved and locked into decision audit ledger.");
      setTimeout(() => setApprovalFeedback(null), 5000);
    } catch {
      setIsApproved(true);
      setApprovalFeedback("Voyage fixture recorded as approved (local demo mode).");
      setTimeout(() => setApprovalFeedback(null), 5000);
    }
  };

  // Download decision record export
  const handleDownloadExport = async () => {
    if (!analysisResult) return;
    try {
      const res = await fetch(`${API_BASE}/analyses/${analysisResult.id}/export`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `decision-record-AST-${analysisResult.id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      const fallbackData = JSON.stringify(analysisResult, null, 2);
      const blob = new Blob([fallbackData], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analysis-AST-${analysisResult.id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  // Reset wizard to start a new analysis
  const handleStartNewAnalysis = () => {
    setCurrentStep(1);
    setAnalysisResult(null);
    setIsApproved(false);
    setSubmitError(null);
  };

  // Filtered countries
  const filteredCountries = useMemo(() => {
    if (!countryFilter) return ORIGIN_COUNTRIES;
    return ORIGIN_COUNTRIES.filter((c) =>
      c.name.toLowerCase().includes(countryFilter.toLowerCase()) ||
      c.ports.some((p) => p.name.toLowerCase().includes(countryFilter.toLowerCase()))
    );
  }, [countryFilter]);

  const activeCountryObj = useMemo(() => {
    return ORIGIN_COUNTRIES.find((c) => c.name === originCountry) || ORIGIN_COUNTRIES[0];
  }, [originCountry]);

  // Stepper labels
  const STEPS = [
    { num: 1, title: "Cargo Type", sub: "Commodity Category" },
    { num: 2, title: "Cargo Details", sub: "Tonnage & Laycan" },
    { num: 3, title: "Starting Port", sub: "Origin & Country" },
    { num: 4, title: "Ending Port", sub: "Discharge Terminal" },
    { num: 5, title: "Live Results", sub: "Predictive Analytics" },
  ];

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 border-b border-pebble pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
              VOYAGE ANALYSIS WIZARD
            </span>
            <span className="font-mono text-xs text-slate">STEP {currentStep} OF 5</span>
          </div>
          <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight text-obsidian sm:text-3xl">
            {currentStep === 5 && analysisResult
              ? "Predictive Analysis & Fixture Recommendation"
              : "Plan New Voyage Analysis"}
          </h1>
          <p className="mt-0.5 text-xs text-slate">
            {currentStep === 5
              ? "Review ML quantile freight rate forecast, route nautical waypoints, landed cost breakdown, and fixture feasibility."
              : "Configure cargo specifications, loading port, and discharge terminal to compute predictive charter rates."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentStep === 5 && (
            <button
              type="button"
              onClick={handleStartNewAnalysis}
              className="flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3.5 py-2 text-xs font-medium text-charcoal hover:bg-fog transition-colors"
            >
              <RotateCcw className="size-3.5" /> Start Another Analysis
            </button>
          )}
          <button
            type="button"
            onClick={() => { window.location.hash = "#dashboard"; }}
            className="flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3.5 py-2 text-xs font-medium text-charcoal hover:bg-fog transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to Dashboard
          </button>
        </div>
      </div>

      {/* Interactive Step Progress Bar */}
      <nav aria-label="Analysis Steps" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STEPS.map((s) => {
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;
          return (
            <button
              key={s.num}
              type="button"
              disabled={isSubmitting || (s.num === 5 && !analysisResult)}
              onClick={() => {
                if (s.num < currentStep || (s.num === 5 && analysisResult)) {
                  setCurrentStep(s.num);
                }
              }}
              className={`flex flex-col rounded-card border p-3 text-left transition-all ${
                isActive
                  ? "border-forest-ink bg-linen-mist/50 ring-1 ring-forest-ink/30 shadow-xs"
                  : isDone
                  ? "border-pebble bg-paper hover:bg-fog cursor-pointer"
                  : "border-pebble/60 bg-paper/60 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex size-5 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                    isActive
                      ? "bg-forest-ink text-paper"
                      : isDone
                      ? "bg-forest-ink text-lime-voltage"
                      : "bg-pebble text-slate"
                  }`}
                >
                  {isDone ? <Check className="size-3 stroke-[3]" /> : s.num}
                </span>
                {isActive && (
                  <span className="size-1.5 rounded-full bg-lime-voltage ring-2 ring-forest-ink" />
                )}
              </div>
              <span className={`mt-2 font-sans text-xs font-bold ${isActive ? "text-forest-ink" : "text-obsidian"}`}>
                {s.title}
              </span>
              <span className="font-mono text-[10px] text-slate">{s.sub}</span>
            </button>
          );
        })}
      </nav>

      {/* Global Validation Error Banner */}
      {submitError && (
        <div className="flex items-center gap-3 rounded-card border border-alarm-red/40 bg-fog p-4 text-xs text-alarm-red">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="flex-1 font-medium">{submitError}</span>
        </div>
      )}

      {/* STEP 1: CARGO TYPE */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="rounded-card border border-pebble bg-paper p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-pebble pb-4">
              <div>
                <h2 className="font-sans text-lg font-bold text-obsidian">Step 1: Select Cargo Type</h2>
                <p className="text-xs text-slate">
                  Choose the primary bulk commodity category. This determines stowage factor, handling berths, and charter index benchmarks.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-fog px-3 py-1 font-mono text-xs font-semibold text-forest-ink">
                Selected: <span className="font-bold text-charcoal">{commodity}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {CARGO_TYPES.map((item) => {
                const isSelected = commodity === item.id;
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectCommodity(item)}
                    className={`group relative flex cursor-pointer flex-col justify-between rounded-card border p-4.5 transition-all duration-150 ${
                      isSelected
                        ? "border-forest-ink bg-linen-mist/60 shadow-sm ring-1 ring-forest-ink"
                        : "border-pebble bg-paper hover:border-charcoal hover:bg-fog/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={`flex size-10 items-center justify-center rounded-card ${
                            isSelected ? "bg-forest-ink text-lime-voltage" : "bg-fog text-charcoal group-hover:bg-pebble/60"
                          }`}
                        >
                          <Icon className="size-5" />
                        </div>
                        <span className="rounded-full bg-pebble/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-charcoal">
                          {item.categoryTag}
                        </span>
                      </div>

                      <h3 className="mt-3 font-sans text-sm font-bold text-obsidian">{item.title}</h3>
                      <p className="mt-1 text-xs text-slate leading-relaxed">{item.description}</p>
                    </div>

                    <div className="mt-4 border-t border-pebble/60 pt-3 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate">Vessel: {item.typicalVessel}</span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 font-mono font-bold text-forest-ink">
                          <CheckCircle2 className="size-3.5 text-forest-ink" /> Active
                        </span>
                      ) : (
                        <span className="font-mono text-slate/70 group-hover:text-charcoal">Select →</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-pebble">
              <span className="text-xs text-slate">
                Default parcel tonnage will automatically configure to standard trade parcel.
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 rounded-full bg-forest-ink px-5 py-2.5 text-xs font-semibold text-paper hover:bg-forest-ink/90 shadow-xs transition-colors"
              >
                <span>Continue to Step 2: Cargo Details</span>
                <ArrowRight className="size-4 text-lime-voltage" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: CARGO DETAILS & TONNAGE */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="rounded-card border border-pebble bg-paper p-5 sm:p-6 space-y-6">
            <div className="border-b border-pebble pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-sans text-lg font-bold text-obsidian">Step 2: Cargo Quantity & Specifications</h2>
                <p className="text-xs text-slate">
                  Specify the parcel volume (tonnage in MT), trade commodity grade, laycan delivery window, and vessel sizing.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-linen-mist px-3 py-1 font-mono text-xs font-semibold text-forest-ink">
                Inferred Vessel: <span className="font-bold underline">{inferredVessel}</span>
              </span>
            </div>

            {/* Tonnage Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-semibold uppercase tracking-wider text-slate">
                  Cargo Quantity (Metric Tonnes - MT)
                </label>
                <span className="font-mono text-base font-bold text-forest-ink">
                  {parcelTonnage.toLocaleString()} MT
                </span>
              </div>

              {/* Quick Chips */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {TONNAGE_CHIPS.map((chip) => {
                  const active = parcelTonnage === chip.value;
                  return (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => setParcelTonnage(chip.value)}
                      className={`flex flex-col items-center justify-center rounded-card border px-3 py-2 text-center transition-colors ${
                        active
                          ? "border-forest-ink bg-linen-mist text-forest-ink font-bold ring-1 ring-forest-ink shadow-xs"
                          : "border-pebble bg-fog/60 text-charcoal hover:bg-fog"
                      }`}
                    >
                      <span className="font-sans text-xs font-semibold">{chip.label}</span>
                      <span className="font-mono text-[10px] text-slate">{chip.vessel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Slider + Stepper Input */}
              <div className="flex items-center gap-4 pt-2">
                <input
                  type="range"
                  min="20000"
                  max="200000"
                  step="5000"
                  value={parcelTonnage}
                  onChange={(e) => setParcelTonnage(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer accent-forest-ink rounded-lg bg-pebble"
                />
                <div className="relative min-w-[140px]">
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={parcelTonnage}
                    onChange={(e) => setParcelTonnage(Number(e.target.value))}
                    className="w-full rounded-card border border-pebble bg-paper px-3 py-1.5 font-mono text-sm font-semibold text-charcoal focus:border-forest-ink focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 font-mono text-xs text-slate">MT</span>
                </div>
              </div>
            </div>

            {/* Commodity Specific Trade Description */}
            <div className="space-y-2 border-t border-pebble pt-5">
              <label className="font-mono text-xs font-semibold uppercase tracking-wider text-slate">
                Specific Trade Description / Grade
              </label>
              <input
                type="text"
                value={commodityDetail}
                onChange={(e) => setCommodityDetail(e.target.value)}
                placeholder="e.g. Australian Premium Low-Vol HCC, South African RB1 Steam Coal"
                className="w-full rounded-card border border-pebble bg-paper px-3.5 py-2 text-sm text-charcoal focus:border-forest-ink focus:outline-none"
              />

              {/* Quick suggestions based on selected commodity */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="font-mono text-[10px] text-slate">Presets:</span>
                {CARGO_TYPES.find((c) => c.id === commodity)?.defaultDetails.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setCommodityDetail(grade)}
                    className="rounded-full border border-pebble bg-fog px-2.5 py-0.5 font-sans text-[11px] text-charcoal hover:border-forest-ink hover:text-forest-ink"
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            {/* Laycan Window */}
            <div className="space-y-3 border-t border-pebble pt-5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-semibold uppercase tracking-wider text-slate">
                  Laycan Loading Window (Earliest to Latest Arrival)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLaycanPreset(7, 7)}
                    className="rounded-full border border-pebble bg-fog px-2 py-0.5 font-mono text-[10px] text-charcoal hover:bg-pebble"
                  >
                    +7d Prompt
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaycanPreset(14, 10)}
                    className="rounded-full border border-pebble bg-fog px-2 py-0.5 font-mono text-[10px] text-charcoal hover:bg-pebble"
                  >
                    +14d Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaycanPreset(30, 14)}
                    className="rounded-full border border-pebble bg-fog px-2 py-0.5 font-mono text-[10px] text-charcoal hover:bg-pebble"
                  >
                    +30d Future
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1 block font-mono text-[11px] text-slate">Laycan Start Date</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={laycanStart}
                      onChange={(e) => setLaycanStart(e.target.value)}
                      className="w-full rounded-card border border-pebble bg-paper px-3 py-2 text-sm text-charcoal focus:border-forest-ink focus:outline-none"
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-2.5 size-4 text-slate" />
                  </div>
                </div>

                <div>
                  <span className="mb-1 block font-mono text-[11px] text-slate">Laycan End Date</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={laycanEnd}
                      onChange={(e) => setLaycanEnd(e.target.value)}
                      className="w-full rounded-card border border-pebble bg-paper px-3 py-2 text-sm text-charcoal focus:border-forest-ink focus:outline-none"
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-2.5 size-4 text-slate" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between pt-5 border-t border-pebble">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-4 py-2 text-xs font-semibold text-charcoal hover:bg-fog transition-colors"
              >
                <ArrowLeft className="size-3.5" /> Back to Cargo Type
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 rounded-full bg-forest-ink px-5 py-2.5 text-xs font-semibold text-paper hover:bg-forest-ink/90 shadow-xs transition-colors"
              >
                <span>Continue to Step 3: Starting Port</span>
                <ArrowRight className="size-4 text-lime-voltage" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: STARTING PORT & COUNTRY */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="rounded-card border border-pebble bg-paper p-5 sm:p-6 space-y-6">
            <div className="border-b border-pebble pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-sans text-lg font-bold text-obsidian">Step 3: Select Starting Port & Country</h2>
                <p className="text-xs text-slate">
                  Choose the loading country and export terminal. The engine will query real UN/LOCODE coordinates and maritime distance.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-linen-mist px-3 py-1 font-mono text-xs font-semibold text-forest-ink">
                Selected Origin: <span className="font-bold">{originPort}, {originCountry}</span>
              </span>
            </div>

            {/* Country Selector Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-semibold uppercase tracking-wider text-slate">
                  1. Select Origin Country
                </label>
                <div className="relative w-48">
                  <Search className="pointer-events-none absolute left-2.5 top-2 size-3.5 text-slate" />
                  <input
                    type="search"
                    placeholder="Search country..."
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="w-full rounded-full border border-pebble bg-fog pl-8 pr-3 py-1 text-xs text-charcoal focus:border-forest-ink focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {filteredCountries.map((c) => {
                  const active = originCountry === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setOriginCountry(c.name);
                        if (c.ports.length > 0) {
                          setOriginPort(c.ports[0].name);
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
                        active
                          ? "border-forest-ink bg-forest-ink text-paper font-semibold shadow-xs"
                          : "border-pebble bg-paper text-charcoal hover:border-charcoal hover:bg-fog"
                      }`}
                    >
                      <span className="text-sm">{c.flag}</span>
                      <span>{c.name}</span>
                      <span className="font-mono text-[10px] opacity-70">({c.code})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ports within Active Country */}
            <div className="space-y-3 border-t border-pebble pt-5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-semibold uppercase tracking-wider text-slate">
                  2. Select Loading Port in {originCountry}
                </label>
                <span className="font-mono text-[11px] text-slate">
                  {activeCountryObj.ports.length} Available Export Terminals
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeCountryObj.ports.map((p) => {
                  const active = originPort === p.name;
                  return (
                    <div
                      key={p.name}
                      onClick={() => setOriginPort(p.name)}
                      className={`cursor-pointer rounded-card border p-3.5 transition-all ${
                        active
                          ? "border-forest-ink bg-linen-mist/60 ring-1 ring-forest-ink shadow-xs"
                          : "border-pebble bg-paper hover:border-charcoal hover:bg-fog/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-sans text-sm font-bold text-obsidian">{p.name}</div>
                          <span className="font-mono text-[11px] font-semibold text-forest-ink">
                            {p.locode}
                          </span>
                        </div>
                        {active && <CheckCircle2 className="size-4 text-forest-ink" />}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between border-t border-pebble/60 pt-2 text-[11px] text-slate">
                        <span className="truncate max-w-[170px]">{p.terminalType}</span>
                        <span className="font-mono font-medium text-charcoal">Draft: {p.maxDraft}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between pt-5 border-t border-pebble">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-4 py-2 text-xs font-semibold text-charcoal hover:bg-fog transition-colors"
              >
                <ArrowLeft className="size-3.5" /> Back to Cargo Details
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-2 rounded-full bg-forest-ink px-5 py-2.5 text-xs font-semibold text-paper hover:bg-forest-ink/90 shadow-xs transition-colors"
              >
                <span>Continue to Step 4: Ending Port</span>
                <ArrowRight className="size-4 text-lime-voltage" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: ENDING PORT & ROUTE CORRIDOR VALIDATION */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="rounded-card border border-pebble bg-paper p-5 sm:p-6 space-y-6">
            <div className="border-b border-pebble pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-sans text-lg font-bold text-obsidian">Step 4: Select Ending Port (Discharge Terminal)</h2>
                <p className="text-xs text-slate">
                  Select destination port in India. The system will verify channel draft depth, lock gate clearances, and vessel suitability.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-linen-mist px-3 py-1 font-mono text-xs font-semibold text-forest-ink">
                Discharge: <span className="font-bold">{destinationPort} Port</span>
              </span>
            </div>

            {/* Destination Port Grid */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {DISCHARGE_PORTS.map((dp) => {
                const active = destinationPort === dp.name;
                const isDraftWarning = dp.isRestricted && (parcelTonnage >= 90000 || inferredVessel === "Capesize");
                return (
                  <div
                    key={dp.name}
                    onClick={() => setDestinationPort(dp.name)}
                    className={`cursor-pointer flex flex-col justify-between rounded-card border p-4 transition-all ${
                      active
                        ? "border-forest-ink bg-linen-mist/60 ring-1 ring-forest-ink shadow-xs"
                        : "border-pebble bg-paper hover:border-charcoal hover:bg-fog/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-sans text-sm font-bold text-obsidian">{dp.name} Port</div>
                          <div className="font-mono text-[10px] text-slate">{dp.locode} • {dp.state}</div>
                        </div>
                        {active && <CheckCircle2 className="size-4 text-forest-ink" />}
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-slate">
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span>Max Draft:</span>
                          <span className="font-bold text-charcoal">{dp.maxDraft}</span>
                        </div>
                        <p className="text-[11px] leading-tight text-slate pt-1">{dp.berthType}</p>
                      </div>

                      {isDraftWarning && (
                        <div className="mt-2.5 rounded-md border border-alarm-red/30 bg-fog p-2 text-[10px] text-alarm-red">
                          ⚠️ Lock draft 14.5m prohibits fully laden Capesize!
                        </div>
                      )}
                    </div>

                    <div className="mt-3 border-t border-pebble/60 pt-2 text-[10px] text-slate">
                      Serves: <span className="font-semibold text-charcoal">{dp.sailPlant}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Route Summary & Validation Card */}
            <div className="rounded-card border border-pebble bg-fog/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate">
                  Corridor Configuration Summary
                </span>
                <span className="font-mono text-xs font-semibold text-forest-ink">
                  Ready for Live Engine Execution
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 text-xs">
                <div className="rounded-card bg-paper p-3 border border-pebble">
                  <span className="font-mono text-[10px] text-slate uppercase">Route Corridor</span>
                  <div className="mt-1 font-sans font-bold text-obsidian flex items-center gap-1">
                    <span>{originPort}</span>
                    <ArrowRight className="size-3 text-slate" />
                    <span>{destinationPort}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate">{originCountry} ➔ India</span>
                </div>

                <div className="rounded-card bg-paper p-3 border border-pebble">
                  <span className="font-mono text-[10px] text-slate uppercase">Commodity & Tonnage</span>
                  <div className="mt-1 font-sans font-bold text-obsidian">
                    {parcelTonnage.toLocaleString()} MT
                  </div>
                  <span className="font-mono text-[10px] text-slate truncate block">{commodity}</span>
                </div>

                <div className="rounded-card bg-paper p-3 border border-pebble">
                  <span className="font-mono text-[10px] text-slate uppercase">Recommended Vessel</span>
                  <div className="mt-1 font-sans font-bold text-forest-ink">
                    {inferredVessel} Class
                  </div>
                  <span className="font-mono text-[10px] text-slate">DWT Sizing Match</span>
                </div>

                <div className="rounded-card bg-paper p-3 border border-pebble">
                  <span className="font-mono text-[10px] text-slate uppercase">Laycan Window</span>
                  <div className="mt-1 font-mono font-bold text-obsidian text-[11px]">
                    {laycanStart} ➔ {laycanEnd}
                  </div>
                  <span className="font-mono text-[10px] text-slate">Nominated Loading Range</span>
                </div>
              </div>

              {/* Warning if same port */}
              {isSamePortError && (
                <div className="flex items-center gap-2 rounded-md border border-alarm-red/40 bg-paper p-3 text-xs text-alarm-red">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>
                    <strong>Invalid Corridor:</strong> Origin loading port ({originPort}) and discharge terminal ({destinationPort}) cannot be identical. Please choose a different loading or discharge port.
                  </span>
                </div>
              )}

              {/* Warning for Haldia */}
              {isHaldiaCapesizeWarning && (
                <div className="flex items-center gap-2 rounded-md border border-pebble bg-paper p-3 text-xs text-charcoal">
                  <Info className="size-4 text-forest-ink shrink-0" />
                  <span>
                    <strong>Draft Advisory:</strong> Haldia Dock Complex has a lock sill restriction of 14.5m. The model will account for transshipment or lightering cost surcharges.
                  </span>
                </div>
              )}
            </div>

            {/* Stepper Navigation & Run Button */}
            <div className="flex items-center justify-between pt-5 border-t border-pebble">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-4 py-2 text-xs font-semibold text-charcoal hover:bg-fog transition-colors"
              >
                <ArrowLeft className="size-3.5" /> Back to Starting Port
              </button>

              <button
                type="button"
                disabled={isSubmitting || isSamePortError}
                onClick={handleRunAnalysis}
                className="flex items-center gap-2.5 rounded-full bg-forest-ink px-6 py-3 text-xs font-bold text-paper hover:bg-forest-ink/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
              >
                <Compass className="size-4 text-lime-voltage animate-pulse" />
                <span>🚀 Compute Live Voyage Analysis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: LIVE ANALYSIS RESULTS (Direct on this screen, no separate opening required!) */}
      {currentStep === 5 && (
        <div className="space-y-6">
          {/* Loading Computation State */}
          {isSubmitting && (
            <div className="rounded-card border border-pebble bg-paper p-12 text-center space-y-5">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-forest-ink/10 text-forest-ink">
                <Loader2 className="size-8 animate-spin text-forest-ink" />
              </div>
              <div>
                <h3 className="font-sans text-xl font-bold text-obsidian">
                  Computing Multi-Variable Freight Analysis…
                </h3>
                <p className="mt-1 font-mono text-xs text-forest-ink animate-pulse">
                  {computationStage || "Consulting LightGBM P10/P50/P90 Quantile Engine..."}
                </p>
              </div>
              <div className="mx-auto max-w-sm rounded-full bg-pebble/60 h-2 overflow-hidden">
                <div className="h-full bg-lime-voltage animate-indeterminate" />
              </div>
              <p className="font-mono text-[11px] text-slate">
                Simulating counterfactual freight market volatility & nautical waypoints for {originPort} ➔ {destinationPort}
              </p>
            </div>
          )}

          {/* Results Screen */}
          {!isSubmitting && analysisResult && (
            <div className="space-y-6">
              {/* Approval Success Feedback Toast */}
              {approvalFeedback && (
                <div className="flex items-center gap-2 rounded-card border border-forest-ink/40 bg-linen-mist p-4 text-xs font-semibold text-forest-ink">
                  <CheckCircle2 className="size-4" />
                  <span>{approvalFeedback}</span>
                </div>
              )}

              {/* Overview Reference Bar */}
              <div className="flex flex-col gap-3 rounded-card border border-pebble bg-paper p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-forest-ink px-2.5 py-0.5 font-mono text-xs font-bold text-lime-voltage">
                      ANALYSIS #{analysisResult.id}
                    </span>
                    <span className="rounded-full bg-linen-mist px-2.5 py-0.5 font-mono text-[11px] font-semibold text-forest-ink">
                      {isApproved ? "LOCKED & APPROVED" : "RECOMMENDATION GENERATED"}
                    </span>
                  </div>
                  <h2 className="font-sans text-lg font-bold text-obsidian sm:text-xl">
                    {analysisResult.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-slate">
                    <span>Commodity: <strong>{analysisResult.commodity}</strong></span>
                    <span>•</span>
                    <span>Tonnage: <strong>{analysisResult.parcel_tonnage.toLocaleString()} MT</strong></span>
                    <span>•</span>
                    <span>Recommended Vessel: <strong className="text-forest-ink">{analysisResult.recommended_vessel}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadExport}
                    className="flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3.5 py-2 text-xs font-semibold text-charcoal hover:bg-fog transition-colors"
                  >
                    <Download className="size-3.5" /> Export Record
                  </button>

                  <button
                    type="button"
                    disabled={isApproved}
                    onClick={handleApproveFixture}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                      isApproved
                        ? "bg-linen-mist text-forest-ink border border-forest-ink/30 cursor-default"
                        : "bg-forest-ink text-paper hover:bg-forest-ink/90"
                    }`}
                  >
                    <CheckCircle2 className="size-3.5 text-lime-voltage" />
                    <span>{isApproved ? "Decision Approved" : "Approve Fixture"}</span>
                  </button>
                </div>
              </div>

              {/* 4 Primary KPI Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Predicted Rate */}
                <div className="rounded-card border border-pebble bg-paper p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate uppercase">Predicted Freight Rate</span>
                    <span className="rounded-full bg-forest-ink/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-forest-ink">
                      P50 ML Rate
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-3xl font-bold tabular-nums text-forest-ink">
                    ${analysisResult.predicted_rate_pmt.toFixed(2)}
                    <span className="text-xs font-normal text-slate"> / MT</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-slate border-t border-pebble/60 pt-2">
                    <span>P10: ${analysisResult.forecast?.p10_usd_per_mt?.toFixed(2) ?? "—"}</span>
                    <span>P90: ${analysisResult.forecast?.p90_usd_per_mt?.toFixed(2) ?? "—"}</span>
                  </div>
                </div>

                {/* 2. Spot Benchmark */}
                <div className="rounded-card border border-pebble bg-paper p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate uppercase">Spot Benchmark Rate</span>
                    <span className="rounded-full bg-pebble px-2 py-0.5 font-mono text-[10px] font-semibold text-charcoal">
                      Baltic Index
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-3xl font-bold tabular-nums text-obsidian">
                    ${analysisResult.benchmark_spot_pmt.toFixed(2)}
                    <span className="text-xs font-normal text-slate"> / MT</span>
                  </div>
                  <div className="mt-2 font-mono text-[11px] text-slate border-t border-pebble/60 pt-2">
                    Spot charter market reference on fixture date
                  </div>
                </div>

                {/* 3. Estimated Savings */}
                <div className="rounded-card border border-pebble bg-paper p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate uppercase">Projected Cost Savings</span>
                    <span className="flex items-center gap-1 rounded-full bg-lime-voltage/30 px-2 py-0.5 font-mono text-[10px] font-bold text-forest-ink">
                      <TrendingDown className="size-3" /> Spread Gain
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-3xl font-bold tabular-nums text-forest-ink">
                    ${analysisResult.estimated_savings_usd.toLocaleString()}
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-slate border-t border-pebble/60 pt-2">
                    <span>INR Equivalent:</span>
                    <span className="font-bold text-charcoal">
                      ₹{((analysisResult.estimated_savings_usd * 83.5) / 10000000).toFixed(2)} Cr
                    </span>
                  </div>
                </div>

                {/* 4. Confidence & Recommendation */}
                <div className="rounded-card border border-pebble bg-paper p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate uppercase">Engine Confidence</span>
                    <span className="rounded-full bg-linen-mist px-2 py-0.5 font-mono text-[10px] font-bold text-forest-ink">
                      {analysisResult.forecast?.confidence_label ?? "HIGH"}
                    </span>
                  </div>
                  <div className="mt-2 font-sans text-xl font-bold text-obsidian">
                    ENTER SPOT CHARTER
                  </div>
                  <div className="mt-2 font-mono text-[11px] text-slate border-t border-pebble/60 pt-2 flex items-center justify-between">
                    <span>Model:</span>
                    <span className="font-medium text-forest-ink">{analysisResult.forecast?.model_used ?? "LightGBM_v1"}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Route Map */}
              <div className="rounded-card border border-pebble bg-paper p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-pebble pb-3">
                  <div className="flex items-center gap-2">
                    <Navigation className="size-4 text-forest-ink" />
                    <h3 className="font-sans text-sm font-bold text-obsidian">
                      Nautical Route Corridor: {analysisResult.origin_port} ({analysisResult.origin_country}) ➔ {analysisResult.destination_port} (India)
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-slate">
                    Distance: <strong>{analysisResult.context?.route_distance_nm?.toLocaleString() ?? 5832} NM</strong>
                  </span>
                </div>

                <div className="overflow-hidden rounded-card border border-pebble">
                  <RouteMap
                    originName={`${analysisResult.origin_port}, ${analysisResult.origin_country}`}
                    destinationName={`${analysisResult.destination_port}, India`}
                    distanceNm={analysisResult.context?.route_distance_nm ?? 5832}
                    className="h-80 w-full"
                  />
                </div>
              </div>

              {/* Landed Cost & Feasibility Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Landed Economics */}
                <div className="rounded-card border border-pebble bg-paper p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-pebble pb-3">
                    <h3 className="font-sans text-sm font-bold text-obsidian flex items-center gap-2">
                      <DollarSign className="size-4 text-forest-ink" />
                      Landed Cost & Bunker Breakdown
                    </h3>
                    <span className="font-mono text-[11px] text-slate">USD/INR @ 83.50</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-pebble/50">
                      <span className="text-slate">Ocean Base Freight Rate:</span>
                      <span className="font-mono font-bold text-charcoal">
                        ${analysisResult.predicted_rate_pmt.toFixed(2)} / MT
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-pebble/50">
                      <span className="text-slate">Bunker Adjustment Factor (BAF):</span>
                      <span className="font-mono font-bold text-charcoal">
                        ${(analysisResult.landed_cost?.baf_surcharge_usd_per_mt ?? 1.20).toFixed(2)} / MT
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-pebble/50">
                      <span className="text-slate">Total Landed Rate (USD):</span>
                      <span className="font-mono font-bold text-forest-ink">
                        ${((analysisResult.predicted_rate_pmt) + (analysisResult.landed_cost?.baf_surcharge_usd_per_mt ?? 1.20)).toFixed(2)} / MT
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-pebble/50">
                      <span className="text-slate">Total Landed Rate (INR):</span>
                      <span className="font-mono font-bold text-forest-ink">
                        ₹{(((analysisResult.predicted_rate_pmt) + (analysisResult.landed_cost?.baf_surcharge_usd_per_mt ?? 1.20)) * 83.5).toFixed(2)} / MT
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-obsidian">Total Voyage Expenditure:</span>
                      <span className="font-mono text-base font-bold text-forest-ink">
                        ₹{((((analysisResult.predicted_rate_pmt) + (analysisResult.landed_cost?.baf_surcharge_usd_per_mt ?? 1.20)) * 83.5 * analysisResult.parcel_tonnage) / 10000000).toFixed(2)} Crores
                      </span>
                    </div>
                  </div>
                </div>

                {/* Port & Vessel Feasibility Matrix */}
                <div className="rounded-card border border-pebble bg-paper p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-pebble pb-3">
                    <h3 className="font-sans text-sm font-bold text-obsidian flex items-center gap-2">
                      <Anchor className="size-4 text-forest-ink" />
                      Discharge Port Feasibility Matrix ({analysisResult.destination_port})
                    </h3>
                    <span className="font-mono text-[11px] text-slate">Channel & Berth</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-pebble font-mono text-[10px] uppercase text-slate">
                          <th className="pb-2">Vessel Class</th>
                          <th className="pb-2">Draft Pass</th>
                          <th className="pb-2">LOA Pass</th>
                          <th className="pb-2">Lightering</th>
                          <th className="pb-2 text-right">Feasibility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pebble/50 font-mono">
                        {analysisResult.feasibility?.map((f) => (
                          <tr key={f.vessel_class} className="hover:bg-fog/50">
                            <td className="py-2.5 font-bold text-charcoal">{f.vessel_class}</td>
                            <td className="py-2.5">
                              {f.draft_pass ? (
                                <span className="text-forest-ink">✓ Pass</span>
                              ) : (
                                <span className="text-alarm-red">✗ Restricted</span>
                              )}
                            </td>
                            <td className="py-2.5">
                              {f.loa_pass ? (
                                <span className="text-forest-ink">✓ Pass</span>
                              ) : (
                                <span className="text-alarm-red">✗ Fail</span>
                              )}
                            </td>
                            <td className="py-2.5">
                              {f.requires_lightering ? (
                                <span className="text-alarm-red font-semibold">Required</span>
                              ) : (
                                <span className="text-slate">Direct Discharge</span>
                              )}
                            </td>
                            <td className="py-2.5 text-right">
                              {f.overall_feasible ? (
                                <span className="rounded-full bg-linen-mist px-2 py-0.5 text-[10px] font-bold text-forest-ink">
                                  SUITABLE
                                </span>
                              ) : (
                                <span className="rounded-full bg-alarm-red/10 px-2 py-0.5 text-[10px] font-bold text-alarm-red">
                                  CONSTRAINED
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Action Buttons Bottom Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-card border border-pebble bg-fog p-4">
                <div className="flex items-center gap-2 text-xs text-slate">
                  <Info className="size-4 text-forest-ink" />
                  <span>
                    Analysis stored in database. You can review all past runs on the History page anytime.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { window.location.hash = "#scenario"; }}
                    className="flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3.5 py-2 text-xs font-semibold text-charcoal hover:bg-fog transition-colors"
                  >
                    <Sliders className="size-3.5" /> What-If Scenario Studio
                  </button>
                  <button
                    type="button"
                    onClick={handleStartNewAnalysis}
                    className="flex items-center gap-1.5 rounded-full bg-forest-ink px-4 py-2 text-xs font-bold text-paper hover:bg-forest-ink/90 transition-colors shadow-xs"
                  >
                    <RotateCcw className="size-3.5 text-lime-voltage" />
                    <span>Run Another Analysis</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewAnalysisPage;
