import { AuthProvider, useAuth } from "./context/AuthContext";
import { IconRail } from "./components/IconRail";
import { TopBar } from "./components/TopBar";
import { RightRail } from "./components/RightRail";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { Agentation } from "agentation";

function MainApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-line-strong border-t-mint-500" />
          <span className="font-mono text-xs text-muted">Establishing session…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-canvas">
        <AuthPage />
        {import.meta.env.DEV && <Agentation />}
      </div>
    );
  }

  const isPlanner = user.role === "logistics_planner";

  return (
    <div className="min-h-screen bg-canvas">
      <IconRail />
      <TopBar />
      <div className="flex">
        <div className="min-w-0 flex-1 md:pl-14">
          <Dashboard />
        </div>
        <RightRail desk={isPlanner ? "planner" : "operator"} />
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
