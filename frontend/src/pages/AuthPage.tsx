import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api";
import {
  EnvelopeSimple,
  WarningCircle,
  ArrowRight,
  ArrowLeft,
  Anchor,
  ChartLineUp,
  ShieldCheck,
} from "@phosphor-icons/react";
import { PrimaryButton, Card, TextButton } from "../components/ui";
import { PasswordInput } from "../components/PasswordInput";
import { AstitvaLogo } from "../components/AstitvaLogo";
import { LoginAnalystIllustration } from "../assets/illustrations/AuthIllustrations";
import { cx } from "../lib/cn";

/*
 * AuthPage — login surface with in-card password reset (spec §5.1/§5.3).
 * Split layout: Oceanic Navy hero panel with form card on Paper.
 * The dead isRegister branch lives in SignUpPage; this page is login only.
 *
 * De-slop pass (2026-09-24): one flat Forest Ink hero — no gradient,
 * no glow blob, no glass card, no pulsing "live" dot, no fake version
 * badge. Hero states only facts the product actually does. Every color
 * resolves to an index.css token; Tailwind palette classes are banned.
 * Form mechanics follow web.dev sign-in best practices.
 */
const INPUT_CLASS =
  "w-full rounded-card border border-pebble bg-paper py-2.5 pl-10 pr-3.5 text-sm " +
  "text-charcoal placeholder:text-slate transition-colors duration-150 " +
  "hover:border-charcoal focus:border-forest-ink focus:outline-none";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-charcoal";

export interface AuthPageProps {
  onNavigateToSignUp?: () => void;
}

