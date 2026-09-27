import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api";
import { Compass, Lock, Mail, User, AlertCircle, ArrowRight, Ship, Anchor, ShieldCheck } from "lucide-react";
import { PrimaryButton, Card, TextButton } from "../components/ui";
import { PravahLogo } from "../components/PravahLogo";
import { MaritimeGlobe } from "../components/MaritimeGlobe";
import { cx } from "../lib/cn";

/**
 * AuthPage — Wise recomposition (spec §7): asymmetric split. Left 45%
 * is the Forest Ink panel with the 89px Inter 900 Lime display
 * headline — the one Persuade surface in the app. Right 55% is the
 * auth card on Paper. All auth logic ported unchanged.
 */
const INPUT_CLASS =
  "w-full rounded-card border border-pebble bg-paper py-2.5 pl-10 pr-3.5 text-sm " +
  "text-charcoal placeholder:text-slate transition-colors duration-150 " +
  "hover:border-charcoal focus:border-forest-ink focus:outline-none";

const LABEL_CLASS = "mb-1.5 block text-sm font-normal text-charcoal";

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
        setErrorMsg(data.detail || "Something didn't work. Please check your details and try again.");
      } else {
        login(data.access_token, data.user);
      }
    } catch {
      setErrorMsg("Unable to reach the server right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const DEMO_ACCOUNTS = [
    {
      roleName: "Freight Planner",
      code: "FR8-PLN",
      email: "demo@sail.gov.in",
      password: "Password123",
      Icon: Ship,
      desc: "Voyage planning & forecasting",
    },
    {
      roleName: "Port Operator",
      code: "PRT-OPS",
      email: "portops@sail.gov.in",
      password: "Password123",
      Icon: Anchor,
      desc: "Berth clearance & draft alerts",
    },
    {
      roleName: "Admin",
      code: "ADM-EXEC",
      email: "admin@sail.gov.in",
      password: "Password123",
      Icon: ShieldCheck,
      desc: "System management & logs",
    },
  ];

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setIsRegister(false);
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  const deskOptions = [
    {
      value: "logistics_planner" as const,
      code: "FR8-PLN",
      title: "Freight & Chartering",
      sub: "Procurement & contracts",
    },
    {
      value: "port_operator" as const,
      code: "PRT-OPS",
      title: "Port Operations",
      sub: "Berth clearance & dispatch",
    },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-[45fr_55fr]">
      {/* Forest Ink hero panel — the brand's display voice (desktop only) */}
      <aside className="relative m-4 hidden flex-col justify-between overflow-hidden rounded-[28px] bg-forest-ink p-12 lg:flex">
        <div className="relative z-10">
          <a
            href="#landing"
            className="inline-flex cursor-pointer transition-opacity hover:opacity-85"
            title="Return to Public Overview"
          >
            <PravahLogo size={32} variant="inverse" subtitle={true} />
          </a>
        </div>

        {/* 3D Maritime Route Globe */}
        <div className="absolute right-[-40px] top-[18%] z-0 h-[380px] w-[380px] opacity-75 xl:right-[10px] xl:h-[460px] xl:w-[460px]">
          <MaritimeGlobe className="h-full w-full" />
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl font-black leading-[0.9] tracking-[-0.03em] text-lime-voltage xl:text-[64px] 2xl:text-[89px]">
            Know your rate before you book.
          </h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-paper/90">
            Forecasted rates, plant windows, and booking guidance for SAIL&apos;s
            freight desk, powered by live market signals.
          </p>
          <PrimaryButton className="mt-8" onClick={() => emailRef.current?.focus()}>
            Run your first analysis
            <ArrowRight className="size-4" aria-hidden="true" />
          </PrimaryButton>
        </div>

        <div className="relative z-10 flex items-center justify-between font-mono text-xs text-paper/60">
          <span>Steel in motion, rates on time</span>
          <span className="flex items-center gap-1.5 text-lime-voltage">
            <span className="size-1.5 animate-pulse rounded-full bg-lime-voltage" />
            Live Global Route Radar
          </span>
        </div>
      </aside>

      {/* Auth side — Paper canvas, card centered */}
      <main className="flex flex-col justify-center px-4 py-10 sm:px-8">
        {/* Mobile banner — condensed hero */}
        <div className="mb-6 rounded-[28px] bg-forest-ink p-6 lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <a href="#landing" className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-lime-voltage text-forest-ink">
                <Compass className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-paper">Intelligent Freight Portal</span>
            </a>
            <a href="#landing" className="font-mono text-xs font-semibold text-lime-voltage hover:underline">
              Overview →
            </a>
          </div>
          <h1 className="text-2xl font-black leading-tight tracking-[-0.02em] text-lime-voltage">
            Know your rate before you book.
          </h1>
        </div>

        <Card className="mx-auto w-full max-w-md p-6 sm:p-8">
          <h2 className="text-xl font-semibold leading-tight text-forest-ink">
            {isRegister ? "Create your operations account" : "Access the freight terminal"}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal">
            {isRegister
              ? "Sign up to track freight indices, forecast charter rates, and plan berthing at Indian East Coast ports."
              : "Sign in to access your freight forecasting desk and port operations panel."}
          </p>

          {errorMsg && (
            <div
              id="auth-error"
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-card border border-pebble bg-fog p-4"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-alarm-red/40 font-mono text-xs font-semibold text-alarm-red"
              >
                !
              </span>
              <div className="flex-1 text-sm font-semibold text-alarm-red">{errorMsg}</div>
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-alarm-red" aria-hidden="true" />
            </div>
          )}

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label htmlFor="full-name" className={LABEL_CLASS}>
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-3 size-4 text-slate"
                    aria-hidden="true"
                  />
                  <input
                    id="full-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Arjun Verma"
                    aria-invalid={!!errorMsg}
                    aria-describedby={errorMsg ? "auth-error" : undefined}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="work-email" className={LABEL_CLASS}>
                Work Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-3 size-4 text-slate"
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
                  className="absolute left-3.5 top-3 size-4 text-slate"
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

            {isRegister && (
              <div>
                <span className="mb-2 block text-sm font-normal text-charcoal">
                  Choose your starting desk
                </span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {deskOptions.map((desk) => {
                    const selected = role === desk.value;
                    return (
                      <button
                        key={desk.value}
                        type="button"
                        onClick={() => setRole(desk.value)}
                        aria-pressed={selected}
                        className={cx(
                          "flex min-h-[76px] cursor-pointer flex-col justify-between rounded-card border p-3 text-left transition-colors duration-150",
                          selected
                            ? "border-forest-ink bg-linen-mist"
                            : "border-pebble bg-paper hover:border-forest-ink",
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
                            {desk.code}
                          </span>
                          <span
                            aria-hidden="true"
                            className={cx(
                              "size-2.5 rounded-full transition-colors",
                              selected ? "bg-forest-ink" : "border border-pebble",
                            )}
                          />
                        </div>
                        <div className="mt-1">
                          <div className="text-sm font-medium text-forest-ink">{desk.title}</div>
                          <div className="text-xs text-charcoal">{desk.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <PrimaryButton type="submit" disabled={loading} className="mt-5 w-full">
              <span>{loading ? "Verifying…" : isRegister ? "Create Account" : "Sign In"}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </PrimaryButton>
          </form>

          {/* Quick Demo Accounts Selection */}
          {!isRegister && (
            <div className="mt-6 border-t border-pebble pt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate">
                  Quick Demo Access
                </span>
                <span className="text-[11px] text-charcoal/70">Click to fill</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => fillDemoAccount(acc.email, acc.password)}
                      className={cx(
                        "group flex flex-col justify-between rounded-card border p-2.5 text-left transition-all duration-150 hover:border-forest-ink",
                        isSelected
                          ? "border-forest-ink bg-linen-mist ring-1 ring-forest-ink/20"
                          : "border-pebble bg-paper hover:bg-fog"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <acc.Icon className="size-4 text-forest-ink" />
                        <span className="font-mono text-[9px] font-semibold text-slate uppercase tracking-wide">
                          {acc.code}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-forest-ink leading-tight">
                          {acc.roleName}
                        </div>
                        <div className="text-[10px] text-charcoal/80 font-mono mt-0.5 truncate">
                          {acc.email}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
