"use client";

import type { ReactNode } from "react";

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
