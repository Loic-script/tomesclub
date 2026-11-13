"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
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

  // La hauteur suit la face visible, en douceur : la carte s'allonge ou se rétrécit
  // quand on tourne la page ou qu'on passe de "Sign in" à "Create account".
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const face = flipped ? backRef.current : frontRef.current;
    if (!face) return;
    const measure = () => setHeight(face.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(face);
    return () => observer.disconnect();
  }, [flipped]);

  function turnTo(admin: boolean) {
    setFlipped(admin);
    // L'adresse suit, sans recharger la page (pratique pour partager / rafraîchir).
    window.history.replaceState(null, "", admin ? "/admin/login" : "/login");
  }

  return (
    // La perspective donne l'effet "page qui se soulève vers nous".
    <div
      className="w-full max-w-sm transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [perspective:1600px] motion-reduce:transition-none"
      style={height !== null ? { height } : undefined}
    >
      <div
        className={`relative transition-transform duration-700 ease-in-out [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* ----- Recto : les membres ----- */}
        <Face hidden={flipped} faceRef={frontRef}>
          <div className="anim-pop relative mx-auto mb-4 w-fit short:mb-2 tiny:hidden" style={delay(350)}>
            <span aria-hidden className="anim-halo absolute -inset-2 rounded-full bg-accent/40 blur-lg" />
            <Image
              src="/logo.png"
              alt="Tomes Club logo"
              width={64}
              height={64}
              preload
              className="relative rounded-full drop-shadow-md short:size-12"
            />
          </div>

          <div className="anim-rise" style={delay(450)}>
            <h1 className="font-display text-[1.75rem] font-bold leading-tight text-navy short:text-2xl">
              {mode === "register" ? "Join the club" : "Welcome back"}
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500 short:mt-1 tiny:hidden">
              {mode === "register"
                ? "Create your account in a few seconds."
                : "Sign in to join your classes and rooms."}
            </p>
          </div>

          {/* Les deux onglets : se connecter / créer un compte */}
          <div
            role="tablist"
            aria-label="Sign in or create an account"
            className="anim-rise relative mx-auto mt-5 grid grid-cols-2 short:mt-3 rounded-full bg-zinc-100 p-1 text-sm font-semibold"
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

          <div className="anim-rise mt-5 short:mt-3" style={delay(650)}>
            <EmailAuthForm key={mode} mode={mode} />
          </div>

          {/* ou Google */}
          <div className="anim-rise my-4 flex items-center gap-3 short:my-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400" style={delay(750)}>
            <span className="h-px flex-1 bg-zinc-200" />
            or
            <span className="h-px flex-1 bg-zinc-200" />
          </div>
          <div className="anim-rise" style={delay(800)}>
            <GoogleSignInButton />
          </div>

          <p
            className="anim-rise mt-5 border-t border-zinc-100 pt-3 short:mt-3 text-xs text-zinc-400"
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
        <Face hidden={!flipped} back faceRef={backRef}>
          {/* Même en-tête que la face membre : le logo, le titre, une phrase */}
          <div className="relative mx-auto mb-4 w-fit short:mb-2 tiny:hidden">
            <span aria-hidden className="anim-halo absolute -inset-2 rounded-full bg-accent/40 blur-lg" />
            <Image
              src="/logo.png"
              alt="Tomes Club logo"
              width={64}
              height={64}
              className="relative rounded-full drop-shadow-md short:size-12"
            />
          </div>

          <h2 className="font-display text-[1.75rem] font-bold leading-tight text-navy short:text-2xl">Admin sign in</h2>
          <p className="mt-1.5 text-sm text-zinc-500 short:mt-1 tiny:hidden">Reserved for the Tomes Club team.</p>

          {expired && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
              Your admin session expired. Please sign in again.
            </p>
          )}

          <div className="mt-5 short:mt-3">
            <AdminLoginForm />
          </div>

          <p className="mt-5 border-t border-zinc-100 pt-3 short:mt-3 text-xs text-zinc-400">
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
  faceRef,
}: {
  children: ReactNode;
  back?: boolean;
  hidden: boolean;
  faceRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={faceRef}
      aria-hidden={hidden}
      className={`text-center [backface-visibility:hidden] ${hidden ? "absolute inset-x-0 top-0" : "relative"} ${
        back ? "[transform:rotateY(180deg)]" : ""
      } ${hidden ? "pointer-events-none" : ""}`}
    >
      {children}
    </div>
  );
}
