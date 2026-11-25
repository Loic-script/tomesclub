"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Les pages sans barre du haut : elles gardent leur propre en-tête. */
function hiddenOn(pathname: string): boolean {
  return pathname.startsWith("/profile") || pathname.startsWith("/members");
}

/** L'enveloppe de la barre du haut : collée en haut, en verre ; absente sur Profile et Members. */
export function MemberTopBarShell({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  // Pas de barre : on garde juste l'espace du haut habituel.
  if (!children || hiddenOn(pathname)) return <div aria-hidden className="h-8 lg:hidden" />;
  return (
    <header className="nav-glass sticky top-0 z-30 -mx-4 mb-5 flex items-center gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
      {children}
    </header>
  );
}
