"use client";

import { useActionState, useState } from "react";
import { Field, input, LockIcon } from "../../login/email-auth-form";
import { adminSignIn, type AdminSignInState } from "./actions";

const initialState: AdminSignInState = { error: null };

// La connexion admin : les mêmes champs et le même bouton que la connexion des membres.
export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminSignIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-3.5 text-left short:space-y-2.5">
      <Field label="Username" icon={<UserIcon />}>
        <input
          name="username"
          type="text"
          required
          autoComplete="username"
          placeholder="Admin username"
          className={input}
        />
      </Field>

      <Field
        label="Password"
        icon={<LockIcon />}
        right={
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide the password" : "Show the password"}
            className="mr-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-zinc-400 transition hover:bg-zinc-100 hover:text-navy"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        }
      >
        <input
          name="password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          placeholder="Your password"
          className={input}
        />
      </Field>

      {state.error && (
        <p aria-live="polite" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gradient-to-r from-brand to-[#c2185b] px-5 py-3 text-sm short:py-2.5 font-bold text-white shadow-[0_10px_24px_-10px_rgba(156,11,59,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(156,11,59,0.9)] active:translate-y-0 disabled:translate-y-0 disabled:opacity-60"
      >
        {pending ? "Please wait..." : "Sign in as admin"}
      </button>
    </form>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