type ResetStep = 1 | 2 | 3;

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigateToSignUp }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = React.useRef<HTMLInputElement>(null);

  // Reset flow state (spec §5.3)
  const [resetStep, setResetStep] = useState<ResetStep | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const resetHeadingRef = React.useRef<HTMLHeadingElement>(null);
  const errorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (resetStep !== null && resetHeadingRef.current) {
      resetHeadingRef.current.focus();
    }
  }, [resetStep]);

  // Failed submits move focus to the error alert so screen readers and
  // keyboard users land on the message instead of falling back to <body>.
  React.useEffect(() => {
    if (errorMsg && errorRef.current) {
      errorRef.current.focus();
    }
  }, [errorMsg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data.detail === "string"
            ? data.detail
            : Array.isArray(data.detail) && data.detail[0]?.msg
            ? data.detail[0].msg
            : "Invalid credentials. Please verify your email/employee ID and password.";
        setErrorMsg(msg);
      } else {
        if (remember) localStorage.setItem("auth_remember", "1");
        login(data.access_token, data.user ?? data);
      }
    } catch {
      setErrorMsg("Unable to reach the server right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const openResetFlow = () => {
    setErrorMsg(null);
    setResetEmail(email);
    setResetCode("");
    setResetPassword("");
    setResetConfirm("");
    setResetDone(false);
    setResetStep(1);
  };

  const sendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data.detail === "string"
            ? data.detail
            : Array.isArray(data.detail) && data.detail[0]?.msg
            ? data.detail[0].msg
            : "Couldn't issue a reset code. Please try again.";
        setErrorMsg(msg);
      } else {
        setResetCode(data.reset_code);
        setResetStep(2);
      }
    } catch {
      setErrorMsg("Unable to reach the server right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassword !== resetConfirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          code: resetCode.trim(),
          new_password: resetPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data.detail === "string"
            ? data.detail
            : Array.isArray(data.detail) && data.detail[0]?.msg
            ? data.detail[0].msg
            : "That code didn't work or expired. Request a new one.";
        setErrorMsg(msg);
      } else {
        setResetDone(true);
        setResetStep(3);
      }
    } catch {
      setErrorMsg("Unable to reach the server right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const errorBanner = errorMsg && (
    <div
      id="auth-error"
      ref={errorRef}
      tabIndex={-1}
      role="alert"
      className="mt-5 flex items-start gap-3 rounded-card border border-pebble bg-fog p-4 outline-none"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-alarm-red/40 font-mono text-xs font-semibold text-alarm-red"
      >
        !
      </span>
      <div className="flex-1 text-sm font-semibold text-alarm-red">{errorMsg}</div>
      <WarningCircle className="mt-0.5 size-5 shrink-0 text-alarm-red" aria-hidden="true" />
    </div>
  );

  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-[48fr_52fr]">
      {/*
        Hero panel: one flat Forest Ink surface. The gradient, texture
        grid, glow blob, and glass narrative card were removed — they are
        documented AI-slop tells and DESIGN.md is flat by design.
      */}
      <aside className="relative m-3 hidden flex-col justify-between overflow-hidden rounded-2xl bg-forest-ink p-10 text-paper lg:flex xl:p-12">
        {/* Brand identity header */}
        <div className="relative z-10 flex items-center justify-between">
          <AstitvaLogo size={32} variant="inverse" subtitle={true} />
        </div>

        {/* Center: headline + sub + illustration, direct on navy */}
        <div className="relative z-10 my-auto">
          <h1 className="max-w-[14ch] text-[2.5rem] font-bold leading-[1.05] tracking-tight text-paper xl:text-[2.75rem]">
            Know your rate before you book.
          </h1>
          <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-paper/75">
            Live demurrage prediction and parcel allocation for SAIL&apos;s East
            Coast bulk terminals.
          </p>

          {/* Transhumans "reflecting" character */}
          <LoginAnalystIllustration size={300} className="mt-8 select-none" />
        </div>

        {/* Proof points — facts the product can back up */}
        <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lime-voltage">
              <ChartLineUp className="size-4" aria-hidden="true" />
            </div>
            <div className="text-left leading-tight">
              <div className="font-mono text-xs font-semibold text-paper">LightGBM Q10–90</div>
              <div className="text-[11px] text-paper/70">Demurrage forecast</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lime-voltage">
              <Anchor className="size-4" aria-hidden="true" />
            </div>
            <div className="text-left leading-tight">
              <div className="font-mono text-xs font-semibold text-paper">4 Terminals</div>
              <div className="text-[11px] text-paper/70">East Coast ports</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lime-voltage">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </div>
            <div className="text-left leading-tight">
              <div className="font-mono text-xs font-semibold text-paper">Admin approved</div>
              <div className="text-[11px] text-paper/70">Reviewed before access</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Form side — Paper canvas */}
      <main className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
        {/* Mobile banner — flat navy, no badge */}
        <div className="mb-6 rounded-2xl bg-forest-ink p-6 text-paper lg:hidden">
          <div className="mb-3">
            <AstitvaLogo size={26} variant="inverse" subtitle={false} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-paper">
            Know your rate before you book.
          </h1>
        </div>

        <div className="mx-auto w-full max-w-md">
          <Card className="border border-pebble/80 bg-paper p-7 shadow-lg sm:p-9">
            {resetStep === null ? (
              <>
                <h2 className="mb-1 text-2xl font-bold tracking-tight text-forest-ink">
                  Sign in
                </h2>
                <p className="text-sm leading-relaxed text-charcoal">
                  Access your bulk chartering desk, demurrage forecasts, and terminal logs.
                </p>

                {errorBanner}

                <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                  <div>
                    <label htmlFor="work-email" className={LABEL_CLASS}>
                      Email or employee ID
                    </label>
                    <div className="relative">
                      <EnvelopeSimple
                        className="absolute left-3.5 top-3 size-4 text-slate"
                        aria-hidden="true"
                      />
                      <input
                        id="work-email"
                        ref={emailRef}
                        name="username"
                        type="text"
                        required
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@sail.gov.in or SAIL-12345"
                        aria-invalid={!!errorMsg}
                        aria-describedby={errorMsg ? "auth-error" : undefined}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="auth-password" className={LABEL_CLASS}>
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={openResetFlow}
                        className="text-xs font-semibold text-spruce underline-offset-2 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <PasswordInput
                      id="auth-password"
                      name="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      aria-invalid={!!errorMsg}
                      aria-describedby={errorMsg ? "auth-error" : undefined}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="remember-session"
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="size-4 rounded border-pebble text-forest-ink accent-forest-ink focus:ring-forest-ink"
                    />
                    <label htmlFor="remember-session" className="text-xs font-normal text-charcoal">
                      Keep me signed in for 30 days
                    </label>
                  </div>

                  {/* Never disabled awaiting input (web.dev); disabled only while submitting. */}
                  <PrimaryButton
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full justify-center py-3 text-sm font-semibold"
                  >
                    <span>{loading ? "Verifying…" : "Sign in"}</span>
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </PrimaryButton>
                </form>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setResetStep(null);
                    setErrorMsg(null);
                  }}
                  className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-spruce underline-offset-2 hover:underline"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                  Back to sign in
                </button>
                <h2
                  ref={resetHeadingRef}
                  tabIndex={-1}
                  className="text-xl font-bold leading-tight text-forest-ink outline-none"
                >
                  {resetDone ? "Password updated" : "Reset your password"}
                </h2>

                {resetDone ? (
                  <div className="mt-5 rounded-card border border-pebble bg-emerald-wash p-5 text-center">
                    <p className="text-sm leading-relaxed text-charcoal">
                      Password updated. Sign in with your new password.
                    </p>
                    <PrimaryButton className="mt-4 w-full justify-center" onClick={() => setResetStep(null)}>
                      Return to sign in
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                ) : resetStep === 1 ? (
                  <>
                    <p className="mt-1.5 text-xs leading-relaxed text-charcoal">
                      Enter your work email and we&apos;ll issue a 6-digit reset code.
                    </p>
                    {errorBanner}
                    <form className="mt-5 space-y-4" onSubmit={sendResetCode} noValidate>
                      <div>
                        <label htmlFor="reset-email" className={LABEL_CLASS}>
                          Work email address
                        </label>
                        <div className="relative">
                          <EnvelopeSimple
                            className="absolute left-3.5 top-3 size-4 text-slate"
                            aria-hidden="true"
                          />
                          <input
                            id="reset-email"
                            type="email"
                            required
                            autoComplete="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="name@sail.gov.in"
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                      <PrimaryButton type="submit" disabled={loading} className="w-full justify-center">
                        <span>{loading ? "Sending…" : "Send reset code"}</span>
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </PrimaryButton>
                    </form>
                  </>
                ) : resetStep === 2 ? (
                  <>
                    <div className="mt-4 rounded-card border border-pebble bg-fog p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-charcoal">
                        Your reset code (valid 15 minutes)
                      </p>
                      <p
                        id="displayed-reset-code"
                        className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-[0.3em] text-forest-ink"
                      >
                        {resetCode}
                      </p>
                    </div>
                    {errorBanner}
                    <form className="mt-5 space-y-4" onSubmit={submitNewPassword} noValidate>
                      <div>
                        <label htmlFor="reset-code" className={LABEL_CLASS}>
                          Enter the code
                        </label>
                        <input
                          id="reset-code"
                          name="one-time-code"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          required
                          aria-describedby="displayed-reset-code"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                          className={cx(INPUT_CLASS, "font-mono tracking-[0.3em]")}
                        />
                      </div>
                      <div>
                        <label htmlFor="reset-new-password" className={LABEL_CLASS}>
                          New password
                        </label>
                        <PasswordInput
                          id="reset-new-password"
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          placeholder="At least 8 characters"
                        />
                      </div>
                      <div>
                        <label htmlFor="reset-confirm-password" className={LABEL_CLASS}>
                          Confirm new password
                        </label>
                        <PasswordInput
                          id="reset-confirm-password"
                          required
                          autoComplete="new-password"
                          value={resetConfirm}
                          onChange={(e) => setResetConfirm(e.target.value)}
                          placeholder="Re-enter your password"
                        />
                      </div>
                      <PrimaryButton type="submit" disabled={loading} className="w-full justify-center">
                        <span>{loading ? "Resetting…" : "Reset password"}</span>
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </PrimaryButton>
                    </form>
                  </>
                ) : null}
              </>
            )}

            <div className="mt-6 border-t border-pebble pt-5 text-center">
              <TextButton
                onClick={() =>
                  onNavigateToSignUp
                    ? onNavigateToSignUp()
                    : (window.location.hash = "#signup")
                }
              >
                Don&apos;t have an account yet? Register here
              </TextButton>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};
