import type { Metadata } from "next";
import { Suspense } from "react";
import { delay, PageHeader } from "@/components/app-ui";
import { SideMembersList } from "@/components/side-members-list";
import { listMembers } from "@/lib/members";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Members" };

// Page /members : tous les membres inscrits, en liste, avec la recherche et des filtres
// (en ligne, je suis, me suit, niveau d'anglais). Sur ordinateur, le calendrier
// et le panneau Members restent sur les côtés, comme sur les autres pages.
export default function MembersPage() {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
      <MembersHome />
    </Suspense>
  );
}

async function MembersHome() {
  const user = await requireMember();
  // Tout le monde (0 = pas de limite) : en ligne d'abord, puis par prénom.
  const members = await listMembers(user.id, 0);

  return (
    <>
      <PageHeader eyebrow="Community" title="Members" subtitle="Meet the club and follow your favourite partners." members={false} />
      <div className="anim-rise" style={delay(120)}>
        <SideMembersList members={members} showOnline feed />
      </div>
    </>
  );
}
