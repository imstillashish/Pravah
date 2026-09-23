import React from "react";
import { AuthPage } from "./AuthPage";

/**
 * SignUpPage — thin compatibility shell. The auth surface lives in
 * AuthPage (signin/signup are modes of one component); this keeps the
 * `#signup` hash route and any external references working without a
 * second, diverging signup implementation.
 */
export interface SignUpPageProps {
  /** Accepted for call-site compatibility; mode switching is hash-driven inside AuthPage. */
  onSwitchToLogin?: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = () => {
  return <AuthPage initialMode="signup" />;
};

export default SignUpPage;
