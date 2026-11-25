"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

/** L'enveloppe de la barre du haut : bleue, collée en haut, sur toutes les pages membres (téléphone et tablette). */
export function MemberTopBarShell({ children }: { children?: ReactNode }) {
  // Pas de barre : on garde juste l'espace du haut habituel.
  if (!children) return <div aria-hidden className="h-8 lg:hidden" />;
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-5 flex items-center gap-3 border-b border-white/10 bg-[#141c4a]/95 px-4 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md lg:hidden">
      {children}
    </header>
  );
}

/** Le bouton « Log out » de la barre bleue (à droite). */
export function TopBarSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      aria-label="Log out"
      title="Log out"
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white/85 ring-1 ring-white/15 transition hover:bg-white/15 hover:text-white active:scale-95 disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
        <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />
      </svg>
      {pending ? "..." : "Logout"}
    </button>
  );
}
