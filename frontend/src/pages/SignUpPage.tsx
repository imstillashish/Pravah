import React, { useState } from "react";
import {
  EnvelopeSimple,
  User,
  ArrowRight,
  CheckCircle,
  WarningCircle,
  IdentificationBadge,
  ShieldCheck,
  Buildings,
  NavigationArrow,
  Info,
} from "@phosphor-icons/react";
import { registerUser } from "../api/auth";
import { PrimaryButton, Card, TextButton } from "../components/ui";
import { PasswordInput } from "../components/PasswordInput";
import { AstitvaLogo } from "../components/AstitvaLogo";
import { SignUpCoordinatorIllustration } from "../assets/illustrations/AuthIllustrations";
import type { RegisterPayload } from "../types";

/*
 * SignUpPage — registration surface (admin-approval flow).
 *
 * De-slop pass (2026-09-24): flat Forest Ink hero (no gradient, texture,
 * glow, or glass), token-only colors, sentence-case labels, inline field
 * errors tied via aria-describedby, and the "Organizational Role"
 * selector removed — the backend register schema has no role field, so
 * the control was dead UI pretending to do something.
 */
const INPUT_CLASS =
  "w-full rounded-card border border-pebble bg-paper py-2.5 pl-10 pr-3.5 text-sm " +
  "text-charcoal placeholder:text-slate transition-colors duration-150 " +
  "hover:border-charcoal focus:border-forest-ink focus:outline-none";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-charcoal";

const FIELD_ERROR_CLASS = "mt-1.5 text-xs text-alarm-red";

