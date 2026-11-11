import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { ENGLISH_LEVELS } from "@/lib/onboarding-options";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "../admin-ui";
import { MembersBrowser, type AdminMemberRow } from "./members-browser";

export const metadata: Metadata = { title: "Members · Admin" };

const ONLINE_MS = 2 * 60 * 1000;

// Page /admin/members : tous les membres, avec recherche et filtres.
export default function MembersPage() {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
      <MembersList />
    </Suspense>
  );
}

/** Lit les membres et les prépare pour l'écran (dates déjà mises en texte). */
async function loadMembers(): Promise<AdminMemberRow[]> {
  const members = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          englishLevel: true,
          country: true,
          city: true,
          completedAt: true,
          photoType: true,
          lastSeenAt: true,
        },
      },
    },
  });
  const now = Date.now();
  const joined = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return members.map((member) => {
    const profile = member.profile;
    return {
      id: member.id,
      name: profile ? `${profile.firstName} ${profile.lastName}` : member.name,
      firstName: profile?.firstName ?? member.name,
      email: member.email,
      level: ENGLISH_LEVELS.find((level) => level.value === profile?.englishLevel)?.label ?? null,
      place: [profile?.city, profile?.country].filter(Boolean).join(", ") || null,
      completed: Boolean(profile?.completedAt),
      hasPhoto: Boolean(profile?.photoType),
      online: Boolean(profile?.lastSeenAt && now - profile.lastSeenAt.getTime() < ONLINE_MS),
      joined: joined.format(member.createdAt),
    };
  });
}

async function MembersList() {
  await requireAdmin();
  const members = await loadMembers();
  const online = members.filter((member) => member.online).length;

  return (
    <>
      <AdminHeader
        eyebrow="Community"
        title="Members"
        subtitle={`${members.length} ${members.length === 1 ? "member" : "members"} · ${online} online now`}
      />
      <MembersBrowser members={members} />
    </>
  );
}
