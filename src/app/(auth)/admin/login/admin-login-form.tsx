"use client";

import { useActionState } from "react";
import { adminSignIn, type AdminSignInState } from "./actions";

const initialState: AdminSignInState = { error: null };

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminSignIn, initialState);

  // Champ "creusé" en relief doux, avec l'étiquette à l'intérieur (placeholder).
  const field =
    "w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm text-ink placeholder:text-zinc-400 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06),inset_-2px_-2px_6px_#ffffff] outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/20";

  return (
    <form action={formAction} className="space-y-3.5">
      <label className="relative block">
        <span className="sr-only">Admin user</span>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          <UserIcon />
        </span>
        <input
          name="username"
          type="text"
          required
          autoComplete="username"
          placeholder="Admin user"
          className={field}
        />
      </label>

      <label className="relative block">
        <span className="sr-only">Password</span>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          <KeyIcon />
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          className={field}
        />
      </label>

      <p aria-live="polite" className="min-h-5 text-sm text-danger">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-navy px-5 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Please wait..." : "Sign in as admin"}
      </button>
    </form>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  className: "size-4",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function UserIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="8" cy="14" r="4" />
      <path d="M11 11 20 2M16 6l3 3" />
    </svg>
  );
}