export interface SignUpPageProps {
  onSwitchToLogin?: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchToLogin }) => {
  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Validation rules
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passwordLengthValid = password.length >= 8;
  const employeeIdValid = /^SAIL-[0-9]{4,6}$/.test(employeeId.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isFormValid =
    fullName.trim() !== "" && employeeIdValid && emailValid && passwordLengthValid && passwordsMatch;

  // web.dev: a disabled submit must explain what's missing, or users
  // retry-tap it thinking it's broken.
  const missingRequirements: string[] = [];
  if (fullName.trim() === "") missingRequirements.push("your full name");
  if (!employeeIdValid) missingRequirements.push("an employee ID like SAIL-12345");
  if (!emailValid) missingRequirements.push("a valid work email");
  if (!passwordLengthValid) missingRequirements.push("a password of 8+ characters");
  if (password.length > 0 && confirmPassword.length > 0 && !passwordsMatch)
    missingRequirements.push("matching passwords");
  const requirementText =
    missingRequirements.length > 0
      ? `To continue, add ${missingRequirements.slice(0, 2).join(" and ")}${missingRequirements.length > 2 ? "…" : ""}.`
      : null;

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
        employee_id: employeeId.trim(),
      };

      const res = await registerUser(payload);
      setSuccessMsg(
        res.message ||
          "Account created. A port admin must activate it before you can sign in."
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          const msg =
            typeof parsed.detail === "string"
              ? parsed.detail
              : Array.isArray(parsed.detail) && parsed.detail[0]?.msg
              ? parsed.detail[0].msg
              : err.message;
          setErrorMsg(msg || "Couldn't create your account. Please check your details.");
        } catch {
          setErrorMsg(err.message || "Couldn't create your account. Please check your details.");
        }
      } else {
        setErrorMsg("Couldn't create your account. Please check your details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const errorBanner = errorMsg && (
    <div
      role="alert"
      className="mt-5 flex items-start gap-3 rounded-card border border-pebble bg-fog p-4"
    >
      <WarningCircle className="mt-0.5 size-5 shrink-0 text-alarm-red" aria-hidden="true" />
      <div className="flex-1 text-sm font-semibold text-alarm-red">{errorMsg}</div>
    </div>
  );

  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-[48fr_52fr]">
      {/*
        Hero panel: one flat Forest Ink surface, same treatment as the
        login hero — the gradient, texture grid, and glass card were
        removed as documented AI-slop tells.
      */}
      <aside className="relative m-3 hidden flex-col justify-between overflow-hidden rounded-2xl bg-forest-ink p-10 text-paper lg:flex xl:p-12">
        {/* Brand identity header */}
        <div className="relative z-10 flex items-center justify-between">
          <AstitvaLogo size={32} variant="inverse" subtitle={true} />
        </div>

        {/* Center: headline + sub + illustration, direct on navy */}
        <div className="relative z-10 my-auto">
          <h1 className="max-w-[14ch] text-[2.5rem] font-bold leading-[1.05] tracking-tight text-paper xl:text-[2.75rem]">
            Unified chartering for Indian steel.
          </h1>
          <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-paper/75">
            Coordinate coking coal shipments across Paradip, Vizag, Gopalpur, and Haldia.
          </p>

          {/* Approval note — the one thing new users must know */}
          <div className="mt-5 flex max-w-[46ch] items-start gap-2.5 rounded-card border border-white/15 bg-white/5 p-3.5">
            <Info className="mt-0.5 size-4 shrink-0 text-lime-voltage" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-paper/85">
              New accounts are reviewed by a port admin before access is granted.
            </p>
          </div>

          {/* Transhumans "chillin" character */}
          <SignUpCoordinatorIllustration size={300} className="mt-8 select-none" />
        </div>

        {/* Desk highlights — facts the product can back up */}
        <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lime-voltage">
              <Buildings className="size-4" aria-hidden="true" />
            </div>
            <div className="text-left leading-tight">
              <div className="font-mono text-xs font-semibold text-paper">5 Plants</div>
              <div className="text-[11px] text-paper/70">Demand aggregation</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lime-voltage">
              <NavigationArrow className="size-4" aria-hidden="true" />
            </div>
            <div className="text-left leading-tight">
              <div className="font-mono text-xs font-semibold text-paper">Paradip · Vizag</div>
              <div className="text-[11px] text-paper/70">+ Gopalpur &amp; Haldia</div>
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
      <main className="flex flex-col justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
        {/* Mobile banner — flat navy, no badge */}
        <div className="mb-6 rounded-2xl bg-forest-ink p-6 text-paper lg:hidden">
          <div className="mb-3">
            <AstitvaLogo size={26} variant="inverse" subtitle={false} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-paper">
            Create your operations account.
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-paper/75">
            New accounts are reviewed by a port admin before access is granted.
          </p>
        </div>

        <div className="mx-auto w-full max-w-lg">
          <Card className="border border-pebble/80 bg-paper p-6 shadow-lg sm:p-8">
            <h2 className="mb-1 text-2xl font-bold tracking-tight text-forest-ink">
              Create your operations account
            </h2>
            <p className="text-sm leading-relaxed text-charcoal">
              Register for access to the freight forecasting console. A port admin
              activates new accounts.
            </p>

            {errorBanner}

            {successMsg ? (
              <div className="mt-6 rounded-card border border-pebble bg-emerald-wash p-6 text-center">
                <CheckCircle className="mx-auto mb-2.5 size-12 text-emerald-profit" aria-hidden="true" />
                <h3 className="text-lg font-bold text-obsidian">Registration submitted</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal">{successMsg}</p>
                <div className="mt-6">
                  <PrimaryButton
                    type="button"
                    onClick={() =>
                      onSwitchToLogin ? onSwitchToLogin() : (window.location.hash = "#login")
                    }
                    className="w-full justify-center py-2.5"
                  >
                    Return to sign in
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                {/* Identity row: full name + employee ID */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="signup-name" className={LABEL_CLASS}>
                      Full name
                    </label>
                    <div className="relative">
                      <User
                        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate"
                        aria-hidden="true"
                      />
                      <input
                        id="signup-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="employee-id" className={LABEL_CLASS}>
                      Employee ID
                    </label>
                    <div className="relative">
                      <IdentificationBadge
                        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate"
                        aria-hidden="true"
                      />
                      <input
                        id="employee-id"
                        name="employee-id"
                        type="text"
                        inputMode="text"
                        required
                        placeholder="SAIL-12345"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        aria-invalid={employeeId.length > 0 && !employeeIdValid}
                        aria-describedby={
                          employeeId.length > 0 && !employeeIdValid ? "employee-id-error" : undefined
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    {employeeId.length > 0 && !employeeIdValid && (
                      <p id="employee-id-error" className={FIELD_ERROR_CLASS}>
                        Employee IDs look like SAIL-12345.
                      </p>
                    )}
                  </div>
                </div>

                {/* Work email */}
                <div>
                  <label htmlFor="signup-email" className={LABEL_CLASS}>
                    Work email
                  </label>
                  <div className="relative">
                    <EnvelopeSimple
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate"
                      aria-hidden="true"
                    />
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@sail.gov.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={email.length > 0 && !emailValid}
                      aria-describedby={
                        email.length > 0 && !emailValid ? "signup-email-error" : undefined
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  {email.length > 0 && !emailValid && (
                    <p id="signup-email-error" className={FIELD_ERROR_CLASS}>
                      That doesn&apos;t look like a complete email address.
                    </p>
                  )}
                </div>

                {/* Password fields — confirmed because the backend contract
                    requires confirm_password. */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="signup-password" className={LABEL_CLASS}>
                        Password
                      </label>
                      <span className="text-[11px] text-slate">8+ characters</span>
                    </div>
                    <PasswordInput
                      id="signup-password"
                      name="new-password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={password.length > 0 && !passwordLengthValid}
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-confirm-password" className={LABEL_CLASS}>
                      Confirm password
                    </label>
                    <PasswordInput
                      id="signup-confirm-password"
                      name="confirm-password"
                      autoComplete="new-password"
                      required
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                      aria-describedby={
                        confirmPassword.length > 0 && !passwordsMatch
                          ? "signup-match-error"
                          : undefined
                      }
                    />
                  </div>
                </div>

                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p id="signup-match-error" className={FIELD_ERROR_CLASS}>
                    Passwords don&apos;t match yet.
                  </p>
                )}

                {/* Disabled until valid — the form is long, so the gated
                    submit is correct here; the helper explains what's
                    missing so the disabled state is never a dead end. */}
                <PrimaryButton
                  type="submit"
                  disabled={!isFormValid || loading}
                  aria-describedby={requirementText ? "signup-requirements" : undefined}
                  className="mt-3 w-full justify-center py-3 text-sm font-semibold"
                >
                  <span>{loading ? "Creating account…" : "Create account"}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </PrimaryButton>
                <p id="signup-requirements" aria-live="polite" className="min-h-4 text-center text-xs text-slate">
                  {requirementText ?? ""}
                </p>
              </form>
            )}

            <div className="mt-5 border-t border-pebble pt-4 text-center">
              <span className="text-xs text-slate">Already have an active account? </span>
              <TextButton
                onClick={() =>
                  onSwitchToLogin ? onSwitchToLogin() : (window.location.hash = "#login")
                }
              >
                Sign in here
              </TextButton>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};
