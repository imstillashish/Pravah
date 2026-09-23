import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api";
import { Compass, Lock, Mail, User, AlertCircle, ArrowRight } from "lucide-react";
import { PrimaryButton, Card, TextButton } from "../components/ui";
import { AstitvaLogo } from "../components/AstitvaLogo";
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

export const AuthPage: React.FC = () => {
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
      <aside className="m-4 hidden flex-col justify-between rounded-xl bg-forest-ink p-12 lg:flex">
        <AstitvaLogo size={32} variant="inverse" subtitle={true} />

        <div>
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

        <div className="font-mono text-xs text-paper/60">Steel in motion, rates on time</div>
      </aside>

      {/* Auth side — Paper canvas, card centered */}
      <main className="flex flex-col justify-center px-4 py-10 sm:px-8">
        {/* Mobile banner — condensed hero */}
        <div className="mb-6 rounded-xl bg-forest-ink p-6 lg:hidden">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-lime-voltage text-forest-ink">
              <Compass className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-paper">Intelligent Freight Portal</span>
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

          <div className="mt-6 border-t border-pebble pt-5 text-center">
            <TextButton
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
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
