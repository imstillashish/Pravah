import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api";
import { Lock, Mail, User, AlertCircle, ArrowRight, Check } from "lucide-react";
import { PrimaryButton, Card, TextButton } from "../components/ui";
import { AstitvaLogo } from "../components/AstitvaLogo";
import { MaritimeGlobe } from "../components/MaritimeGlobe";
import { cx } from "../lib/cn";

/**
 * AuthPage — the single auth surface (spec-quality pass): sign-in and
 * sign-up are two states of one component. Hero = Oceanic Navy panel
 * with the MaritimeGlobe; the LIVE marker is a static cyan dot + mono
 * label (workspace rule: no pulse/ping). The form is a single-column
 * max-w-sm card; errors surface on submit, field validity on blur.
 */

const INPUT_CLASS =
  "w-full rounded-card border border-pebble bg-paper py-2.5 pl-10 pr-3.5 text-sm " +
  "text-charcoal placeholder:text-slate transition-colors duration-150 " +
  "hover:border-charcoal focus:border-forest-ink focus:outline-none " +
  "aria-[invalid=true]:border-alarm-red";

const LABEL_CLASS = "mb-1.5 block text-sm font-normal text-charcoal";

export interface AuthPageProps {
  initialMode?: "signin" | "signup";
  onNavigateToSignUp?: () => void;
}

type DeskValue = "logistics_planner" | "port_operator";

const DESK_OPTIONS: {
  value: DeskValue;
  code: string;
  title: string;
  sub: string;
}[] = [
  { value: "logistics_planner", code: "FR8-PLN", title: "Freight & Chartering", sub: "Procurement & contracts" },
  { value: "port_operator", code: "PRT-OPS", title: "Port Operations", sub: "Berth clearance & dispatch" },
];

const COPY = {
  signin: {
    hero: "Know your rate before you book.",
    sub: "Forecasted rates, plant windows, and booking guidance for SAIL's freight desk, powered by live market signals.",
    cta: "Run your first analysis",
    title: "Access the freight terminal",
    intro:
      "Sign in to access your freight forecasting desk and port operations panel.",
  },
  signup: {
    hero: "Intelligent freight chartering.",
    sub: "Join SAIL's unified logistics desk to forecast voyage rates, monitor berthing congestion, and coordinate raw material deliveries.",
    cta: "Sign in to existing account",
    title: "Create your operations account",
    intro:
      "Register your credentials to access SAIL's freight forecasting desk and port operations.",
  },
} as const;

/** Hero panel shared by both modes — one navy panel, one live marker. */
function AuthHero({
  mode,
  onCta,
}: {
  mode: "signin" | "signup";
  onCta: () => void;
}) {
  const c = COPY[mode];
  return (
    <aside className="relative m-4 hidden flex-col justify-between overflow-hidden rounded-xl bg-forest-ink p-12 lg:flex">
      <div className="relative z-10">
        <AstitvaLogo size={32} variant="inverse" subtitle={true} />
      </div>

      <div className="absolute right-[-40px] top-[18%] z-0 h-[380px] w-[380px] opacity-75 xl:right-[10px] xl:h-[460px] xl:w-[460px]">
        <MaritimeGlobe className="h-full w-full" />
      </div>

      <div className="relative z-10">
        <h1 className="max-w-[12ch] text-5xl font-black leading-[0.9] tracking-[-0.03em] text-lime-voltage xl:text-[64px] 2xl:text-[89px]">
          {c.hero}
        </h1>
        <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-paper/90">{c.sub}</p>
        <PrimaryButton className="mt-8" onClick={onCta}>
          {c.cta}
          <ArrowRight className="size-4" aria-hidden="true" />
        </PrimaryButton>
      </div>

      <div className="relative z-10 flex items-center justify-between font-mono text-xs text-paper/60">
        <span>Steel in motion, rates on time</span>
        <span className="flex items-center gap-1.5 text-lime-voltage">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-lime-voltage" />
          Live Global Route Radar
        </span>
      </div>
    </aside>
  );
}

