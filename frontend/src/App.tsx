import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { IconRail } from "./components/IconRail";
import { TopBar } from "./components/TopBar";
import { RightRail } from "./components/RightRail";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { SignUpPage } from "./pages/SignUpPage";
import { Dashboard } from "./pages/Dashboard";
import { AnalysisResultsPage } from "./pages/AnalysisResultsPage";
import { ScenarioViewPage } from "./pages/ScenarioViewPage";
import { DecisionRecordPage } from "./pages/DecisionRecordPage";
import { HistoryPage } from "./pages/HistoryPage";
import { BookingPage } from "./pages/BookingPage";
import { DemandBoardPage } from "./pages/DemandBoardPage";
import { VendorQuotesPage } from "./pages/VendorQuotesPage";
import { LiveMapPage } from "./pages/LiveMapPage";
import { AdminReferencePage } from "./pages/AdminReferencePage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AuditLogPage } from "./pages/AuditLogPage";
import { NewAnalysisModal } from "./components/NewAnalysisModal";
import { TourProvider } from "./context/TourContext";
import { SpotlightTour } from "./components/SpotlightTour";
import { WalkthroughWelcomeModal } from "./components/WalkthroughWelcomeModal";
import { Agentation } from "agentation";

function MainApp() {
  const { user, isLoading } = useAuth();
  const initialHash = window.location.hash.replace("#", "");
  const [currentView, setCurrentView] = useState<string>(
    initialHash || (user ? "dashboard" : "login")
  );
  const [prevView, setPrevView] = useState<string>(
    initialHash && initialHash !== "new-analysis" ? initialHash : "dashboard"
  );

  const isAnalysisModalOpen = currentView === "new-analysis";

  useEffect(() => {
    if (!window.location.hash || (user && window.location.hash === "#login")) {
      window.location.hash = user ? "#dashboard" : "#login";
    }
  }, [user]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && hash !== "new-analysis") {
        setPrevView(hash);
      } else if (!hash) {
        setPrevView(user ? "dashboard" : "login");
      }
      setCurrentView(hash || (user ? "dashboard" : "login"));
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [user]);

  const handleCloseModal = () => {
    const target = prevView && prevView !== "new-analysis" ? `#${prevView}` : "#dashboard";
    window.location.hash = target;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-pebble border-t-lime-voltage" />
          <span className="font-mono text-xs text-slate">Establishing session…</span>
        </div>
      </div>
    );
  }

  // Public / Unauthenticated Views (Pages 1, 2, 3)
  if (!user) {
    if (currentView === "landing") {
      return (
        <div className="min-h-screen bg-paper">
          <LandingPage
            onNavigateToLogin={() => {
              window.location.hash = "#login";
              setCurrentView("login");
            }}
            onNavigateToSignUp={() => {
              window.location.hash = "#signup";
              setCurrentView("signup");
            }}
          />
          <WalkthroughWelcomeModal currentView={currentView} />
        </div>
      );
    }

    if (currentView === "signup") {
      return (
        <div className="min-h-screen bg-paper">
          <SignUpPage
            onSwitchToLogin={() => {
              window.location.hash = "#login";
              setCurrentView("login");
            }}
          />
          {import.meta.env.DEV && <Agentation />}
        </div>
      );
    }

    // Default unauthenticated: Login Page
    return (
      <div className="min-h-screen bg-paper">
        <AuthPage
          onNavigateToSignUp={() => {
            window.location.hash = "#signup";
            setCurrentView("signup");
          }}
        />
        <WalkthroughWelcomeModal currentView={currentView} />
        {import.meta.env.DEV && <Agentation />}
      </div>
    );
  }

  const isPlanner = user.role === "logistics_planner";

  // Parse parameters if URL hash is e.g. #analysis-1 or #booking-2
  let activeAnalysisId: number | string = 1;
  if (currentView.startsWith("analysis-")) {
    const parsed = parseInt(currentView.replace("analysis-", ""), 10);
    if (!isNaN(parsed)) activeAnalysisId = parsed;
  } else if (currentView.startsWith("decision-")) {
    const parsed = parseInt(currentView.replace("decision-", ""), 10);
    if (!isNaN(parsed)) activeAnalysisId = parsed;
  }

  let activeBookingId: number | string = 1;
  if (currentView.startsWith("booking-")) {
    const parsed = parseInt(currentView.replace("booking-", ""), 10);
    if (!isNaN(parsed)) activeBookingId = parsed;
  }

  // Task 404: 16-page router mapping from Features.md
  const renderContent = () => {
    // When popup modal is open, preserve whichever view was actively being viewed underneath!
    const effectiveView = currentView === "new-analysis" ? (prevView || "dashboard") : currentView;

    // Page 2: Login / Auth Demo (accessible even during active session or tour Step 1)
    if (effectiveView === "login") {
      return (
        <AuthPage
          onNavigateToSignUp={() => {
            window.location.hash = "#signup";
            setCurrentView("signup");
          }}
        />
      );
    }
    // Page 4: Dashboard
    if (effectiveView === "dashboard" || effectiveView === "") {
      return <Dashboard />;
    }
    // Page 6: Analysis Results
    if (effectiveView === "results" || effectiveView.startsWith("analysis")) {
      return <AnalysisResultsPage analysisId={activeAnalysisId} />;
    }
    // Page 7: Scenario Studio
    if (effectiveView === "scenario") {
      return <ScenarioViewPage />;
    }
    // Page 8: Decision Record (Tasks 380–383, 390)
    if (effectiveView === "decision" || effectiveView.startsWith("decision-")) {
      return <DecisionRecordPage analysisId={activeAnalysisId} />;
    }
    // Page 9: My Analyses / History (Tasks 384–386)
    if (effectiveView === "history") {
      return <HistoryPage />;
    }
    // Page 10: Booking Page (Tasks 387–390)
    if (effectiveView === "booking" || effectiveView.startsWith("booking-") || effectiveView === "bookings") {
      return <BookingPage bookingId={activeBookingId} />;
    }
    // Page 11: Demand Board (Tasks 391–394)
    if (effectiveView === "demand" || effectiveView === "demand-board") {
      return <DemandBoardPage />;
    }
    // Page 12: Vendor Quotes (Tasks 395–397)
    if (effectiveView === "quotes" || effectiveView === "vendor-quotes") {
      return <VendorQuotesPage />;
    }
    // Page 13: Live Map Page (Tasks 398–401)
    if (effectiveView === "live-map" || effectiveView === "map") {
      return <LiveMapPage />;
    }
    // Page 14: Admin Reference Data (Tasks 253, 406)
    if (effectiveView === "admin-reference") {
      return <AdminReferencePage />;
    }
    // Page 15: Admin Users (Tasks 254, 406)
    if (effectiveView === "admin-users") {
      return <AdminUsersPage />;
    }
    // Page 16: Audit Logs (Task 255)
    if (effectiveView === "audit-logs" || effectiveView === "audit") {
      return <AuditLogPage />;
    }

    // Fallback: Dashboard
    return <Dashboard />;
  };

  const underlyingView = currentView === "new-analysis" ? (prevView || "dashboard") : currentView;
  const isLoginView = underlyingView === "login";

  return (
    <div className="min-h-screen bg-paper">
      {!isLoginView && <IconRail currentView={currentView} />}
      {!isLoginView && <TopBar currentView={currentView} />}
      <div className="flex">
        <div className={`min-w-0 flex-1 ${!isLoginView ? "md:pl-14" : ""}`}>
          {renderContent()}
        </div>
        {underlyingView === "dashboard" && !isLoginView && (
          <RightRail desk={isPlanner ? "planner" : "operator"} />
        )}
      </div>

      {/* Interactive Voyage Analysis Pop-Up Window Modal */}
      <NewAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={handleCloseModal}
        onAnalysisCreated={(analysisId) => {
          setPrevView(`analysis-${analysisId}`);
          window.location.hash = `#analysis-${analysisId}`;
        }}
      />

      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TourProvider>
        <MainApp />
        <SpotlightTour />
      </TourProvider>
    </AuthProvider>
  );
}
