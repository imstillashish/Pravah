import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api";
import { Compass, Lock, Mail, User, AlertCircle, ArrowRight, Anchor } from "lucide-react";
import { PrimaryButton, Card, TextButton } from "../components/ui";
import { AstitvaLogo } from "../components/AstitvaLogo";
import { MaritimeGlobe } from "../components/MaritimeGlobe";

/**
 * AuthPage — Strict Oceanic Theme & Wise Architectural Recomposition
 * Strict WCAG AA contrast (≥ 4.5:1).
 * Left hero panel on Forest Ink with high-visibility Electric Cyan accents.
 * Right side high-contrast auth card on Paper canvas.
 */
const INPUT_CLASS =
  "w-full rounded-card border border-pebble bg-paper py-2.5 pl-10 pr-3.5 text-sm " +
  "text-charcoal placeholder:text-charcoal/50 shadow-sm transition-colors duration-150 " +
  "hover:border-forest-ink focus:border-forest-ink focus:ring-2 focus:ring-signal-blue focus:ring-offset-1 focus:outline-none";

const LABEL_CLASS = "mb-1.5 block text-xs font-bold text-forest-ink";

export interface AuthPageProps {
  onNavigateToSignUp?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigateToSignUp }) => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"logistics_planner" | "port_operator">("logistics_planner");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const endpoint = isRegister ? "/auth/signup" : "/auth/login";
    const body = isRegister ? { full_name: fullName, email, password, role } : { email, password };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.detail || "Authentication failed. Please verify your credentials and try again.");
      } else {
        login(data.access_token, data.user);
      }
    } catch {
      setErrorMsg("Unable to reach the maritime intelligence gateway. Please verify network connectivity and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && !loading) {
      // Allow default form submit behavior
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[45fr_55fr]">
      {/* Forest Ink hero panel — Deep Oceanic Abyss Surface (desktop only) */}
      <aside className="relative m-4 hidden flex-col justify-between overflow-hidden rounded-xl bg-forest-ink p-12 lg:flex shadow-xl">
        <div className="relative z-10">
          <AstitvaLogo size={32} variant="inverse" subtitle={true} />
        </div>

        {/* 3D Maritime Route Globe */}
        <div className="absolute right-[-40px] top-[18%] z-0 h-[380px] w-[380px] opacity-75 xl:right-[10px] xl:h-[460px] xl:w-[460px]">
          <MaritimeGlobe className="h-full w-full" />
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.03em] text-lime-voltage xl:text-[64px] 2xl:text-[80px]">
            Know your rate before you book.
          </h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-paper/90">
            Forecasted rates, plant stock thresholds, and authoritative charter recommendations for SAIL&apos;s
            freight desk, powered by multi-agent intelligence.
          </p>
          <PrimaryButton
            className="mt-8 shadow-md"
            onClick={() => emailRef.current?.focus()}
          >
            Run your first analysis
            <ArrowRight className="size-4" aria-hidden="true" />
          </PrimaryButton>
        </div>

        <div className="relative z-10 flex items-center justify-between font-mono text-xs text-paper/70 border-t border-paper/10 pt-4">
          <span>Authoritative Maritime Intelligence</span>
          <span className="flex items-center gap-1.5 font-bold text-lime-voltage">
            <span className="size-2 animate-pulse rounded-full bg-lime-voltage" />
            Live Global Route Radar
          </span>
        </div>
      </aside>

      {/* Auth side — Paper canvas with high-contrast card */}
      <main className="flex flex-col justify-center px-4 py-10 sm:px-8 bg-paper">
        {/* Mobile banner — condensed hero */}
        <div className="mb-6 rounded-xl bg-forest-ink p-6 lg:hidden shadow-md">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-lime-voltage text-forest-ink">
              <Compass className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold text-paper">Astitva Maritime Portal</span>
          </div>
          <h1 className="text-2xl font-black leading-tight tracking-[-0.02em] text-lime-voltage">
            Know your rate before you book.
          </h1>
        </div>

        <Card className="mx-auto w-full max-w-md p-6 sm:p-8 bg-paper border border-pebble shadow-sm">
          <h2 className="text-xl font-bold leading-tight text-forest-ink">
            {isRegister ? "Create Authorized Operations Account" : "Access Maritime Freight Terminal"}
          </h2>
          <p className="mt-1.5 text-xs text-charcoal leading-relaxed">
            {isRegister
              ? "Sign up to track freight indices, evaluate vessel fixtures, and optimize berthing at Indian East Coast ports."
              : "Sign in with your SAIL or official credentials to access the forecasting desk and operational controls."}
          </p>

          {/* High-contrast visible error message with role="alert" */}
          {errorMsg && (
            <div
              id="auth-error"
              role="alert"
              aria-live="assertive"
              className="mt-5 flex items-start gap-3 rounded-card border border-alarm-red/40 bg-alarm-wash p-3.5 shadow-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-alarm-red" aria-hidden="true" />
              <div className="flex-1 text-xs font-semibold leading-relaxed text-alarm-red">
                {errorMsg}
              </div>
            </div>
          )}

          <form
            className="mt-5 space-y-4"
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
          >
            {isRegister && (
              <div>
                <label htmlFor="full-name" className={LABEL_CLASS}>
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-3 size-4 text-charcoal/60"
                    aria-hidden="true"
                  />
                  <input
                    id="full-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    aria-invalid={!!errorMsg}
                    aria-describedby={errorMsg ? "auth-error" : undefined}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="work-email" className={LABEL_CLASS}>
                Official Work Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-3 size-4 text-charcoal/60"
                  aria-hidden="true"
                />
                <input
                  id="work-email"
                  ref={emailRef}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@sail.gov.in"
                  aria-invalid={!!errorMsg}
                  aria-describedby={errorMsg ? "auth-error" : undefined}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label htmlFor="account-password" className={LABEL_CLASS}>
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-3 size-4 text-charcoal/60"
                  aria-hidden="true"
                />
                <input
                  id="account-password"
                  type="password"
                  required
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  aria-invalid={!!errorMsg}
                  aria-describedby={errorMsg ? "auth-error" : undefined}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* Role Select Dropdown in Registration Mode */}
            {isRegister && (
              <div>
                <label htmlFor="auth-role" className={LABEL_CLASS}>
                  Operational Desk & Authority Role
                </label>
                <div className="relative">
                  {role === "logistics_planner" ? (
                    <Compass className="absolute left-3.5 top-3 size-4 text-spruce" aria-hidden="true" />
                  ) : (
                    <Anchor className="absolute left-3.5 top-3 size-4 text-amber-warning" aria-hidden="true" />
                  )}
                  <select
                    id="auth-role"
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as "logistics_planner" | "port_operator")
                    }
                    className="w-full rounded-card border border-pebble bg-paper py-2.5 pl-10 pr-8 text-sm font-semibold text-charcoal shadow-sm transition duration-150 hover:border-forest-ink focus:border-forest-ink focus:ring-2 focus:ring-signal-blue focus:ring-offset-1 focus:outline-none"
                  >
                    <option value="logistics_planner">Freight & Chartering Desk (logistics_planner)</option>
                    <option value="port_operator">Port Terminal Operations Desk (port_operator)</option>
                  </select>
                </div>

                <div className="mt-2 rounded-lg border border-pebble bg-fog p-2.5">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-forest-ink">
                    <span
                      className={`inline-block size-2 rounded-full ${
                        role === "logistics_planner" ? "bg-spruce" : "bg-amber-warning"
                      }`}
                    />
                    <span>{role === "logistics_planner" ? "CLEARANCE: FR8-PLN" : "CLEARANCE: PRT-OPS"}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-charcoal leading-relaxed">
                    {role === "logistics_planner"
                      ? "Authorizes parcel demand consolidation, voyage charter party optimization, and landed cost simulation."
                      : "Authorizes port draft constraint administration, lightering directives, and vessel discharge priority overrides."}
                  </p>
                </div>
              </div>
            )}

            <PrimaryButton
              type="submit"
              disabled={loading}
              className="mt-5 w-full shadow-sm focus-visible:ring-2 focus-visible:ring-signal-blue"
            >
              <span>{loading ? "Verifying Credentials…" : isRegister ? "Create Operations Account" : "Sign In to Terminal"}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </PrimaryButton>
          </form>

          <div className="mt-6 border-t border-pebble pt-5 text-center">
            <TextButton
              onClick={() => {
                if (onNavigateToSignUp) {
                  onNavigateToSignUp();
                } else {
                  setIsRegister(!isRegister);
                  setErrorMsg(null);
                }
              }}
              className="font-medium text-forest-ink hover:text-spruce"
            >
              {isRegister
                ? "Already have an account? Sign in here"
                : "Don't have an account yet? Register here"}
            </TextButton>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AuthPage;
