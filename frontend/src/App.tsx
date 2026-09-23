import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { IconRail } from "./components/IconRail";
import { TopBar } from "./components/TopBar";
import { RightRail } from "./components/RightRail";
import { AuthPage } from "./pages/AuthPage";
import { SignUpPage } from "./pages/SignUpPage";
import { Dashboard } from "./pages/Dashboard";
import { AnalysisResultsPage } from "./pages/AnalysisResultsPage";
import { ScenarioViewPage } from "./pages/ScenarioViewPage";
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

  if (!user) {
    return (
      <div className="min-h-screen bg-paper">
        {currentView === "signup" ? (
          <SignUpPage
            onSwitchToLogin={() => {
              window.location.hash = "#login";
              setCurrentView("login");
            }}
          />
        ) : (
          <AuthPage
            onNavigateToSignUp={() => {
              window.location.hash = "#signup";
              setCurrentView("signup");
            }}
          />
        )}
        {import.meta.env.DEV && <Agentation />}
      </div>
    );
  }

  const isPlanner = user.role === "logistics_planner";

  // Parse analysis id if URL hash is e.g. #analysis-1 or #results-1
  let activeAnalysisId: number | string = 1;
  if (currentView.startsWith("analysis-")) {
    const parsed = parseInt(currentView.replace("analysis-", ""), 10);
    if (!isNaN(parsed)) activeAnalysisId = parsed;
  }

  const renderContent = () => {
    if (currentView === "results" || currentView.startsWith("analysis")) {
      return <AnalysisResultsPage analysisId={activeAnalysisId} />;
    }
    if (currentView === "scenario") {
      return <ScenarioViewPage />;
    }
    if (currentView === "admin-reference") {
      return <AdminReferencePage />;
    }
    if (currentView === "admin-users") {
      return <AdminUsersPage />;
    }
    if (currentView === "audit-logs") {
      return <AuditLogPage />;
    }
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
