import type { ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";

// La coque de l'application membre : fond sombre du club + barre de navigation en bas.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[linear-gradient(160deg,#1a1150,#45091f_45%,#7a082e)]">
      {/* Lueurs douces dans les coins */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-navy/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-24 size-[28rem] rounded-full bg-accent/15 blur-3xl"
      />

      {/* Colonne centrale, largeur "téléphone" même sur grand écran */}
      <div className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 pb-32 pt-8">{children}</div>

      <BottomNav />
    </div>
  );
}
