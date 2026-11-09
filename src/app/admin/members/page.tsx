import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { MemberAvatar } from "@/components/member-avatar";
import { DeleteMemberButton } from "./delete-member-button";

export const metadata: Metadata = { title: "Members · Admin" };

// Page /admin/members : la liste des membres, avec accès à chaque fiche.
export default function MembersPage() {
  return (
    <main className="flex flex-1 flex-col bg-cream">
      <Suspense fallback={<p className="m-auto text-zinc-500">Loading...</p>}>
        <MembersList />
      </Suspense>
    </main>
  );
}

async function MembersList() {
  await requireAdmin();

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
          completedAt: true,
          photoType: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="mb-6">
        <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-navy">
          Members <span className="text-base font-semibold text-zinc-400">({members.length})</span>
        </h1>
      </header>

      {members.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-zinc-500 shadow-sm">
          No members yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => {
            const displayName = member.profile
              ? `${member.profile.firstName} ${member.profile.lastName}`
              : member.name;
            return (
              <li
                key={member.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
              >
                <MemberAvatar
                  userId={member.id}
                  name={displayName}
                  hasPhoto={Boolean(member.profile?.photoType)}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-zinc-900">{displayName}</p>
                  <p className="truncate text-sm text-zinc-500">{member.email}</p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {member.profile?.englishLevel && (
                    <span className="rounded-full bg-navy/10 px-2.5 py-1 font-semibold capitalize text-navy">
                      {member.profile.englishLevel}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-1 font-semibold ${
                      member.profile?.completedAt
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {member.profile?.completedAt ? "Profile completed" : "Profile not finished"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/members/${member.id}`}
                    className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                  >
                    View profile
                  </Link>
                  <DeleteMemberButton userId={member.id} name={member.profile?.firstName ?? member.name} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
