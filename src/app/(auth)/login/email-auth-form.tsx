"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

// Connexion ou inscription avec un email et un mot de passe.
// Après : "/" envoie vers le formulaire d'accueil (nouveau compte) ou vers l'accueil.

const MIN_PASSWORD = 8;

/** Les messages de Better Auth, en phrases simples. */
function friendlyError(code: string | undefined, message: string | undefined): string {
  if (code === "INVALID_EMAIL_OR_PASSWORD") return "Wrong email or password.";
  if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
    return "An account already exists with this email. Sign in instead (or use Google).";
  }
  if (code === "PASSWORD_TOO_SHORT") return `The password needs at least ${MIN_PASSWORD} characters.`;
  if (code === "INVALID_EMAIL") return "This email address is not valid.";
  return message || "Something went wrong. Please try again.";
}

export function EmailAuthForm({ mode }: { mode: "signin" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (register && password.length < MIN_PASSWORD) {
      return setError(`The password needs at least ${MIN_PASSWORD} characters.`);
    }
    if (register && password !== confirm) return setError("The two passwords are not the same.");
    setPending(true);
    const result = register
      ? // Le nom est demandé juste après, dans le formulaire d'accueil : en attendant, le début de l'email.
        await authClient.signUp.email({ name: email.trim().split("@")[0] || "Member", email: email.trim(), password })
      : await authClient.signIn.email({ email: email.trim(), password });
    if (result.error) {
      setPending(false);
      setError(friendlyError(result.error.code, result.error.message));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3.5 text-left" noValidate>
      <Field label="Email" icon={<MailIcon />}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          placeholder="you@example.com"
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
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={register ? "new-password" : "current-password"}
          required
          minLength={register ? MIN_PASSWORD : undefined}
          placeholder={register ? `At least ${MIN_PASSWORD} characters` : "Your password"}
          className={input}
        />
      </Field>

      {register && (
        <Field
          label="Confirm password"
          icon={<LockIcon />}
          right={
            confirm && (
              <span
                aria-label={confirm === password ? "The passwords match" : "The passwords are different"}
                className={`mr-1 text-sm font-bold ${confirm === password ? "text-emerald-500" : "text-red-400"}`}
              >
                {confirm === password ? "✓" : "✕"}
              </span>
            )
          }
        >
          <input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            required
            placeholder="Write the password again"
            className={input}
          />
        </Field>
      )}

      {error && (
        <p aria-live="polite" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !email.trim() || !password || (register && !confirm)}
        className="w-full rounded-full bg-gradient-to-r from-brand to-[#c2185b] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(156,11,59,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(156,11,59,0.9)] active:translate-y-0 disabled:translate-y-0 disabled:opacity-60"
      >
        {pending ? "Please wait..." : register ? "Create my account" : "Sign in"}
      </button>
    </form>
  );
}

export const input =
  "min-w-0 flex-1 bg-transparent py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 autofill:shadow-[inset_0_0_0_1000px_#fff] autofill:[-webkit-text-fill-color:#18181b]";

/** Un champ : l'étiquette, l'icône à gauche, et un bouton à droite (facultatif). */
export function Field({
  label,
  icon,
  right,
  children,
}: {
  label: string;
  icon: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-zinc-600">{label}</span>
      <span className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 shadow-sm transition focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10">
        <span className="shrink-0 text-zinc-400">{icon}</span>
        {children}
        {right}
      </span>
    </label>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  className: "size-[18px]",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg {...iconProps}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
