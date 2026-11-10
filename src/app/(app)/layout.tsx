import type { ReactNode } from "react";
import { AppSidebar, MobileNav, MobileTopBar } from "@/components/app-shell";
import { PresencePing } from "@/components/presence-ping";

// La coque de l'application membre.
// - Ordinateur : barre latérale à gauche, contenu large à droite.
// - Téléphone / tablette : barre du haut + onglets en bas.
// Les panneaux "membres" et "calendrier" ne sont plus partout :
// chaque page les montre seulement quand ils sont utiles.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-cream">
      <a
        href="#main"
        className="sr-only z-50 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <AppSidebar />
      <MobileTopBar />

      <main id="main" tabIndex={-1} className="flex-1 outline-none lg:pl-sidebar">
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </div>
        {/* La place de la barre d'onglets du bas : elle ne cache jamais le contenu. */}
        <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden" />
      </main>

      <MobileNav />

      {/* Dit au serveur que je suis en ligne (rien ne s'affiche). */}
      <PresencePing />
    </div>
  );
}
