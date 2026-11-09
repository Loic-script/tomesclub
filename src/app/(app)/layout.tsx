import type { ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";

// La coque de l'application membre : fond clair en relief doux + barre de navigation en bas.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col bg-surface">
      {/* Colonne centrale, largeur "téléphone" même sur grand écran */}
      <div className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 pb-32 pt-8">{children}</div>

      <BottomNav />
    </div>
  );
}
