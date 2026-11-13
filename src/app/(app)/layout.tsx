import { Suspense, type ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { CoachChat } from "@/components/coach-chat";
import { IncomingCall } from "@/components/incoming-call";
import { PresencePing } from "@/components/presence-ping";
import { SideCalendar } from "@/components/side-calendar";
import { SideCalendarWithEvents } from "@/components/side-calendar-events";
import { SideMembers, SideMembersFallback } from "@/components/side-members";

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

      {/* Le calendrier marque les jours d'événement : lu au moment de la requête → <Suspense>. */}
      <Suspense
        fallback={
          <SideCalendar className="fixed left-10 top-1/2 z-10 hidden -translate-y-1/2 xl:block" />
        }
      >
        <SideCalendarWithEvents className="fixed left-10 top-1/2 z-10 hidden -translate-y-1/2 xl:block" />
      </Suspense>

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

      {/* Le bouton rond en bas à droite : discuter avec le coach. */}
      <CoachChat />

      {/* Un appel entrant (membre, salle privée, direct d'un événement) : la fenêtre qui sonne */}
      <IncomingCall />

      {/* Dit au serveur que je suis en ligne (rien ne s'affiche). */}
      <PresencePing />
    </div>
  );
}
