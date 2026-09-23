import React, { useState } from "react";
import { User, Mail, Lock, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { registerUser } from "../api/auth";
import { PrimaryButton, Card } from "../components/ui";
import { AstitvaLogo } from "../components/AstitvaLogo";
import type { RegisterPayload } from "../types";

export interface SignUpPageProps {
  onSwitchToLogin?: () => void;
}

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

  const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-forest-ink";

  return (
    <div className="flex min-h-screen items-center justify-center bg-fog p-4 md:p-8">
      <Card tone="paper" className="w-full max-w-lg border border-pebble p-6 md:p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <AstitvaLogo size={42} variant="mark-only" className="mb-3" />
          <h1 className="text-2xl font-bold tracking-tight text-forest-ink">Create SAIL Freight Account</h1>
          <p className="mt-1 text-sm text-slate">
            Register your credentials to access the intelligent chartering terminal
          </p>
        </div>

        {successMsg ? (
          <div className="rounded-card border border-emerald-300 bg-emerald-50 p-5 text-center">
            <CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-600" />
            <h2 className="text-base font-semibold text-emerald-950">Registration Submitted</h2>
            <p className="mt-1 text-sm text-emerald-800 leading-relaxed">{successMsg}</p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => onSwitchToLogin ? onSwitchToLogin() : (window.location.hash = "")}
                className="inline-flex items-center gap-2 rounded-full bg-forest-ink px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-forest-ink/90 cursor-pointer"
              >
                Return to Login
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-card border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

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

            {/* Email or Employee ID */}
            <div>
              <label htmlFor="signup-email" className={LABEL_CLASS}>
                Employee ID or Work Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate" aria-hidden="true" />
                <input
                  id="signup-email"
                  type="text"
                  required
                  placeholder="name@sail.gov.in or EMP10492"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* Role Dropdown */}
            <div>
              <label htmlFor="signup-role" className={LABEL_CLASS}>
                Assigned Operational Role
              </label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate" aria-hidden="true" />
                <select
                  id="signup-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "logistics_planner" | "plant_manager" | "admin")}
                  className={`${INPUT_CLASS} cursor-pointer appearance-none bg-paper`}
                >
                  <option value="logistics_planner">Freight & Chartering Officer (Planner)</option>
                  <option value="plant_manager">Plant Logistics Manager (Approver)</option>
                  <option value="admin">System Administrator (Govt Oversight)</option>
                </select>
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
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  Passwords do not match.
                </p>
              )}
            </div>

            <div className="pt-2">
              <PrimaryButton
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Create Account"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </PrimaryButton>
            </div>

            <div className="pt-3 text-center text-sm text-slate">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => onSwitchToLogin ? onSwitchToLogin() : (window.location.hash = "")}
                className="font-semibold text-forest-ink hover:underline cursor-pointer"
              >
                Login
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default SignUpPage;
