"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
import { AdminLoginForm } from "../admin/login/admin-login-form";
import { EmailAuthForm } from "./email-auth-form";
import { GoogleSignInButton } from "./google-button";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// Le côté blanc de la carte : une "page de livre" à deux faces.
// Recto : connexion membre (Google). Verso : connexion admin.
// Cliquer sur "Admin sign in" tourne la page (rotation 3D).
export function AuthFlip() {
  const searchParams = useSearchParams();
  const [flipped, setFlipped] = useState(searchParams.get("admin") === "1");
  // Membre : se connecter, ou créer un compte
  const [mode, setMode] = useState<"signin" | "register">(
    searchParams.get("mode") === "register" ? "register" : "signin",
  );
  // Arrivé ici parce que la session admin n'était plus valide ?
  const expired = searchParams.get("expired") === "1";

  function turnTo(admin: boolean) {
    setFlipped(admin);
    // L'adresse suit, sans recharger la page (pratique pour partager / rafraîchir).
    window.history.replaceState(null, "", admin ? "/admin/login" : "/login");
  }

  return (
    // La perspective donne l'effet "page qui se soulève vers nous".
    <div className="w-full max-w-sm [perspective:1600px]">
      <div
        className={`grid transition-transform duration-700 ease-in-out [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* ----- Recto : les membres ----- */}
        <Face hidden={flipped}>
          <div className="anim-pop relative mx-auto mb-4 w-fit" style={delay(350)}>
            <span aria-hidden className="anim-halo absolute -inset-2 rounded-full bg-accent/40 blur-lg" />
            <Image
              src="/logo.png"
              alt="Tomes Club logo"
              width={64}
              height={64}
              preload
              className="relative rounded-full drop-shadow-md"
            />
          </div>

          <div className="anim-rise" style={delay(450)}>
            <h1 className="font-display text-[1.75rem] font-bold leading-tight text-navy">
              {mode === "register" ? "Join the club" : "Welcome back"}
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              {mode === "register"
                ? "Create your account in a few seconds."
                : "Sign in to join your classes and rooms."}
            </p>
          </div>

          {/* Les deux onglets : se connecter / créer un compte */}
          <div
            role="tablist"
            aria-label="Sign in or create an account"
            className="anim-rise relative mx-auto mt-5 grid grid-cols-2 rounded-full bg-zinc-100 p-1 text-sm font-semibold"
            style={delay(550)}
          >
            <span
              aria-hidden
              className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-300 ${
                mode === "register" ? "translate-x-full" : ""
              }`}
            />
            {(
              [
                { value: "signin", label: "Sign in" },
                { value: "register", label: "Create account" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={mode === tab.value}
                onClick={() => setMode(tab.value)}
                className={`relative z-10 rounded-full px-3 py-2 transition ${
                  mode === tab.value ? "text-navy" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="anim-rise mt-5" style={delay(650)}>
            <EmailAuthForm key={mode} mode={mode} />
          </div>

          {/* ou Google */}
          <div className="anim-rise my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400" style={delay(750)}>
            <span className="h-px flex-1 bg-zinc-200" />
            or
            <span className="h-px flex-1 bg-zinc-200" />
          </div>
          <div className="anim-rise" style={delay(800)}>
            <GoogleSignInButton />
          </div>

          <p
            className="anim-rise mt-6 border-t border-zinc-100 pt-4 text-xs text-zinc-400"
            style={delay(950)}
          >
            Club staff?{" "}
            <button
              type="button"
              onClick={() => turnTo(true)}
              className="font-medium text-navy transition hover:text-brand hover:underline"
            >
              Admin sign in →
            </button>
          </p>
        </Face>

        {/* ----- Verso : l'admin ----- */}
        <Face hidden={!flipped} back>
          <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-navy/5 text-navy ring-1 ring-navy/15">
            <UserKeyIcon />
          </span>

          <h2 className="font-display text-3xl font-bold text-navy">Admin</h2>
          <span
            aria-hidden
            className="mx-auto mt-2 block h-1 w-12 rounded-full bg-gradient-to-r from-navy to-brand"
          />
          <p className="mt-3 text-sm text-zinc-600">Reserved for the Tomes Club team.</p>

          {expired && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
              Your admin session expired. Please sign in again.
            </p>
          )}

          <div className="mb-6" />

          <AdminLoginForm />

          <p className="mt-6 border-t border-zinc-100 pt-4 text-xs text-zinc-400">
            Not the admin?{" "}
            <button
              type="button"
              onClick={() => turnTo(false)}
              className="font-medium text-brand transition hover:underline"
            >
              ← Member sign in
            </button>
          </p>
        </Face>
      </div>
    </div>
  );
}

/** Une face de la page : cachée quand elle tourne le dos à l'écran. */
function Face({
  children,
  back = false,
  hidden,
}: {
  children: ReactNode;
  back?: boolean;
  hidden: boolean;
}) {
  return (
    <div
      aria-hidden={hidden}
      className={`text-center [backface-visibility:hidden] [grid-area:1/1] ${
        back ? "[transform:rotateY(180deg)]" : ""
      } ${hidden ? "pointer-events-none" : ""}`}
    >
      {children}
    </div>
  );
}

/** Personne + clé (l'accès admin), de la même couleur que le titre Admin. */
function UserKeyIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="size-9"
      fill="none"
      stroke="currentColor"
      strokeWidth="4.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* La personne */}
      <circle cx="19" cy="12.5" r="7.3" />
      <path d="M29 26.5a14.5 14.5 0 0 0-21.5 9V42h13" />
      {/* La clé */}
      <circle cx="30" cy="37" r="5.2" />
      <path d="M34.2 32.8 43.5 23.5M39.5 27.5l3.4 3.4M43.5 23.5l3 3" />
    </svg>
  );
}
