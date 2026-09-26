import React, { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { cx } from "../lib/cn";

/*
 * Password field with a show/hide toggle (web.dev best practice).
 * The toggle is type="button" so it never submits the form, and
 * aria-pressed tells AT the reveal state. All input props forward.
 */
export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  inputClassName?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ inputClassName, className, type: _ignored, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className={cx("relative", className)}>
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cx(
            "w-full rounded-card border border-pebble bg-paper py-2.5 pl-10 pr-11 text-sm",
            "text-charcoal placeholder:text-slate transition-colors duration-150",
            "hover:border-charcoal focus:border-forest-ink focus:outline-none",
            "aria-[invalid=true]:border-alarm-red",
            inputClassName,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-slate transition-colors duration-150 hover:text-charcoal focus-visible:outline-2 focus-visible:outline-forest-ink"
        >
          {visible ? (
            <EyeSlash className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
