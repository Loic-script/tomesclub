"use client";

import { useActionState } from "react";
import { adminSignIn, type AdminSignInState } from "./actions";

const initialState: AdminSignInState = { error: null };

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminSignIn, initialState);

  return (
    <form action={formAction} className="anim-rise space-y-4" style={{ "--d": "250ms" } as React.CSSProperties}>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Admin user</span>
        <input
          name="username"
          type="text"
          required
          autoComplete="username"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </label>

      <p aria-live="polite" className="min-h-5 text-sm text-red-600">
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
