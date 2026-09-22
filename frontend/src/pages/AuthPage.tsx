import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api";
import { Compass, Lock, Mail, User, AlertCircle, ArrowRight } from "lucide-react";
import { PrimaryButton, Card } from "../components/ui";
import { cx } from "../lib/cn";

/**
 * AuthPage — Admiralty Chart mode: Foam chart sheet, ruled card,
 * recessed input wells, filled Abyss CTA. Errors are hazards: dotted
 * Slate rule + "!" glyph, never a second hue (DESIGN.md §7).
 */
const INPUT_CLASS =
  "w-full rounded-lg border border-line bg-well py-2.5 pl-10 pr-3.5 text-sm " +
  "text-ink placeholder:text-faint transition-colors duration-150 " +
  "hover:border-line-strong focus:border-sea-600 focus:outline-none";

const LABEL_CLASS = "mb-1.5 block text-sm font-normal text-body";

export const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"logistics_planner" | "port_operator">("logistics_planner");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen">
      {/* Chart margin band */}
      <div className="border-b border-line bg-card">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-4">
          <span className="flex size-6 items-center justify-center rounded-sm bg-mint-500 text-sea-900">
            <Compass className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-normal text-sea-900">Intelligent Freight Portal</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.08em] text-muted sm:inline">
            SAIL Bulk Chartering
          </span>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            SECURE TERMINAL
          </span>
        </div>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-md border border-line bg-card">
            <Compass className="size-6 text-sea-600" aria-hidden="true" />
          </div>
          <h1 className="text-[32px] font-semibold leading-tight text-sea-900">
            {isRegister ? "Create your operations account" : "Access the freight terminal"}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-body">
            {isRegister
              ? "Sign up to track freight indices, forecast charter rates, and plan berthing at Indian East Coast ports."
              : "Sign in to access your freight forecasting desk and port operations panel."}
          </p>
        </div>

        <Card className="mx-auto mt-8 w-full max-w-md p-6 sm:p-8">
          {errorMsg && (
            <div
              id="auth-error"
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-sm border border-coral-500/40 bg-coral-100 p-4"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border border-coral-500/50 font-mono text-xs font-semibold text-coral-700"
              >
                !
              </span>
              <div className="text-sm font-semibold text-coral-700">{errorMsg}</div>
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-coral-700" aria-hidden="true" />
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label htmlFor="full-name" className={LABEL_CLASS}>
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-3 size-4 text-muted"
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
                  className="absolute left-3.5 top-3 size-4 text-muted"
                  aria-hidden="true"
                />
                <input
                  id="work-email"
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
                  className="absolute left-3.5 top-3 size-4 text-muted"
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
                <span className="mb-2 block text-sm font-normal text-body">
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
                          "flex min-h-[76px] cursor-pointer flex-col justify-between rounded-sm border p-3 text-left transition-colors duration-150",
                          selected
                            ? "border-sea-600 bg-glass-50"
                            : "border-line bg-card hover:border-sea-600",
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                            {desk.code}
                          </span>
                          <span
                            aria-hidden="true"
                            className={cx(
                              "size-2.5 rounded-full transition-colors",
                              selected ? "bg-sea-600" : "border border-line-strong",
                            )}
                          />
                        </div>
                        <div className="mt-1">
                          <div className="text-sm font-medium text-sea-900">{desk.title}</div>
                          <div className="text-xs text-body">{desk.sub}</div>
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

          <div className="mt-6 border-t border-line pt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
              }}
              className="cursor-pointer text-sm font-medium text-sea-600 underline underline-offset-2 transition-colors duration-150 hover:text-sea-800"
            >
              {isRegister
                ? "Already have an account? Sign in here"
                : "Don't have an account yet? Register here"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
