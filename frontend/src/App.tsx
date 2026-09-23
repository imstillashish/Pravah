import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { IconRail } from "./components/IconRail";
import { TopBar } from "./components/TopBar";
import { RightRail } from "./components/RightRail";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { SignUpPage } from "./pages/SignUpPage";
import { Dashboard } from "./pages/Dashboard";
import { NewAnalysisPage } from "./pages/NewAnalysisPage";
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
import { Agentation } from "agentation";

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>(
    window.location.hash.replace("#", "") || "dashboard"
  );

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      setCurrentView(hash || "dashboard");
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

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
  }

  let activeBookingId: number | string = 1;
  if (currentView.startsWith("booking-")) {
    const parsed = parseInt(currentView.replace("booking-", ""), 10);
    if (!isNaN(parsed)) activeBookingId = parsed;
  }

  // Task 404: 16-page router mapping from Features.md
  const renderContent = () => {
    // Page 4: Dashboard
    if (currentView === "dashboard" || currentView === "") {
      return <Dashboard />;
    }
    // Page 5: New Analysis
    if (currentView === "new-analysis") {
      return <NewAnalysisPage />;
    }
    // Page 6: Analysis Results
    if (currentView === "results" || currentView.startsWith("analysis")) {
      return <AnalysisResultsPage analysisId={activeAnalysisId} />;
    }
    // Page 7: Scenario Studio
    if (currentView === "scenario") {
      return <ScenarioViewPage />;
    }
    // Page 8: Decision Record (Tasks 380–383, 390)
    if (currentView === "decision" || currentView.startsWith("decision-")) {
      return <DecisionRecordPage analysisId={activeAnalysisId} />;
    }
    // Page 9: My Analyses / History (Tasks 384–386)
    if (currentView === "history") {
      return <HistoryPage />;
    }
    // Page 10: Booking Page (Tasks 387–390)
    if (currentView === "booking" || currentView.startsWith("booking-") || currentView === "bookings") {
      return <BookingPage bookingId={activeBookingId} />;
    }
    // Page 11: Demand Board (Tasks 391–394)
    if (currentView === "demand" || currentView === "demand-board") {
      return <DemandBoardPage />;
    }
    // Page 12: Vendor Quotes (Tasks 395–397)
    if (currentView === "quotes" || currentView === "vendor-quotes") {
      return <VendorQuotesPage />;
    }
    // Page 13: Live Map Page (Tasks 398–401)
    if (currentView === "live-map" || currentView === "map") {
      return <LiveMapPage />;
    }
    // Page 14: Admin Reference Data (Tasks 253, 406)
    if (currentView === "admin-reference") {
      return <AdminReferencePage />;
    }
    // Page 15: Admin Users (Tasks 254, 406)
    if (currentView === "admin-users") {
      return <AdminUsersPage />;
    }
    // Page 16: Audit Logs (Task 255)
    if (currentView === "audit-logs" || currentView === "audit") {
      return <AuditLogPage />;
    }

    // Fallback: Dashboard
    return <Dashboard />;
  };

  return (
    <div className="min-h-screen bg-paper">
      <IconRail />
      <TopBar />
      <div className="flex">
        <div className="min-w-0 flex-1 md:pl-14">
          {renderContent()}
        </div>
        {currentView === "dashboard" && (
          <RightRail desk={isPlanner ? "planner" : "operator"} />
        )}
      </div>
      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
