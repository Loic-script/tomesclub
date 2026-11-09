import type { ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { SideCalendar } from "@/components/side-calendar";
import { SideClock } from "@/components/side-clock";

// La coque de l'application membre : le fond sombre de la page d'authentification,
// avec les cartes claires en relief qui flottent dessus. Sur grand écran,
// un calendrier à gauche et une montre à droite habillent les côtés.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="on-dark relative flex flex-1 flex-col overflow-hidden bg-[linear-gradient(160deg,#1a1150,#45091f_45%,#7a082e)]">
      {/* Lueurs douces dans les coins, comme sur la page de connexion */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-navy/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-24 size-[28rem] rounded-full bg-accent/15 blur-3xl"
      />

      {/* Quelques tuiles de verre flottantes */}
      <span
        aria-hidden
        className="anim-bubble pointer-events-none absolute left-[7%] top-[14%] size-20 rotate-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm max-xl:hidden"
        style={{ "--d": "400ms", "--float": "9s" } as React.CSSProperties}
      />
      <span
        aria-hidden
        className="anim-bubble pointer-events-none absolute bottom-[16%] right-[6%] size-14 -rotate-6 rounded-2xl bg-gradient-to-br from-accent/70 to-brand/50 max-xl:hidden"
        style={{ "--d": "700ms", "--float": "11s" } as React.CSSProperties}
      />
      <span
        aria-hidden
        className="anim-bubble pointer-events-none absolute right-[4%] top-[10%] size-10 rotate-12 rounded-xl bg-cream/25 max-xl:hidden"
        style={{ "--d": "1000ms", "--float": "8s" } as React.CSSProperties}
      />

      <SideCalendar className="fixed left-10 top-1/2 z-10 hidden -translate-y-1/2 xl:block" />

      {/* Colonne centrale, largeur "téléphone" même sur grand écran */}
      <div className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 pb-32 pt-8">{children}</div>

      <SideClock className="fixed right-10 top-1/2 z-10 hidden -translate-y-1/2 xl:block" />

      <BottomNav />
    </div>
  );
}
