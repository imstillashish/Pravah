import React, { useState } from "react";
import { Compass, User, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { registerUser } from "../api/auth";
import { PrimaryButton, Card, TextButton } from "../components/ui";
import { PravahLogo } from "../components/PravahLogo";
import { MaritimeGlobe } from "../components/MaritimeGlobe";
import { cx } from "../lib/cn";
import type { RegisterPayload } from "../types";

export interface SignUpPageProps {
  onSwitchToLogin?: () => void;
}

const DESK_OPTIONS = [
  {
    value: "logistics_planner" as const,
    code: "PLN-DESK",
    title: "Logistics Planner",
    sub: "Procurement & contracts",
  },
  {
    value: "plant_manager" as const,
    code: "PLT-MGR",
    title: "Plant Manager",
    sub: "Stock & clearance",
  },
  {
    value: "admin" as const,
    code: "SYS-ADM",
    title: "Administrator",
    sub: "User approvals",
  },
];

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchToLogin }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"logistics_planner" | "plant_manager" | "admin">("logistics_planner");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Validation rules
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passwordLengthValid = password.length >= 8;
  const isFormValid = fullName.trim() !== "" && email.trim() !== "" && passwordLengthValid && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const payload: RegisterPayload = {
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        role,
      };

      const res = await registerUser(payload);
      setSuccessMsg(res.message || "Account created successfully. An admin must activate your account before you can log in.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          setErrorMsg(parsed.detail || err.message);
        } catch {
          setErrorMsg(err.message || "Failed to create account. Please check your credentials.");
        }
      } else {
        setErrorMsg("Failed to create account. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const INPUT_CLASS =
    "w-full rounded-card border border-pebble bg-paper py-2.5 pl-10 pr-3.5 text-sm " +
    "text-charcoal placeholder:text-slate transition-colors duration-150 " +
    "hover:border-charcoal focus:border-forest-ink focus:outline-none";

  const LABEL_CLASS = "mb-1.5 block text-sm font-normal text-charcoal";

  return (
    <div className="grid min-h-screen lg:grid-cols-[45fr_55fr]">
      {/* Forest Ink hero panel — matched directly from AuthPage */}
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
            Intelligent freight chartering.
          </h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-paper/90">
            Join SAIL&apos;s unified logistics desk to forecast voyage rates, monitor berthing
            congestion, and coordinate raw material deliveries with AI clarity.
          </p>
          <PrimaryButton
            className="mt-8"
            onClick={() => onSwitchToLogin ? onSwitchToLogin() : (window.location.hash = "#login")}
          >
            Sign in to existing account
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

      {/* Form side — Paper canvas, card centered */}
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
            Intelligent freight chartering.
          </h1>
        </div>

        <Card className="mx-auto w-full max-w-md p-6 sm:p-8">
          <h2 className="text-xl font-semibold leading-tight text-forest-ink">
            Create your operations account
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal">
            Register your credentials to access SAIL&apos;s freight forecasting desk and port operations.
          </p>

          {errorMsg && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-card border border-pebble bg-fog p-4"
            >
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-alarm-red" aria-hidden="true" />
              <div className="flex-1 text-sm font-semibold text-alarm-red">{errorMsg}</div>
            </div>
          )}

          {successMsg ? (
            <div className="mt-6 rounded-card border border-pebble bg-linen-mist p-6 text-center">
              <CheckCircle2 className="mx-auto mb-2.5 size-10 text-forest-ink" />
              <h3 className="text-base font-semibold text-forest-ink">Registration Submitted</h3>
              <p className="mt-1.5 text-sm text-forest-ink leading-relaxed">{successMsg}</p>
              <div className="mt-6">
                <PrimaryButton
                  type="button"
                  onClick={() => onSwitchToLogin ? onSwitchToLogin() : (window.location.hash = "#login")}
                  className="w-full justify-center"
                >
                  Return to Sign In
                  <ArrowRight className="size-4" aria-hidden="true" />
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="signup-name" className={LABEL_CLASS}>
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate" aria-hidden="true" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              {/* Work Email / Employee ID */}
              <div>
                <label htmlFor="signup-email" className={LABEL_CLASS}>
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate" aria-hidden="true" />
                  <input
                    id="signup-email"
                    type="text"
                    required
                    placeholder="name@sail.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              {/* Operational Desk Selection */}
              <div>
                <span className={LABEL_CLASS}>Assigned Operational Desk</span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {DESK_OPTIONS.map((desk) => {
                    const selected = role === desk.value;
                    return (
                      <button
                        key={desk.value}
                        type="button"
                        onClick={() => setRole(desk.value)}
                        aria-pressed={selected}
                        className={cx(
                          "flex min-h-[70px] cursor-pointer flex-col justify-between rounded-card border p-2.5 text-left transition-colors duration-150",
                          selected
                            ? "border-forest-ink bg-linen-mist"
                            : "border-pebble bg-paper hover:border-forest-ink"
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
                              selected ? "bg-forest-ink" : "border border-pebble"
                            )}
                          />
                        </div>
                        <div className="mt-1">
                          <div className="text-xs font-medium text-forest-ink leading-tight">{desk.title}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="signup-password" className={LABEL_CLASS}>
                    Password
                  </label>
                  <span className="text-[11px] font-mono text-slate">Min. 8 characters</span>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate" aria-hidden="true" />
                  <input
                    id="signup-password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="signup-confirm-password" className={LABEL_CLASS}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate" aria-hidden="true" />
                  <input
                    id="signup-confirm-password"
                    type="password"
                    required
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="mt-1 text-xs text-alarm-red font-medium">
                    Passwords do not match.
                  </p>
                )}
              </div>

              <PrimaryButton
                type="submit"
                disabled={!isFormValid || loading}
                className="mt-5 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? "Creating Account…" : "Create Account"}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </PrimaryButton>
            </form>
          )}

          <div className="mt-6 border-t border-pebble pt-5 text-center">
            <TextButton
              onClick={() => onSwitchToLogin ? onSwitchToLogin() : (window.location.hash = "#login")}
            >
              Already have an account? Sign in here
            </TextButton>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default SignUpPage;
