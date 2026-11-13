"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
import { AdminLoginForm } from "../admin/login/admin-login-form";
import { GoogleSignInButton } from "./google-button";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// Le côté blanc de la carte : une "page de livre" à deux faces.
// Recto : connexion membre (Google). Verso : connexion admin.
// Cliquer sur "Admin sign in" tourne la page (rotation 3D).
export function AuthFlip() {
  const searchParams = useSearchParams();
  const [flipped, setFlipped] = useState(searchParams.get("admin") === "1");
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
          <div className="anim-pop relative mx-auto mb-5 w-fit" style={delay(350)}>
            <span aria-hidden className="anim-halo absolute -inset-2.5 rounded-full bg-accent/40 blur-lg" />
            <Image
              src="/logo.png"
              alt="Tomes Club logo"
              width={88}
              height={88}
              preload
              className="relative rounded-full drop-shadow-md"
            />
          </div>

          <div className="anim-rise" style={delay(500)}>
            <h1 className="font-display text-3xl font-bold text-navy">Sign in</h1>
            <span
              aria-hidden
              className="mx-auto mt-2 block h-1 w-12 rounded-full bg-gradient-to-r from-brand to-accent"
            />
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              One click with your Google account, and your class is waiting.
            </p>
          </div>

          <div className="anim-rise mt-7" style={delay(650)}>
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