/** Condensed mobile banner above the card. */
function AuthMobileBanner({ mode }: { mode: "signin" | "signup" }) {
  return (
    <div className="mb-6 rounded-xl bg-forest-ink p-6 lg:hidden">
      <h1 className="text-2xl font-black leading-tight tracking-[-0.02em] text-lime-voltage">
        {COPY[mode].hero}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-paper/90">{COPY[mode].sub}</p>
    </div>
  );
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = "signin",
  onNavigateToSignUp,
}) => {
  const { login } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<DeskValue>("logistics_planner");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = React.useRef<HTMLInputElement>(null);

  // Field-level validity: surfaced on blur/submit via aria-invalid.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const nameValid = fullName.trim().length > 1;
  const passwordValid = password.length >= 8;
  const fieldInvalid = (name: string, ok: boolean, filled: boolean) =>
    (touched[name] && !ok) || (errorMsg != null && filled && !ok);

  const isSignup = mode === "signup";

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setErrorMsg(null);
    if (next === "signup") {
      if (onNavigateToSignUp) {
        onNavigateToSignUp();
        return;
      }
      window.location.hash = "#signup";
    } else {
      window.location.hash = "#login";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const endpoint = isSignup ? "/auth/signup" : "/auth/login";
    const body = isSignup
      ? { full_name: fullName.trim(), email: email.trim(), password, role }
      : { email: email.trim(), password };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(
          data.detail || "Something didn't work. Please check your details and try again.",
        );
      } else {
        login(data.access_token, data.user);
      }
    } catch {
      setErrorMsg("Unable to reach the server right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const c = COPY[mode];

  return (
    <div className="grid min-h-screen lg:grid-cols-[45fr_55fr]">
      <AuthHero mode={mode} onCta={() => (isSignup ? switchMode("signin") : emailRef.current?.focus())} />

      <main className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <AuthMobileBanner mode={mode} />

        <Card className="mx-auto w-full max-w-sm p-6 sm:p-8">
          <h2 className="text-xl font-semibold leading-tight text-forest-ink">{c.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal">{c.intro}</p>

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

          <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <div>
                <label htmlFor="full-name" className={LABEL_CLASS}>
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 size-4 text-slate" aria-hidden="true" />
                  <input
                    id="full-name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    placeholder="Arjun Verma"
                    aria-invalid={fieldInvalid("name", nameValid, fullName.length > 0)}
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
                <Mail className="absolute left-3.5 top-3 size-4 text-slate" aria-hidden="true" />
                <input
                  id="work-email"
                  ref={emailRef}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  placeholder="name@sail.gov.in"
                  aria-invalid={fieldInvalid("email", emailValid, email.length > 0)}
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
                <Lock className="absolute left-3.5 top-3 size-4 text-slate" aria-hidden="true" />
                <input
                  id="account-password"
                  type="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder={isSignup ? "At least 8 characters" : "Your password"}
                  aria-invalid={fieldInvalid("password", passwordValid, password.length > 0)}
                  aria-describedby={errorMsg ? "auth-error" : undefined}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {isSignup && (
              <fieldset>
                <legend className={LABEL_CLASS}>Choose your starting desk</legend>
                <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                  {DESK_OPTIONS.map((desk) => {
                    const selected = role === desk.value;
                    return (
                      <button
                        key={desk.value}
                        type="button"
                        onClick={() => setRole(desk.value)}
                        aria-pressed={selected}
                        className={cx(
                          "flex min-h-[64px] cursor-pointer items-center gap-3 rounded-card border p-3 text-left transition-colors duration-150",
                          selected
                            ? "border-forest-ink bg-linen-mist"
                            : "border-pebble bg-paper hover:border-forest-ink",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cx(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            selected ? "border-forest-ink bg-forest-ink" : "border-pebble bg-paper",
                          )}
                        >
                          {selected && <Check className="size-3 text-paper" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-forest-ink">
                            {desk.title}
                          </span>
                          <span className="block truncate text-xs text-charcoal">{desk.sub}</span>
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate">
                          {desk.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <PrimaryButton
              type="submit"
              disabled={loading || (isSignup && (!nameValid || !emailValid || !passwordValid))}
              className="mt-5 w-full"
            >
              <span>{loading ? "Verifying…" : isSignup ? "Create Account" : "Sign In"}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </PrimaryButton>
          </form>

          <div className="mt-6 border-t border-pebble pt-5 text-center">
            <TextButton onClick={() => switchMode(isSignup ? "signin" : "signup")}>
              {isSignup
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
