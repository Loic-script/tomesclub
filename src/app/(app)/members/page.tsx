import type { Metadata } from "next";
import { Suspense } from "react";
import { delay, GlassCard } from "@/components/app-ui";
import { SideMembersList } from "@/components/side-members-list";
import { listMembers } from "@/lib/members";
import { requireMember } from "@/lib/session";
import { MembersBoard } from "./members-board";

export const metadata: Metadata = { title: "Members" };

// Page /members : tous les membres inscrits.
// Ordinateur : un tableau en colonnes (niveau d'anglais) avec des cartes 3D, rien autour sauf la barre du bas.
// Téléphone et tablette : la liste simple aux couleurs du bouton message.
export default function MembersPage() {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
      <MembersHome />
    </Suspense>
  );
}

async function MembersHome() {
  const user = await requireMember();
  // Tout le monde (0 = pas de limite) : en ligne d abord, puis par prénom.
  const members = await listMembers(user.id, 0);

  return (
    <>
      {/* Ordinateur : le tableau (il cache le calendrier et le panneau Members, voir MembersBoard) */}
      <div className="max-lg:hidden">
        <MembersBoard members={members} />
      </div>

      {/* Téléphone et tablette : la liste simple */}
      <div className="lg:hidden">
        <GlassCard className="card-accent-phone anim-rise flex flex-col" style={delay(120)}>
          <SideMembersList members={members} showOnline />
        </GlassCard>
      </div>
    </>
  );
}
