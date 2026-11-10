import type { Metadata } from "next";
import { Suspense } from "react";
import { delay, GlassCard, PageHeader } from "@/components/app-ui";
import { SideMembersList } from "@/components/side-members-list";
import { listMembers } from "@/lib/members";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Members" };

// Page /members : tous les membres inscrits, avec la recherche par nom.
// Sur téléphone, on y arrive par l icône "membres" à côté de la cloche.
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
  const onlineCount = members.filter((member) => member.online).length;

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Members"
        subtitle={`Everyone in the club · ${onlineCount} online`}
        members={false}
      />
      <GlassCard className="anim-rise flex flex-col" style={delay(120)}>
        <SideMembersList members={members} />
      </GlassCard>
    </>
  );
}
