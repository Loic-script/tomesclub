import type { ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { SideCalendar } from "@/components/side-calendar";
import { SideClock } from "@/components/side-clock";

// La coque de l'application membre : fond clair en relief doux + barre de navigation en bas.
// Sur grand écran, un calendrier à gauche et une montre à droite habillent les côtés.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col bg-surface">
      <SideCalendar className="fixed left-10 top-1/2 z-10 hidden -translate-y-1/2 xl:block" />

      {/* Colonne centrale, largeur "téléphone" même sur grand écran */}
      <div className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 pb-32 pt-8">{children}</div>

      <SideClock className="fixed right-10 top-1/2 z-10 hidden -translate-y-1/2 xl:block" />

      <BottomNav />
    </div>
  );
}
