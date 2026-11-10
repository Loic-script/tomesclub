import { Suspense, type ReactNode } from "react";
import { AppBackground } from "@/components/app-background";
import { BottomNav } from "@/components/bottom-nav";
import { PresencePing } from "@/components/presence-ping";
import { SideCalendar } from "@/components/side-calendar";
import { SideMembers, SideMembersFallback } from "@/components/side-members";

// La coque de l'application membre : la photo "Learn English!" voilée de rouge,
// les cartes blanches posées dessus, et sur grand écran un calendrier à gauche
// et la liste des membres à droite.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-cream">
      <AppBackground />

      <SideCalendar className="fixed left-10 top-1/2 z-10 hidden -translate-y-1/2 xl:block" />

      {/* Colonne centrale, largeur "téléphone" même sur grand écran */}
      <div className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 pb-32 pt-8">{children}</div>

      {/* Les membres du club : qui est en ligne, et le bouton pour les suivre.
          La liste est lue au moment de la requête → <Suspense> obligatoire. */}
      <Suspense
        fallback={
          <SideMembersFallback className="fixed right-10 top-1/2 z-10 hidden -translate-y-1/2 xl:block" />
        }
      >
        <SideMembers className="fixed right-10 top-1/2 z-10 hidden -translate-y-1/2 xl:block" />
      </Suspense>

      {/* La barre du bas lit l'adresse de la page : obligatoire dans un <Suspense>. */}
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>

      {/* Dit au serveur que je suis en ligne (rien ne s'affiche). */}
      <PresencePing />
    </div>
  );
}
