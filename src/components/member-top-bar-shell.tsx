"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Les pages sans barre du haut : elles gardent leur propre en-tête. */
function hiddenOn(pathname: string): boolean {
  return pathname.startsWith("/profile") || pathname.startsWith("/members");
}

/** L'enveloppe de la barre du haut : bleue, collée en haut ; absente sur Profile et Members. */
export function MemberTopBarShell({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  // Pas de barre : on garde juste l'espace du haut habituel.
  if (!children || hiddenOn(pathname)) return <div aria-hidden className="h-8 lg:hidden" />;
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-5 flex items-center gap-3 border-b border-white/10 bg-[#141c4a]/95 px-4 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md lg:hidden">
      {children}
    </header>
  );
}
