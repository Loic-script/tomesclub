import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { OCCUPATIONS } from "@/lib/onboarding-options";
import { prisma } from "@/lib/prisma";
import { MemberAvatar } from "@/components/member-avatar";
import { DeleteMemberButton } from "../delete-member-button";

export const metadata: Metadata = { title: "Member profile · Admin" };

// Page /admin/members/<id> : la fiche complète d'un membre.
export default function MemberProfilePage({ params }: PageProps<"/admin/members/[id]">) {
  return (
    <main className="flex flex-1 flex-col bg-cream">
      <Suspense fallback={<p className="m-auto text-zinc-500">Loading...</p>}>
        {params.then(({ id }) => (
          <MemberProfile userId={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function MemberProfile({ userId }: { userId: string }) {
  await requireAdmin();

  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true, profile: true },
  });
  if (!member) notFound();

  const profile = member.profile;
  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : member.name;

  // Le champ occupations est du JSON libre : on le relit prudemment.
  const occupations = Array.isArray(profile?.occupations)
    ? (profile.occupations as { kind?: string; detail?: string }[]).map((entry) => ({
        label:
          OCCUPATIONS.find((occupation) => occupation.kind === entry.kind)?.label ??
          entry.kind ??
          "?",
        detail: entry.detail ?? "",
      }))
    : [];

  const date = (value: Date | null | undefined) =>
    value
      ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(value)
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/admin/members" className="text-sm font-semibold text-brand hover:underline">
        ← All members
      </Link>

      <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        <header className="flex flex-wrap items-center gap-4 border-b border-zinc-100 pb-6">
          <MemberAvatar
            userId={member.id}
            name={displayName}
            hasPhoto={Boolean(profile?.photoType)}
            size="size-20"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-bold text-navy">{displayName}</h1>
            <p className="truncate text-sm text-zinc-500">{member.email}</p>
            <p className="mt-1 text-xs text-zinc-400">
              Member since {date(member.createdAt)} ·{" "}
              {profile?.completedAt ? "profile completed" : "profile not finished"}
            </p>
          </div>
          <DeleteMemberButton userId={member.id} name={profile?.firstName ?? member.name} />
        </header>

        {!profile ? (
          <p className="pt-6 text-zinc-500">This member has not filled in the form yet.</p>
        ) : (
          <dl className="grid gap-x-8 gap-y-5 pt-6 sm:grid-cols-2">
            <Field label="Date of birth" value={date(profile.birthDate)} />
            <Field label="Phone" value={profile.phone} />
            <Field label="Country" value={profile.country} />
            <Field label="City" value={profile.city} />
            <Field
              label="Occupations"
              value={
                occupations.length > 0
                  ? occupations.map((entry) => `${entry.label} — ${entry.detail}`).join(" · ")
                  : null
              }
            />
            <Field label="English level" value={profile.englishLevel} capitalize />
            <Field
              label="Languages"
              value={profile.languages.length > 0 ? profile.languages.join(", ") : null}
            />
            <Field
              label="Interests"
              value={profile.interests.length > 0 ? profile.interests.join(", ") : null}
            />
          </dl>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string | null | undefined;
  capitalize?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className={`mt-0.5 text-zinc-900 ${capitalize ? "capitalize" : ""}`}>
        {value || <span className="text-zinc-400">—</span>}
      </dd>
    </div>
  );
}
