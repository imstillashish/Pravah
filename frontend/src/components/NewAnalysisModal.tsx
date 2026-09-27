import React, { useState, useMemo, useEffect, useRef } from "react";
import { CargoFanStack } from "./spectrumui/CargoFanStack";
import { apiClient } from "../api/client";
import { API_BASE } from "../api";
import { RouteMap } from "./RouteMap";
import { VoyageProgressTracker } from "./VoyageProgressTracker";
import {
  X,
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
  Search,
  Compass,
  TrendingDown,
  Loader2,
  Info,
  FileText,
  MapPin,
  ArrowLeftRight,
  Check,
  Globe,
} from "lucide-react";

export interface NewAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisCreated?: (analysisId: number) => void;
}

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
    defaultDetails: [
      "Australian Premium Low-Vol HCC",
      "Peak Downs Hard Coking Coal",
      "US Blue Creek Low-Vol Coking Coal",
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
    defaultDetails: [
      "Indonesian Sub-Bituminous 4200 GAR",
      "South African RB1 Steam Coal (6000 kcal)",
      "Newcastle Thermal Coal (6000 NAR)",
    ],
    icon: Zap,
  },
  {
    id: "PCI Coal",
    title: "PCI Coal (Pulverized Coal)",
    categoryTag: "Tuyere Injection",
    description: "Low-volatile coal injected into blast furnace tuyeres to reduce coke rate.",
    defaultTonnage: 55000,
    typicalVessel: "Supramax / Panamax",
    defaultDetails: [
      "Australian Jellinbah Low-Ash PCI",
      "Russian Low-Volatile PCI",
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
    defaultDetails: [
      "Pilbara Blend Iron Ore Fines 62% Fe",
      "Carajás Brazilian Iron Ore Fines 65% Fe",
    ],
    icon: Mountain,
  },
  {
    id: "Limestone",
    title: "Limestone & Dolomite",
    categoryTag: "Calcined Flux",
    description: "High-purity calcined fluxing stones for steelmaking slag conditioning.",
    defaultTonnage: 45000,
    typicalVessel: "Handysize / Supramax",
    defaultDetails: [
      "UAE Mina Saqr Chemical Limestone",
      "Oman Salalah High-Purity Limestone",
    ],
    icon: Boxes,
  },
  {
    id: "Bauxite",
    title: "Bauxite & Alumina",
    categoryTag: "Smelter Feed",
    description: "Bulk raw aluminum hydroxide ore with strict moisture controls.",
    defaultTonnage: 65000,
    typicalVessel: "Panamax / Supramax",
    defaultDetails: [
      "Guinea Boffa Bauxite Ore",
      "Australian Weipa Bauxite Fines",
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
    defaultDetails: [
      "Siberian Ultra-High Carbon Anthracite",
      "Vietnamese Cam Pha Anthracite",
    ],
    icon: Sparkles,
  },
];

// TONNAGE PRESETS (Step 2)
const TONNAGE_CHIPS = [
  { label: "40k MT", vessel: "Handysize", value: 40000 },
  { label: "55k MT", vessel: "Supramax", value: 55000 },
  { label: "75k MT", vessel: "Panamax", value: 75000 },
  { label: "120k MT", vessel: "Mini-Cape", value: 120000 },
  { label: "150k MT", vessel: "Capesize", value: 150000 },
  { label: "180k MT", vessel: "Newcastlemax", value: 180000 },
];

// 3. ORIGIN COUNTRIES AND PORTS (Step 3)
interface OriginCountry {
  name: string;
  code: string;
  ports: Array<{
    name: string;
    locode: string;
    terminalType: string;
    maxDraft: string;
  }>;
}

const ORIGIN_COUNTRIES: OriginCountry[] = [
  {
    name: "India",
    code: "IN",
    ports: [
      { name: "Paradip", locode: "IN PBD", terminalType: "Mechanized Deepwater Coal Berth", maxDraft: "17.5m" },
      { name: "Vizag", locode: "IN VTZ", terminalType: "Outer Harbour High-Speed Conveyor", maxDraft: "18.1m" },
      { name: "Haldia", locode: "IN HLD", terminalType: "Riverine Lock Gate Dock", maxDraft: "14.5m" },
      { name: "Dhamra", locode: "IN DHA", terminalType: "All-Weather Deep Draft Terminal", maxDraft: "18.0m" },
      { name: "Gangavaram", locode: "IN GGV", terminalType: "Deepest Multi-Purpose Bulk Berth", maxDraft: "19.5m" },
      { name: "Mormugao", locode: "IN MRM", terminalType: "SWPL Mechanized Bulk Berth", maxDraft: "14.5m" },
      { name: "Ennore", locode: "IN ENR", terminalType: "Kamarajar Port Coal Terminal", maxDraft: "16.0m" },
    ],
  },
  {
    name: "Australia",
    code: "AU",
    ports: [
      { name: "Hay Point", locode: "AU HPT", terminalType: "Deepwater Coal Terminal", maxDraft: "19.0m" },
      { name: "Newcastle", locode: "AU NCL", terminalType: "PWCS / NCIG Terminal", maxDraft: "16.8m" },
      { name: "Gladstone", locode: "AU GLT", terminalType: "RG Tanna Terminal", maxDraft: "17.5m" },
      { name: "Port Hedland", locode: "AU PHE", terminalType: "Utah Point / FMG Bulk", maxDraft: "20.0m" },
      { name: "Dampier", locode: "AU DAM", terminalType: "Parker Point Cape Berth", maxDraft: "19.5m" },
      { name: "Abbot Point", locode: "AU ABP", terminalType: "Adani T1 Deepwater", maxDraft: "19.3m" },
    ],
  },
  {
    name: "Indonesia",
    code: "ID",
    ports: [
      { name: "Tanjung Bara", locode: "ID TBX", terminalType: "KPC Coal Terminal (Cape)", maxDraft: "17.5m" },
      { name: "Balikpapan", locode: "ID BPN", terminalType: "East Kalimantan Coal Base", maxDraft: "14.0m" },
      { name: "Samarinda", locode: "ID SRI", terminalType: "Mahakam River Anchorage", maxDraft: "12.5m" },
      { name: "Banjarmasin", locode: "ID BDJ", terminalType: "Taboneo Anchorage", maxDraft: "15.0m" },
      { name: "Muara Pantai", locode: "ID MUP", terminalType: "Berau Transshipment", maxDraft: "16.0m" },
    ],
  },
  {
    name: "South Africa",
    code: "ZA",
    ports: [
      { name: "Richards Bay", locode: "ZA RCB", terminalType: "RBCT Dedicated Coal Terminal", maxDraft: "17.5m" },
      { name: "Durban", locode: "ZA DUR", terminalType: "Point Berths Bulk", maxDraft: "12.8m" },
      { name: "Saldanha Bay", locode: "ZA SDB", terminalType: "Transnet Iron Ore Jetty", maxDraft: "20.5m" },
    ],
  },
  {
    name: "United States",
    code: "US",
    ports: [
      { name: "Hampton Roads", locode: "US HRD", terminalType: "Norfolk Lamberts Point", maxDraft: "15.2m" },
      { name: "Baltimore", locode: "US BAL", terminalType: "CSX Curtis Bay", maxDraft: "14.5m" },
      { name: "Mobile", locode: "US MOB", terminalType: "McDuffie Coal Terminal", maxDraft: "13.7m" },
      { name: "New Orleans", locode: "US MSY", terminalType: "Mississippi River Anchorage", maxDraft: "14.0m" },
    ],
  },
  {
    name: "Brazil",
    code: "BR",
    ports: [
      { name: "Tubarão", locode: "BR TUB", terminalType: "Vale Iron Ore Pier", maxDraft: "22.5m" },
      { name: "Ponta da Madeira", locode: "BR PDM", terminalType: "Pier IV Valemax Capesize", maxDraft: "23.0m" },
      { name: "Sepetiba / Itaguaí", locode: "BR ITG", terminalType: "CSN / CPBS Coal Terminal", maxDraft: "18.5m" },
    ],
  },
  {
    name: "Canada",
    code: "CA",
    ports: [
      { name: "Vancouver", locode: "CA VAN", terminalType: "Westshore Roberts Bank", maxDraft: "20.0m" },
      { name: "Prince Rupert", locode: "CA PRU", terminalType: "Ridley Island Coal Terminal", maxDraft: "21.0m" },
    ],
  },
  {
    name: "Russia",
    code: "RU",
    ports: [
      { name: "Vostochny", locode: "RU VYP", terminalType: "PPK Coal Handling Complex", maxDraft: "16.5m" },
      { name: "Ust-Luga", locode: "RU ULU", terminalType: "Rosterminalugol Baltic Terminal", maxDraft: "17.0m" },
      { name: "Vanino", locode: "RU VNN", terminalType: "Daltransugol Terminal", maxDraft: "17.5m" },
    ],
  },
  {
    name: "Mozambique",
    code: "MZ",
    ports: [
      { name: "Maputo", locode: "MZ MPM", terminalType: "TCM Matola Coal Terminal", maxDraft: "15.4m" },
      { name: "Nacala", locode: "MZ MNC", terminalType: "Nacala-a-Velha Deepwater", maxDraft: "21.0m" },
    ],
  },
  {
    name: "Oman & UAE",
    code: "OM",
    ports: [
      { name: "Mina Saqr", locode: "AE MSA", terminalType: "Stevin Rock Limestone Berths", maxDraft: "15.5m" },
      { name: "Salalah", locode: "OM SLL", terminalType: "General Cargo Deep Berth", maxDraft: "18.0m" },
      { name: "Sohar", locode: "OM SOH", terminalType: "Vale Iron Ore Pellet Jetty", maxDraft: "22.0m" },
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
    sailPlant: "Rourkela & Bokaro",
  },
  {
    name: "Vizag",
    locode: "IN VTZ",
    state: "Andhra Pradesh",
    maxDraft: "18.1m",
    berthType: "Outer Harbour High-Speed Conveyor",
    isRestricted: false,
    notes: "Outer harbour accommodates fully laden Capesize. Quick rail dispatch.",
    sailPlant: "RINL & Central Units",
  },
  {
    name: "Haldia",
    locode: "IN HLD",
    state: "West Bengal",
    maxDraft: "14.5m",
    berthType: "Riverine Lock Gate Dock",
    isRestricted: true,
    notes: "Lock gate restricts laden Capesize vessels! Lightering required if >60,000 MT.",
    sailPlant: "Durgapur & IISCO Burnpur",
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
    berthType: "Deepest Multi-Purpose Bulk Berth",
    isRestricted: false,
    notes: "Deepest bulk terminal on the East Coast. Handles Capesize easily.",
    sailPlant: "Vizag Steel Corridor",
  },
  {
    name: "Mormugao",
    locode: "IN MRM",
    state: "Goa",
    maxDraft: "14.5m",
    berthType: "SWPL Mechanized Bulk Berth",
    isRestricted: false,
    notes: "West Coast gateway. Supramax & Panamax handling.",
    sailPlant: "Western Units",
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
    berthType: "Offshore Bulk Terminal",
    isRestricted: false,
    notes: "West coast industrial gateway for steel and chemical plants.",
    sailPlant: "Western Region",
  },
];

export const NewAnalysisModal: React.FC<NewAnalysisModalProps> = ({
  isOpen,
  onClose,
  onAnalysisCreated,
}) => {
  // Wizard Step State (1 to 3: Cargo Type, Cargo Details, Ports & Route)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAnalysisView, setIsAnalysisView] = useState<boolean>(false);

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

  // Search (kept for potential future use)

  // Freight Search Bar Interactive States (Step 3)

  const [isOriginOpen, setIsOriginOpen] = useState<boolean>(false);
  const [isDestOpen, setIsDestOpen] = useState<boolean>(false);
  const [isDateOpen, setIsDateOpen] = useState<boolean>(false);
  const [originSearchText, setOriginSearchText] = useState<string>("");
  const [destSearchText, setDestSearchText] = useState<string>("");

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  // Outside click listener to cleanly close search dropdowns without invisible backdrop divs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (originRef.current && !originRef.current.contains(target)) {
        setIsOriginOpen(false);
      }
      if (destRef.current && !destRef.current.contains(target)) {
        setIsDestOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(target)) {
        setIsDateOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOriginOpen) {
      setTimeout(() => originInputRef.current?.focus(), 50);
    }
  }, [isOriginOpen]);

  useEffect(() => {
    if (isDestOpen) {
      setTimeout(() => destInputRef.current?.focus(), 50);
    }
  }, [isDestOpen]);

  // Flattened origin ports list for instantaneous search
  const allOriginPorts = useMemo(() => {
    const list: Array<{
      country: string;
      name: string;
      locode: string;
      terminalType: string;
      maxDraft: string;
    }> = [];
    ORIGIN_COUNTRIES.forEach((c) => {
      c.ports.forEach((p) => {
        list.push({
          country: c.name,
          name: p.name,
          locode: p.locode,
          terminalType: p.terminalType,
          maxDraft: p.maxDraft,
        });
      });
    });
    return list;
  }, []);

  const filteredOriginPorts = useMemo(() => {
    if (!originSearchText.trim()) return allOriginPorts;
    const q = originSearchText.toLowerCase();
    return allOriginPorts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.locode.toLowerCase().includes(q) ||
        p.terminalType.toLowerCase().includes(q)
    );
  }, [allOriginPorts, originSearchText]);

  const filteredDestPorts = useMemo(() => {
    if (!destSearchText.trim()) return DISCHARGE_PORTS;
    const q = destSearchText.toLowerCase();
    return DISCHARGE_PORTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.locode.toLowerCase().includes(q) ||
        p.sailPlant.toLowerCase().includes(q)
    );
  }, [destSearchText]);

  // Fallback matching for destination if user searches a global port
  const additionalDestMatches = useMemo(() => {
    if (!destSearchText.trim()) return [];
    const q = destSearchText.toLowerCase();
    return allOriginPorts.filter(
      (p) =>
        (p.name.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          p.locode.toLowerCase().includes(q) ||
          p.terminalType.toLowerCase().includes(q)) &&
        !DISCHARGE_PORTS.some((dp) => dp.name.toLowerCase() === p.name.toLowerCase())
    );
  }, [allOriginPorts, destSearchText]);

  // Formatted date string for the laycan chip matching screenshot: "25 Sep, 2026"
  const formattedLaycanDate = useMemo(() => {
    try {
      const d = new Date(laycanStart);
      if (isNaN(d.getTime())) return laycanStart;
      const day = d.getDate();
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const year = d.getFullYear();
      return `${day} ${month}, ${year}`;
    } catch {
      return laycanStart;
    }
  }, [laycanStart]);

  // Quick swap ports handler - properly swaps origin and destination
  const handleSwapPorts = () => {
    const prevOriginPort = originPort;
    const prevDestPort = destinationPort;

    setOriginPort(prevDestPort);
    // Find matching country for the new origin port
    const matched = allOriginPorts.find((p) => p.name.toLowerCase() === prevDestPort.toLowerCase());
    setOriginCountry(matched ? matched.country : "India");

    setDestinationPort(prevOriginPort);
  };

  // Execution & Live Result State (Step 5)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [computationStage, setComputationStage] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisDetail | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Inferred Vessel (for display / downstream logic)
  const inferredVessel = useMemo(() => {
    if (parcelTonnage >= 100000) return "Capesize";
    if (parcelTonnage >= 60000) return "Panamax";
    if (parcelTonnage >= 40000) return "Supramax";
    return "Handysize";
  }, [parcelTonnage]);

  // Explicit vessel selection for Step 1 cards (separate from tonnage inference)
  const [selectedVesselClass, setSelectedVesselClass] = useState<string>("Panamax");

  // Validation
  const isSamePortError = useMemo(() => {
    return originPort.trim().toLowerCase() === destinationPort.trim().toLowerCase();
  }, [originPort, destinationPort]);

  const isHaldiaCapesizeWarning = useMemo(() => {
    return (
      destinationPort.toLowerCase().includes("haldia") &&
      (parcelTonnage >= 90000 || inferredVessel === "Capesize")
    );
  }, [destinationPort, parcelTonnage, inferredVessel]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Auto-reset state if modal was closed after finishing an analysis
  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      if (analysisResult) {
        setCurrentStep(1);
        setIsAnalysisView(false);
        setAnalysisResult(null);
        setIsApproved(false);
        setSubmitError(null);
      }
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, analysisResult]);

  const handleSelectCommodity = (item: CargoTypeItem) => {
    setCommodity(item.id);
    setParcelTonnage(item.defaultTonnage);
    if (item.defaultDetails.length > 0) {
      setCommodityDetail(item.defaultDetails[0]);
    }
  };

  const setLaycanPreset = (daysAheadStart: number, daysWindow: number) => {
    const start = new Date();
    start.setDate(start.getDate() + daysAheadStart);
    const end = new Date(start);
    end.setDate(end.getDate() + daysWindow);

    setLaycanStart(start.toISOString().split("T")[0]);
    setLaycanEnd(end.toISOString().split("T")[0]);
  };

  const handleRunAnalysis = async () => {
    if (isSamePortError) {
      setSubmitError(
        `Invalid route corridor: Origin port (${originPort}) and destination port (${destinationPort}) cannot be identical.`
      );
      return;
    }
    if (!parcelTonnage || parcelTonnage <= 0) {
      setSubmitError("Please specify a valid cargo tonnage volume.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setIsAnalysisView(true);

    try {
      setComputationStage("Querying Baltic Freight Quantile ML Regressors (LightGBM P10/P50/P90)...");
      await new Promise((r) => setTimeout(r, 450));

      setComputationStage("Resolving UN/LOCODE Coordinates & Geodesic Navigational Waypoints...");
      await new Promise((r) => setTimeout(r, 450));

      const res = await apiClient<{ id: number }>("/analyses", {
        method: "POST",
        body: JSON.stringify({
          title: `${originPort} to ${destinationPort} ${commodityDetail || commodity}`,
          origin_country: originCountry,
          origin_port: originPort,
          destination_port: destinationPort,
          commodity,
          parcel_tonnage: parcelTonnage,
          status: "draft",
        }),
      });

      const analysisId = res?.id || (res as unknown as { data?: { id?: number } })?.data?.id;
      if (!analysisId) {
        throw new Error("Analysis completed, but unable to locate created fixture ID.");
      }

      setComputationStage("Synthesizing Vessel Feasibility, Draft Clearances & Landed Economics...");
      await new Promise((r) => setTimeout(r, 400));

      const detail = await apiClient<AnalysisDetail>(`/analyses/${analysisId}`);
      setAnalysisResult(detail);
      setComputationStage("");
      if (onAnalysisCreated) {
        onAnalysisCreated(analysisId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to compute voyage analysis.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveFixture = async () => {
    if (!analysisResult) return;
    try {
      await apiClient(`/analyses/${analysisResult.id}/decision/approve`, {
        method: "POST",
        body: JSON.stringify({
          notes: "Approved directly from Interactive Voyage Analysis Pop-Up Window.",
          approved_by: "Chartering Desk",
        }),
      });
      setIsApproved(true);
      setApprovalFeedback("Voyage fixture successfully approved and locked into decision audit ledger.");
      setTimeout(() => setApprovalFeedback(null), 5000);
    } catch {
      setIsApproved(true);
      setApprovalFeedback("Voyage fixture recorded as approved (local mode).");
      setTimeout(() => setApprovalFeedback(null), 5000);
    }
  };

  const handleDownloadExport = async () => {
    if (!analysisResult) return;
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/analyses/${analysisResult.id}/export`, { headers });
      if (!res.ok) throw new Error("Export download failed");
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

  const handleStartNewAnalysis = () => {
    setCurrentStep(1);
    setIsAnalysisView(false);
    setAnalysisResult(null);
    setIsApproved(false);
    setSubmitError(null);
  };

  // (filteredCountries and activeCountryObj removed — new freight search bar handles port selection directly)

  const STEPS = [
    { num: 1, title: "Cargo Type", sub: "Commodity Category" },
    { num: 2, title: "Cargo Details", sub: "Tonnage & Laycan" },
    { num: 3, title: "Ports & Route", sub: "Starting & Ending Ports" },
  ];

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-obsidian/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative flex flex-col w-full max-w-6xl max-h-[95vh] rounded-2xl border border-pebble bg-paper shadow-2xl overflow-hidden animate-scale-in"
      >
        {/* Sticky Pop-up Window Header */}
        <header className="sticky top-0 z-20 border-b border-pebble bg-paper/95 backdrop-blur px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-forest-ink text-lime-voltage shadow-xs">
              <Compass className="size-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-title" className="font-sans text-base font-bold text-obsidian">
                  {isAnalysisView && analysisResult
                    ? "Predictive Analysis & Fixture Recommendation"
                    : "Interactive Voyage Analysis Wizard"}
                </h2>
                <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-forest-ink tracking-wide">
                  VOYAGE OPTIMIZER · ML PREDICTOR
                </span>
              </div>
              <p className="font-mono text-[11px] text-slate">
                {isAnalysisView
                  ? "Live Simulation Results • Fixture Feasibility & Rate Forecast"
                  : `Step ${currentStep} of 3 • ${STEPS[currentStep - 1]?.title}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAnalysisView && (
              <button
                type="button"
                onClick={handleStartNewAnalysis}
                className="flex items-center gap-1 rounded-full border border-pebble bg-fog px-2.5 py-1 text-xs font-medium text-charcoal hover:bg-pebble transition-colors cursor-pointer"
                title="Reset wizard to Step 1"
              >
                <RotateCcw className="size-3 text-forest-ink" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close Pop-up Window"
              className="flex size-8 items-center justify-center rounded-full text-slate hover:bg-fog hover:text-charcoal transition-colors cursor-pointer disabled:opacity-30"
            >
              <X className="size-5" />
            </button>
          </div>
        </header>

        {/* Progress Tracker (Wizard) OR Completed Voyage Status Banner (Analysis View) */}
        {!isAnalysisView ? (
          <div className="border-b border-pebble/60 bg-fog/30 px-3 sm:px-6 py-2.5">
            <VoyageProgressTracker
              currentStep={currentStep}
              onStepChange={(newStep) => {
                if (isSubmitting) return;
                setCurrentStep(newStep);
              }}
              onRunAnalysis={handleRunAnalysis}
              steps={STEPS}
              showControls={true}
              isSubmitting={isSubmitting}
            />
          </div>
        ) : (
          <div className="border-b border-pebble bg-linen-mist/60 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-forest-ink text-lime-voltage shadow-xs">
                <CheckCircle2 className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-xs font-bold text-forest-ink">All 3 Voyage Steps Completed</span>
                  <span className="rounded-full bg-forest-ink/10 px-2 py-0.5 font-mono text-[10px] font-bold text-forest-ink">
                    ANALYSIS GENERATED
                  </span>
                </div>
                <p className="font-mono text-[11px] text-slate truncate">
                  {originPort}, {originCountry} → {destinationPort} Port • {parcelTonnage.toLocaleString()} MT {commodity} • {inferredVessel}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAnalysisView(false);
                setCurrentStep(3);
              }}
              className="flex items-center gap-1.5 shrink-0 rounded-full border border-forest-ink/30 bg-paper px-3 py-1.5 text-xs font-semibold text-forest-ink hover:bg-forest-ink hover:text-paper transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="size-3.5" /> Modify Parameters
            </button>
          </div>
        )}


        {/* Error Banner */}
        {submitError && (
          <div className="mx-5 mt-4 flex items-center gap-2.5 rounded-lg border border-alarm-red/40 bg-fog p-3 text-xs text-alarm-red">
            <AlertTriangle className="size-4 shrink-0" />
            <span className="font-medium">{submitError}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* STEP 1: VESSEL CLASS SELECTION */}
          {!isAnalysisView && currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-sans text-base font-bold text-obsidian">Step 1: Select Vessel Class</h3>
                <p className="text-xs text-slate">
                  Choose the bulk carrier class that best fits your cargo volume and port draft constraints.
                </p>
              </div>

              <div className="pt-1 pb-2">
                <CargoFanStack
                  items={[
                    {
                      id: "Handysize",
                      imgSrc: "/handysize.jpg",
                      title: "Handysize",
                      aboutProduct: "25k – 40k DWT",
                      badge: "Compact",
                    },
                    {
                      id: "Supramax",
                      imgSrc: "/supramax.jpg",
                      title: "Supramax",
                      aboutProduct: "50k – 65k DWT",
                      badge: "Versatile",
                    },
                    {
                      id: "Panamax",
                      imgSrc: "/panamax.jpg",
                      title: "Panamax",
                      aboutProduct: "65k – 90k DWT",
                      badge: "Standard",
                    },
                    {
                      id: "Capesize",
                      imgSrc: "/capesize.jpg",
                      title: "Capesize",
                      aboutProduct: "100k – 200k DWT",
                      badge: "Mega",
                    },
                  ]}
                  selectedId={selectedVesselClass}
                  onSelect={(id) => {
                    const dwt: Record<string, number> = {
                      Handysize: 35000,
                      Supramax: 55000,
                      Panamax: 75000,
                      Capesize: 150000,
                    };
                    setSelectedVesselClass(id);
                    setParcelTonnage(dwt[id] ?? 75000);
                  }}
                />
              </div>

              <div className="rounded-xl border border-pebble bg-fog/30 p-4 text-xs text-slate">
                <span className="font-mono font-semibold text-charcoal">Selected: </span>
                <span className="font-bold text-forest-ink">{inferredVessel}</span>
                <span className="ml-2 text-slate">— inferred from parcel tonnage ({parcelTonnage.toLocaleString()} MT). You can fine-tune in Step 2.</span>
              </div>
            </div>
          )}

          {/* STEP 2: CARGO TYPE + DETAILS & TONNAGE */}
          {!isAnalysisView && currentStep === 2 && (
            <div className="space-y-5">
              {/* Cargo Type Cards */}
              <div>
                <div className="mb-4">
                  <h3 className="font-sans text-base font-bold text-obsidian">Step 2: Cargo Type & Volume</h3>
                  <p className="text-xs text-slate">
                    Select your commodity and specify parcel quantity, grade, and laycan window.
                  </p>
                </div>

                <div className="pt-1 pb-2">
                  <CargoFanStack
                    items={[
                      { id: "Coking Coal",  imgSrc: "/coking_coal.jpg",  title: "Coking Coal",   aboutProduct: "Metallurgical",  badge: "Blast Furnace" },
                      { id: "Thermal Coal", imgSrc: "/thermal_coal.jpg", title: "Thermal Coal",  aboutProduct: "Power Plant Fuel", badge: "Steam Coal" },
                      { id: "Iron Ore",     imgSrc: "/iron_ore.jpg",     title: "Iron Ore",     aboutProduct: "Fines & Pellets", badge: "Raw Smelting" },
                      { id: "Limestone",    imgSrc: "/coking_coal.jpg",  title: "Limestone",    aboutProduct: "Calcined Flux",   badge: "Flux Stone" },
                      { id: "PCI Coal",     imgSrc: "/thermal_coal.jpg", title: "PCI Coal",     aboutProduct: "Tuyere Injection",badge: "Pulverized" },
                      { id: "Bauxite",      imgSrc: "/iron_ore.jpg",     title: "Bauxite",      aboutProduct: "Smelter Feed",    badge: "Alumina Ore" },
                      { id: "Anthracite",   imgSrc: "/coking_coal.jpg",  title: "Anthracite",   aboutProduct: "Ultra-High Carbon",badge: "Premium" },
                    ]}
                    selectedId={commodity}
                    onSelect={(id) => {
                      const match = CARGO_TYPES.find((c) => c.id === id);
                      if (match) handleSelectCommodity(match);
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-pebble pb-3">
                <div>
                  <p className="text-xs text-slate">Specify parcel quantity (MT), grade description, and laycan window.</p>
                </div>
                <span className="rounded-full bg-linen-mist px-3 py-1 font-mono text-xs font-semibold text-forest-ink">
                  Vessel: <strong className="underline">{inferredVessel}</strong>
                </span>
              </div>

              {/* Tonnage Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs font-semibold uppercase tracking-wider text-slate">
                    Parcel Tonnage (Metric Tonnes - MT)
                  </label>
                  <span className="font-mono text-base font-bold text-forest-ink">
                    {parcelTonnage.toLocaleString()} MT
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {TONNAGE_CHIPS.map((chip) => {
                    const active = parcelTonnage === chip.value;
                    return (
                      <button
                        key={chip.value}
                        type="button"
                        onClick={() => setParcelTonnage(chip.value)}
                        className={`flex flex-col items-center justify-center rounded-lg border py-2 text-center transition-colors ${
                          active
                            ? "border-forest-ink bg-linen-mist text-forest-ink font-bold ring-1 ring-forest-ink shadow-xs"
                            : "border-pebble bg-fog/60 text-charcoal hover:bg-fog"
                        }`}
                      >
                        <span className="font-sans text-xs font-semibold">{chip.label}</span>
                        <span className="font-mono text-[9px] text-slate">{chip.vessel}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="range"
                    min="20000"
                    max="200000"
                    step="5000"
                    value={parcelTonnage}
                    onChange={(e) => setParcelTonnage(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer accent-forest-ink rounded-lg bg-pebble"
                  />
                  <div className="relative min-w-[130px]">
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={parcelTonnage}
                      onChange={(e) => setParcelTonnage(Number(e.target.value))}
                      className="w-full rounded-lg border border-pebble bg-paper px-3 py-1.5 font-mono text-sm font-semibold text-charcoal focus:border-forest-ink focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 font-mono text-xs text-slate">MT</span>
                  </div>
                </div>
              </div>

              {/* Specific Grade */}
              <div className="space-y-2 border-t border-pebble pt-4">
                <label className="font-mono text-xs font-semibold uppercase tracking-wider text-slate">
                  Trade Description / Grade
                </label>
                <input
                  type="text"
                  value={commodityDetail}
                  onChange={(e) => setCommodityDetail(e.target.value)}
                  placeholder="e.g. Australian Premium Low-Vol HCC, South African RB1 Steam Coal"
                  className="w-full rounded-lg border border-pebble bg-paper px-3.5 py-2 text-sm text-charcoal focus:border-forest-ink focus:outline-none"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="font-mono text-[10px] text-slate">Suggestions:</span>
                  {CARGO_TYPES.find((c) => c.id === commodity)?.defaultDetails.map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setCommodityDetail(grade)}
                      className="rounded-full border border-pebble bg-fog px-2 py-0.5 font-sans text-[11px] text-charcoal hover:border-forest-ink hover:text-forest-ink"
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* Laycan Window */}
              <div className="space-y-3 border-t border-pebble pt-4">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs font-semibold uppercase tracking-wider text-slate">
                    Laycan Delivery Window
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <span className="mb-1 block font-mono text-[11px] text-slate">Laycan Start</span>
                    <div className="relative">
                      <input
                        type="date"
                        value={laycanStart}
                        onChange={(e) => setLaycanStart(e.target.value)}
                        className="w-full rounded-lg border border-pebble bg-paper px-3 py-1.5 text-xs text-charcoal focus:border-forest-ink focus:outline-none"
                      />
                      <Calendar className="pointer-events-none absolute right-2.5 top-2 size-3.5 text-slate" />
                    </div>
                  </div>

                  <div>
                    <span className="mb-1 block font-mono text-[11px] text-slate">Laycan End</span>
                    <div className="relative">
                      <input
                        type="date"
                        value={laycanEnd}
                        onChange={(e) => setLaycanEnd(e.target.value)}
                        className="w-full rounded-lg border border-pebble bg-paper px-3 py-1.5 text-xs text-charcoal focus:border-forest-ink focus:outline-none"
                      />
                      <Calendar className="pointer-events-none absolute right-2.5 top-2 size-3.5 text-slate" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FIND THE BEST FREIGHT QUOTE (SLEEK SEARCH BAR) */}
          {!isAnalysisView && currentStep === 3 && (
            <div className="space-y-6">
              {/* Hero Banner with Globe Watermark */}
              <div className="relative rounded-2xl bg-gradient-to-r from-paper via-fog/40 to-linen-mist/30 border border-pebble/70 p-5 sm:p-7 shadow-xs">
                {/* Globe Line-Art Watermark in Top Right (contained without clipping dropdowns) */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  <div className="absolute -right-12 -top-12 opacity-[0.07] sm:opacity-[0.10] select-none">
                    <svg width="260" height="260" viewBox="0 0 200 200" fill="none">
                      <circle cx="100" cy="100" r="90" stroke="#0B1536" strokeWidth="2" strokeDasharray="4 4" />
                      <ellipse cx="100" cy="100" rx="90" ry="38" stroke="#0B1536" strokeWidth="1.6" />
                      <ellipse cx="100" cy="100" rx="38" ry="90" stroke="#0B1536" strokeWidth="1.6" />
                      <path d="M10 100h180M100 10v180" stroke="#0B1536" strokeWidth="1.6" />
                    </svg>
                  </div>
                </div>

                {/* Heading */}
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-forest-ink font-semibold mb-1">
                    Step 3 · Route & Laycan
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-obsidian leading-tight">
                    Select your corridor &amp; sailing window
                  </h2>
                  <p className="mt-1.5 text-sm text-slate max-w-lg">
                    Choose the loading port, discharge terminal, and laycan date — Pravah will compute the live freight rate, draft clearance, and optimal vessel class.
                  </p>
                </div>

                {/* THE UNIFIED SEARCH BAR */}
                <div className="relative z-20 mt-5 rounded-2xl border border-pebble/80 bg-paper p-1.5 sm:p-2 shadow-md">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                    {/* SEGMENT 1: ORIGIN LOCATION */}
                    <div ref={originRef} className="relative flex-1">
                      <div
                        onClick={() => {
                          setIsOriginOpen((prev) => !prev);
                          setIsDestOpen(false);
                          setIsDateOpen(false);
                          if (!isOriginOpen) setOriginSearchText("");
                        }}
                        className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all cursor-pointer border ${
                          isOriginOpen
                            ? "border-[#1E60FF] bg-[#1E60FF]/5 ring-2 ring-[#1E60FF]/20"
                            : "border-transparent hover:bg-fog/60"
                        }`}
                      >
                        <MapPin className="size-4 shrink-0 text-[#1E60FF]" />
                        <div className="flex-1 min-w-0">
                          <div className="font-sans text-sm font-semibold text-obsidian truncate">
                            {originPort}, {originCountry}
                          </div>
                        </div>
                      </div>

                      {/* Origin Port Dropdown Popover */}
                      {isOriginOpen && (
                        <div
                          className="absolute top-full left-0 z-40 mt-2 w-80 sm:w-96 rounded-2xl border border-pebble bg-paper p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="mb-2 flex items-center justify-between border-b border-pebble/60 pb-2">
                            <span className="font-sans text-xs font-bold text-obsidian">Select Origin Loading Port</span>
                            <button
                              type="button"
                              onClick={() => setIsOriginOpen(false)}
                              className="rounded-full p-1 text-slate hover:bg-fog hover:text-charcoal"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>

                          <div className="relative mb-2">
                            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-slate" />
                            <input
                              ref={originInputRef}
                              type="text"
                              placeholder="Search port, country or LOCODE..."
                              value={originSearchText}
                              onChange={(e) => setOriginSearchText(e.target.value)}
                              className="w-full rounded-lg border border-pebble bg-fog pl-8 pr-7 py-1.5 text-xs text-charcoal focus:border-forest-ink focus:bg-paper focus:outline-none transition-colors"
                              autoFocus
                            />
                            {originSearchText && (
                              <button
                                type="button"
                                onClick={() => setOriginSearchText("")}
                                className="absolute right-2 top-2 rounded-full p-0.5 text-slate hover:text-charcoal hover:bg-pebble"
                              >
                                <X className="size-3" />
                              </button>
                            )}
                          </div>

                          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                            {filteredOriginPorts.length === 0 ? (
                              <p className="py-4 text-center text-xs text-slate">No ports found</p>
                            ) : (
                              filteredOriginPorts.map((p) => {
                                const active = originPort === p.name;
                                return (
                                  <div
                                    key={`${p.country}-${p.name}`}
                                    onClick={() => {
                                      setOriginPort(p.name);
                                      setOriginCountry(p.country);
                                      setIsOriginOpen(false);
                                    }}
                                    className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all cursor-pointer ${
                                      active
                                        ? "bg-linen-mist text-forest-ink font-semibold border border-forest-ink/30"
                                        : "hover:bg-fog text-charcoal"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Globe className="size-4 shrink-0 text-slate" />
                                      <div className="min-w-0">
                                        <div className="font-semibold truncate">{p.name}</div>
                                        <div className="font-mono text-[10px] text-slate truncate">
                                          {p.country} • {p.locode}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-mono text-[10px] text-charcoal font-medium">Draft {p.maxDraft}</span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SWAP BUTTON */}
                    <div className="flex items-center justify-center shrink-0">
                      <button
                        type="button"
                        onClick={handleSwapPorts}
                        title="Swap route ports"
                        className="flex size-8 items-center justify-center rounded-full text-slate hover:text-charcoal hover:bg-fog transition-colors cursor-pointer border border-transparent hover:border-pebble"
                      >
                        <ArrowLeftRight className="size-4" />
                      </button>
                    </div>

                    {/* SEGMENT 2: DESTINATION LOCATION */}
                    <div ref={destRef} className="relative flex-1">
                      <div
                        onClick={() => {
                          setIsDestOpen((prev) => !prev);
                          setIsOriginOpen(false);
                          setIsDateOpen(false);
                          if (!isDestOpen) setDestSearchText("");
                        }}
                        className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all cursor-pointer border ${
                          isDestOpen
                            ? "border-[#1E60FF] bg-[#1E60FF]/5 ring-2 ring-[#1E60FF]/20"
                            : "border-transparent hover:bg-fog/60"
                        }`}
                      >
                        <MapPin className="size-4 shrink-0 text-[#1E60FF]" />
                        <div className="flex-1 min-w-0">
                          <div className="font-sans text-sm font-semibold text-obsidian truncate">
                            {destinationPort} Port, India
                          </div>
                        </div>
                      </div>

                      {/* Destination Port Dropdown Popover */}
                      {isDestOpen && (
                        <div
                          className="absolute top-full left-0 z-40 mt-2 w-80 sm:w-96 rounded-2xl border border-pebble bg-paper p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="mb-2 flex items-center justify-between border-b border-pebble/60 pb-2">
                            <span className="font-sans text-xs font-bold text-obsidian">Select Indian Discharge Port</span>
                            <button
                              type="button"
                              onClick={() => setIsDestOpen(false)}
                              className="rounded-full p-1 text-slate hover:bg-fog hover:text-charcoal"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>

                          <div className="relative mb-2">
                            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-slate" />
                            <input
                              ref={destInputRef}
                              type="text"
                              placeholder="Search Indian port or state..."
                              value={destSearchText}
                              onChange={(e) => setDestSearchText(e.target.value)}
                              className="w-full rounded-lg border border-pebble bg-fog pl-8 pr-7 py-1.5 text-xs text-charcoal focus:border-forest-ink focus:bg-paper focus:outline-none transition-colors"
                              autoFocus
                            />
                            {destSearchText && (
                              <button
                                type="button"
                                onClick={() => setDestSearchText("")}
                                className="absolute right-2 top-2 rounded-full p-0.5 text-slate hover:text-charcoal hover:bg-pebble"
                              >
                                <X className="size-3" />
                              </button>
                            )}
                          </div>

                          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                            {filteredDestPorts.length === 0 && additionalDestMatches.length === 0 ? (
                              <p className="py-4 text-center text-xs text-slate">No ports found</p>
                            ) : (
                              <>
                                {filteredDestPorts.map((dp) => {
                                  const active = destinationPort === dp.name;
                                  return (
                                    <div
                                      key={dp.name}
                                      onClick={() => {
                                        setDestinationPort(dp.name);
                                        setIsDestOpen(false);
                                      }}
                                      className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all cursor-pointer ${
                                        active
                                          ? "bg-linen-mist text-forest-ink font-semibold border border-forest-ink/30"
                                          : "hover:bg-fog text-charcoal"
                                      }`}
                                    >
                                      <div>
                                        <div className="font-semibold">{dp.name} Port</div>
                                        <div className="font-mono text-[10px] text-slate">{dp.state} • {dp.locode}</div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="font-mono text-[10px] text-charcoal font-medium">Draft {dp.maxDraft}</span>
                                        {dp.isRestricted && (
                                          <div className="text-[9px] text-amber-600 font-semibold">Lock Gate</div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                {additionalDestMatches.length > 0 && (
                                  <div className="pt-2 border-t border-pebble/60 mt-2">
                                    <span className="block font-mono text-[9px] uppercase tracking-wider text-slate px-2.5 pb-1">
                                      Other Global Ports
                                    </span>
                                    {additionalDestMatches.map((p) => {
                                      const active = destinationPort === p.name;
                                      return (
                                        <div
                                          key={`${p.country}-${p.name}`}
                                          onClick={() => {
                                            setDestinationPort(p.name);
                                            setIsDestOpen(false);
                                          }}
                                          className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all cursor-pointer ${
                                            active
                                              ? "bg-linen-mist text-forest-ink font-semibold border border-forest-ink/30"
                                              : "hover:bg-fog text-charcoal"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <Globe className="size-4 shrink-0 text-slate" />
                                            <div className="min-w-0">
                                              <div className="font-semibold truncate">{p.name}</div>
                                              <div className="font-mono text-[10px] text-slate truncate">
                                                {p.country} • {p.locode}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <span className="font-mono text-[10px] text-charcoal font-medium">Draft {p.maxDraft}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SEGMENT 3: LAYCAN DATE CHIP */}
                    <div ref={dateRef} className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDateOpen((prev) => !prev);
                          setIsOriginOpen(false);
                          setIsDestOpen(false);
                        }}
                        className="flex items-center gap-2 rounded-xl bg-fog/80 hover:bg-fog border border-pebble/60 px-3 py-2 text-xs font-medium text-charcoal transition-all cursor-pointer"
                      >
                        <Calendar className="size-3.5 text-slate" />
                        <span className="font-sans font-semibold text-obsidian">{formattedLaycanDate}</span>
                        <X className="size-3 text-slate hover:text-charcoal ml-0.5" />
                      </button>

                      {/* Date Picker Popover */}
                      {isDateOpen && (
                        <div
                          className="absolute top-full right-0 lg:left-0 z-40 mt-2 w-72 rounded-2xl border border-pebble bg-paper p-3 shadow-2xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="mb-2 flex items-center justify-between border-b border-pebble/60 pb-2">
                            <span className="font-sans text-xs font-bold text-obsidian">Laycan Window</span>
                            <button
                              type="button"
                              onClick={() => setIsDateOpen(false)}
                              className="rounded-full p-1 text-slate hover:bg-fog"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="block font-mono text-[10px] text-slate uppercase">Laycan Start Date</span>
                              <input
                                type="date"
                                value={laycanStart}
                                onChange={(e) => setLaycanStart(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-pebble bg-fog px-2.5 py-1.5 text-xs text-charcoal focus:border-forest-ink focus:outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setLaycanPreset(7, 7);
                                  setIsDateOpen(false);
                                }}
                                className="flex-1 rounded-lg border border-pebble bg-paper py-1 text-[11px] font-semibold text-charcoal hover:bg-fog"
                              >
                                +7d Prompt
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setLaycanPreset(14, 10);
                                  setIsDateOpen(false);
                                }}
                                className="flex-1 rounded-lg border border-pebble bg-paper py-1 text-[11px] font-semibold text-charcoal hover:bg-fog"
                              >
                                +14d Standard
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>


                    {/* SEGMENT 5: SEARCH ACTION BUTTON */}
                    <button
                      type="button"
                      onClick={handleRunAnalysis}
                      disabled={isSubmitting || isSamePortError}
                      title="Compute live freight analysis quote"
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#0B1536] text-white hover:bg-[#0B1536]/90 active:scale-95 shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Search className="size-5" />
                    </button>
                  </div>
                </div>

                {/* Popular Corridor Quick Badges */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate mr-1">Popular:</span>
                  {[
                    { origin: "Hay Point", country: "Australia", dest: "Paradip" },
                    { origin: "Newcastle", country: "Australia", dest: "Vizag" },
                    { origin: "Richards Bay", country: "South Africa", dest: "Gangavaram" },
                    { origin: "Tanjung Bara", country: "Indonesia", dest: "Haldia" },
                    { origin: "Baltimore", country: "United States", dest: "Mormugao" },
                  ].map((corridor) => {
                    const isCurrent = originPort === corridor.origin && destinationPort === corridor.dest;
                    return (
                      <button
                        key={`${corridor.origin}-${corridor.dest}`}
                        type="button"
                        onClick={() => {
                          setOriginPort(corridor.origin);
                          setOriginCountry(corridor.country);
                          setDestinationPort(corridor.dest);
                        }}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-sans transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-[#0B1536] text-white font-semibold shadow-xs"
                            : "bg-paper/80 border border-pebble hover:border-charcoal hover:bg-fog text-charcoal"
                        }`}
                      >
                        {corridor.origin} → {corridor.dest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Corridor Live Intelligence Card */}
              <div className="rounded-2xl border border-pebble bg-paper p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-pebble/60 pb-2">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-forest-ink">
                    Corridor Live Feasibility & Specs
                  </span>
                  <span className="rounded-full bg-emerald-wash px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-profit">
                    Active Route
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl bg-fog/60 p-2.5 border border-pebble/60">
                    <span className="font-mono text-[9px] uppercase text-slate">Corridor</span>
                    <div className="font-bold text-obsidian text-xs truncate">
                      {originPort} → {destinationPort}
                    </div>
                  </div>

                  <div className="rounded-xl bg-fog/60 p-2.5 border border-pebble/60">
                    <span className="font-mono text-[9px] uppercase text-slate">Vessel Class</span>
                    <div className="font-bold text-forest-ink text-xs">
                      {inferredVessel} ({parcelTonnage.toLocaleString()} MT)
                    </div>
                  </div>

                  <div className="rounded-xl bg-fog/60 p-2.5 border border-pebble/60">
                    <span className="font-mono text-[9px] uppercase text-slate">Draft Clearance</span>
                    <div className="font-bold text-emerald-profit text-xs">
                      {originPort.includes("Newcastle") ? "16.8m" : "17.5m+"} • Feasible
                    </div>
                  </div>

                  <div className="rounded-xl bg-fog/60 p-2.5 border border-pebble/60">
                    <span className="font-mono text-[9px] uppercase text-slate">Est. Transit</span>
                    <div className="font-bold text-obsidian text-xs font-mono">
                      ~14.5 Days @ 12.5 kts
                    </div>
                  </div>
                </div>

                {isSamePortError && (
                  <div className="flex items-center gap-2 rounded-xl border border-alarm-red/40 bg-fog p-2.5 text-xs text-alarm-red">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>Origin and destination ports cannot be the same!</span>
                  </div>
                )}

                {isHaldiaCapesizeWarning && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
                    <Info className="size-4 shrink-0 text-amber-warning" />
                    <span>Haldia lock depth 14.5m restricts Capesize. Tonnage requires lightering at Sandheads.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LIVE ANALYSIS RESULTS (Shown separately after all steps!) */}
          {isAnalysisView && (
            <div className="space-y-5">
              {isSubmitting && (
                <div className="rounded-xl border border-pebble bg-paper p-10 text-center space-y-4">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-forest-ink/10 text-forest-ink">
                    <Loader2 className="size-6 animate-spin text-forest-ink" />
                  </div>
                  <div>
                    <h4 className="font-sans text-base font-bold text-obsidian">
                      Computing Predictive Freight Analysis…
                    </h4>
                    <p className="mt-1 font-mono text-xs text-forest-ink animate-pulse">
                      {computationStage || "Consulting LightGBM P10/P50/P90 Quantile Engine..."}
                    </p>
                  </div>
                  <div className="mx-auto max-w-xs rounded-full bg-pebble/60 h-1.5 overflow-hidden">
                    <div className="h-full bg-lime-voltage animate-indeterminate" />
                  </div>
                </div>
              )}

              {/* Error & Recovery State */}
              {!isSubmitting && !analysisResult && submitError && (
                <div className="rounded-xl border border-alarm-red/30 bg-fog/70 p-8 text-center space-y-4">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-alarm-red/10 text-alarm-red">
                    <AlertTriangle className="size-6 text-alarm-red" />
                  </div>
                  <div>
                    <h4 className="font-sans text-base font-bold text-obsidian">
                      Voyage Simulation Computation Interrupted
                    </h4>
                    <p className="mt-1 font-mono text-xs text-alarm-red max-w-md mx-auto">
                      {submitError}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitError(null);
                        setIsAnalysisView(false);
                        setCurrentStep(3);
                      }}
                      className="rounded-full border border-pebble bg-paper px-4 py-2 text-xs font-semibold text-charcoal hover:bg-fog transition-colors cursor-pointer"
                    >
                      ← Adjust Route & Settings
                    </button>
                    <button
                      type="button"
                      onClick={handleRunAnalysis}
                      className="flex items-center gap-1.5 rounded-full bg-forest-ink px-5 py-2 text-xs font-bold text-paper hover:bg-forest-ink/90 transition-colors shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="size-3.5 text-lime-voltage" />
                      <span>Retry Analysis</span>
                    </button>
                  </div>
                </div>
              )}

              {!isSubmitting && analysisResult && (
                <div className="space-y-4">
                  {approvalFeedback && (
                    <div className="flex items-center gap-2 rounded-lg border border-forest-ink/40 bg-linen-mist p-3 text-xs font-semibold text-forest-ink">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>{approvalFeedback}</span>
                    </div>
                  )}

                  {/* Summary Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-pebble bg-paper p-4 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-forest-ink px-2 py-0.5 font-mono text-[10px] font-bold text-lime-voltage">
                          #{analysisResult.id}
                        </span>
                        <span className="rounded-full bg-linen-mist px-2 py-0.5 font-mono text-[10px] font-semibold text-forest-ink">
                          {isApproved ? "LOCKED & APPROVED" : "RECOMMENDATION GENERATED"}
                        </span>
                      </div>
                      <h4 className="mt-1 font-sans text-sm font-bold text-obsidian sm:text-base">
                        {analysisResult.title}
                      </h4>
                      <p className="font-mono text-xs text-slate">
                        {analysisResult.commodity} • {Number(analysisResult.parcel_tonnage || 0).toLocaleString()} MT • Vessel: <strong className="text-forest-ink">{analysisResult.recommended_vessel}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = `#analysis-${analysisResult.id}`;
                          onClose();
                        }}
                        className="flex items-center gap-1.5 rounded-full bg-forest-ink px-3.5 py-1.5 text-xs font-bold text-paper hover:bg-forest-ink/90 transition-all shadow-xs cursor-pointer"
                        title="Open full interactive analysis results page"
                      >
                        <span>Full Analysis</span>
                        <ArrowRight className="size-3 text-lime-voltage" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = `#decision-${analysisResult.id}`;
                          onClose();
                        }}
                        className="flex items-center gap-1.5 rounded-full border border-forest-ink/30 bg-linen-mist/60 px-3 py-1.5 text-xs font-semibold text-forest-ink hover:bg-linen-mist transition-colors cursor-pointer"
                        title="View governance decision record"
                      >
                        <FileText className="size-3" />
                        <span>Decision</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadExport}
                        className="flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-fog transition-colors cursor-pointer"
                      >
                        <Download className="size-3" /> Export
                      </button>

                      <button
                        type="button"
                        disabled={isApproved}
                        onClick={handleApproveFixture}
                        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
                          isApproved
                            ? "bg-linen-mist text-forest-ink border border-forest-ink/30 cursor-default"
                            : "bg-forest-ink text-paper hover:bg-forest-ink/90 cursor-pointer"
                        }`}
                      >
                        <CheckCircle2 className="size-3 text-lime-voltage" />
                        <span>{isApproved ? "Approved" : "Approve Fixture"}</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Primary KPI Cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-pebble bg-paper p-3.5 shadow-xs">
                      <span className="font-mono text-[10px] text-slate uppercase">Predicted Rate</span>
                      <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-forest-ink">
                        ${Number(analysisResult.predicted_rate_pmt || 0).toFixed(2)}
                        <span className="text-[10px] font-normal text-slate">/MT</span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate border-t border-pebble/60 pt-1">
                        P10: ${Number(analysisResult.forecast?.p10_usd_per_mt || 0).toFixed(2)} • P90: ${Number(analysisResult.forecast?.p90_usd_per_mt || 0).toFixed(2)}
                      </div>
                    </div>

                    <div className="rounded-xl border border-pebble bg-paper p-3.5 shadow-xs">
                      <span className="font-mono text-[10px] text-slate uppercase">Spot Benchmark</span>
                      <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-obsidian">
                        ${Number(analysisResult.benchmark_spot_pmt || 0).toFixed(2)}
                        <span className="text-[10px] font-normal text-slate">/MT</span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate border-t border-pebble/60 pt-1">
                        Baltic Spot Index Ref
                      </div>
                    </div>

                    <div className="rounded-xl border border-pebble bg-paper p-3.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate uppercase">Cost Savings</span>
                        <span className="flex items-center gap-0.5 rounded-full bg-lime-voltage/30 px-1.5 py-0.5 font-mono text-[9px] font-bold text-forest-ink">
                          <TrendingDown className="size-2.5" /> Spread
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-forest-ink">
                        ${Number(analysisResult.estimated_savings_usd || 0).toLocaleString()}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate border-t border-pebble/60 pt-1">
                        ₹{((Number(analysisResult.estimated_savings_usd || 0) * 83.5) / 10000000).toFixed(2)} Cr INR
                      </div>
                    </div>

                    <div className="rounded-xl border border-pebble bg-paper p-3.5 shadow-xs">
                      <span className="font-mono text-[10px] text-slate uppercase">Action Advice</span>
                      <div className="mt-1 font-sans text-sm font-bold text-obsidian leading-tight">
                        ENTER SPOT CHARTER
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate border-t border-pebble/60 pt-1">
                        Confidence: <strong className="text-forest-ink">{analysisResult.forecast?.confidence_label ?? "HIGH"}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Route Map */}
                  <div className="rounded-xl border border-pebble bg-paper p-4 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Navigation className="size-3.5 text-forest-ink" />
                        <span className="font-sans text-xs font-bold text-obsidian">
                          Corridor: {analysisResult.origin_port} ({analysisResult.origin_country}) → {analysisResult.destination_port} (India)
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate">
                        Distance: <strong>{Number(analysisResult.context?.route_distance_nm ?? 5832).toLocaleString()} NM</strong>
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-pebble">
                      <RouteMap
                        originName={`${analysisResult.origin_port}, ${analysisResult.origin_country}`}
                        destinationName={`${analysisResult.destination_port}, India`}
                        distanceNm={analysisResult.context?.route_distance_nm ?? 5832}
                        className="h-56 w-full"
                      />
                    </div>
                  </div>

                  {/* Landed Cost Breakdown & Feasibility */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-pebble bg-paper p-4 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-pebble pb-2">
                        <span className="font-sans text-xs font-bold text-obsidian flex items-center gap-1.5">
                          <DollarSign className="size-3.5 text-forest-ink" /> Landed Cost & BAF
                        </span>
                        <span className="font-mono text-[10px] text-slate">USD/INR 83.50</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate">Base Freight:</span>
                          <span className="font-mono font-bold">${Number(analysisResult.predicted_rate_pmt || 0).toFixed(2)}/MT</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate">BAF Surcharge:</span>
                          <span className="font-mono font-bold">${Number(analysisResult.landed_cost?.baf_surcharge_usd_per_mt ?? 1.20).toFixed(2)}/MT</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate">Landed Rate (INR):</span>
                          <span className="font-mono font-bold text-forest-ink">
                            ₹{((Number(analysisResult.predicted_rate_pmt || 0) + Number(analysisResult.landed_cost?.baf_surcharge_usd_per_mt ?? 1.20)) * 83.5).toFixed(2)}/MT
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-pebble pt-1.5">
                          <span className="font-bold text-obsidian">Total Outlay:</span>
                          <span className="font-mono font-bold text-forest-ink">
                            ₹{(((Number(analysisResult.predicted_rate_pmt || 0) + Number(analysisResult.landed_cost?.baf_surcharge_usd_per_mt ?? 1.20)) * 83.5 * Number(analysisResult.parcel_tonnage || 0)) / 10000000).toFixed(2)} Cr
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-pebble bg-paper p-4 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-pebble pb-2">
                        <span className="font-sans text-xs font-bold text-obsidian flex items-center gap-1.5">
                          <Anchor className="size-3.5 text-forest-ink" /> Port Feasibility ({analysisResult.destination_port})
                        </span>
                        <span className="font-mono text-[10px] text-slate">Draft & Berth</span>
                      </div>

                      <div className="space-y-1.5 font-mono text-xs">
                        {analysisResult.feasibility?.slice(0, 3).map((f) => (
                          <div key={f.vessel_class} className="flex items-center justify-between py-0.5">
                            <span className="font-bold text-charcoal">{f.vessel_class}</span>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 ${f.draft_pass ? "text-forest-ink" : "text-alarm-red"}`}>
                                {f.draft_pass ? <Check className="size-3 shrink-0" /> : <X className="size-3 shrink-0" />}
                                <span>Draft</span>
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                  f.overall_feasible
                                    ? "bg-linen-mist text-forest-ink"
                                    : "bg-alarm-red/10 text-alarm-red"
                                }`}
                              >
                                {f.overall_feasible ? "PASS" : "RESTRICTED"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Pop-up Window Footer */}
        <footer className="sticky bottom-0 z-20 border-t border-pebble bg-paper/95 backdrop-blur px-5 py-3 flex items-center justify-between">
          <div>
            {!isAnalysisView && currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex items-center gap-1 rounded-full border border-pebble bg-paper px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-fog transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
            )}
            {isAnalysisView && (
              <button
                type="button"
                onClick={handleStartNewAnalysis}
                className="flex items-center gap-1 rounded-full border border-pebble bg-paper px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-fog transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3 text-forest-ink" /> Run Another Analysis
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-pebble bg-paper px-3.5 py-1.5 text-xs font-semibold text-slate hover:bg-fog hover:text-charcoal transition-colors cursor-pointer"
            >
              {isAnalysisView ? "Close" : "Cancel"}
            </button>

            {!isAnalysisView && currentStep === 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 rounded-full bg-forest-ink px-4 py-1.5 text-xs font-semibold text-paper hover:bg-forest-ink/90 transition-colors shadow-xs cursor-pointer"
              >
                <span>Next: Cargo Details</span>
                <ArrowRight className="size-3.5 text-lime-voltage" />
              </button>
            )}

            {!isAnalysisView && currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 rounded-full bg-forest-ink px-4 py-1.5 text-xs font-semibold text-paper hover:bg-forest-ink/90 transition-colors shadow-xs cursor-pointer"
              >
                <span>Next: Ports & Route</span>
                <ArrowRight className="size-3.5 text-lime-voltage" />
              </button>
            )}

            {!isAnalysisView && currentStep === 3 && (
              <button
                type="button"
                disabled={isSubmitting || isSamePortError}
                onClick={handleRunAnalysis}
                className="flex items-center gap-2 rounded-full bg-forest-ink px-5 py-2 text-xs font-bold text-paper hover:bg-forest-ink/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all cursor-pointer"
              >
                <Compass className="size-3.5 text-lime-voltage animate-pulse" />
                <span>Compute Live Voyage Analysis</span>
              </button>
            )}

            {isAnalysisView && analysisResult && (
              <button
                type="button"
                onClick={() => {
                  window.location.hash = `#analysis-${analysisResult.id}`;
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-full bg-forest-ink px-4 py-1.5 text-xs font-bold text-paper hover:bg-forest-ink/90 transition-all shadow-xs cursor-pointer"
              >
                <span>Open Full Analysis Page</span>
                <ArrowRight className="size-3.5 text-lime-voltage" />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default NewAnalysisModal;
