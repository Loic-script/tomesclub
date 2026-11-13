import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { MemberAvatar } from "@/components/member-avatar";
import { requireAdmin } from "@/lib/admin";
import { ENGLISH_LEVELS, OCCUPATIONS } from "@/lib/onboarding-options";
import { prisma } from "@/lib/prisma";
import { ArrowIcon, CalendarIcon, PhoneIcon, RoomIcon, UsersIcon } from "../../admin-icons";
import { Chip, delay, Panel } from "../../admin-ui";
import { DeleteMemberButton } from "../delete-member-button";
import { RoleStatus } from "../role-status";

export const metadata: Metadata = { title: "Member profile · Admin" };

const ONLINE_MS = 2 * 60 * 1000;

// Page /admin/members/<id> : la fiche complète d'un membre.
export default function MemberProfilePage({ params }: PageProps<"/admin/members/[id]">) {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
      {params.then(({ id }) => (
        <MemberProfile userId={id} />
      ))}
    </Suspense>
  );
}

/** Lit la fiche et l'activité du membre. */
async function loadMember(userId: string) {
  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          birthDate: true,
          phone: true,
          country: true,
          city: true,
          occupations: true,
          englishLevel: true,
          languages: true,
          interests: true,
          photoType: true,
          completedAt: true,
          lastSeenAt: true,
          role: true,
          roleRequest: true,
        },
      },
      _count: {
        select: {
          callParticipation: true,
          followers: true,
          following: true,
          roomsCreated: true,
          eventResponses: { where: { status: "registered" } },
        },
      },
    },
  });
  if (!member) return null;
  const lastSeen = member.profile?.lastSeenAt ?? null;
  return { ...member, online: Boolean(lastSeen && Date.now() - lastSeen.getTime() < ONLINE_MS) };
}

async function MemberProfile({ userId }: { userId: string }) {
  await requireAdmin();
  const member = await loadMember(userId);
  if (!member) notFound();

  const profile = member.profile;
  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : member.name;
  const level = ENGLISH_LEVELS.find((entry) => entry.value === profile?.englishLevel)?.label ?? null;

  // Le champ occupations est du JSON libre : on le relit prudemment.
  const occupations = Array.isArray(profile?.occupations)
    ? (profile.occupations as { kind?: string; detail?: string }[]).map((entry) => ({
        label:
          OCCUPATIONS.find((occupation) => occupation.kind === entry.kind)?.label ?? entry.kind ?? "?",
        detail: entry.detail ?? "",
      }))
    : [];

  const date = (value: Date | null | undefined) =>
    value
      ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(value)
      : null;

  const stats = [
    { label: "Video calls", value: member._count.callParticipation, icon: <PhoneIcon className="size-4" /> },
    { label: "Followers", value: member._count.followers, icon: <UsersIcon className="size-4" /> },
    { label: "Following", value: member._count.following, icon: <UsersIcon className="size-4" /> },
    { label: "Events registered", value: member._count.eventResponses, icon: <CalendarIcon className="size-4" /> },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/members"
        className="anim-rise mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <ArrowIcon className="size-4 rotate-180" />
        All members
      </Link>

      {/* ----- La carte d'identité ----- */}
      <section className="neu anim-rise relative overflow-hidden rounded-[2rem] p-6 sm:p-8" style={delay(60)}>
        <span
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-gradient-to-br from-accent/40 to-brand/30 blur-3xl"
        />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="relative">
            <span className="block rounded-full bg-gradient-to-br from-accent to-brand p-[3px]">
              <MemberAvatar
                userId={member.id}
                name={displayName}
                hasPhoto={Boolean(profile?.photoType)}
                size="size-24"
              />
            </span>
            {member.online && (
              <span
                aria-label="Online"
                className="absolute bottom-1 right-1 size-5 rounded-full bg-emerald-400 ring-4 ring-[#2a1238]"
              />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="text-headline truncate font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              {displayName}
            </h1>
            <p className="mt-1 truncate text-sm text-white/55">{member.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {member.online ? <Chip tone="good">● Online now</Chip> : <Chip>Offline</Chip>}
              <RoleStatus
                userId={member.id}
                role={profile?.role ?? "member"}
                roleRequest={profile?.roleRequest ?? null}
                completed={Boolean(profile?.completedAt)}
                large
              />
              {level && <Chip tone="navy">{level}</Chip>}
              <Chip>Member since {date(member.createdAt)}</Chip>
            </div>
          </div>

          <DeleteMemberButton userId={member.id} name={profile?.firstName ?? member.name} />
        </div>

        {/* L'activité dans le club */}
        <dl className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="neu-inset rounded-2xl p-4">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                {stat.icon}
                {stat.label}
              </dt>
              <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums text-white">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ----- Les informations ----- */}
      {!profile ? (
        <Panel className="mt-5" style={delay(140)}>
          <p className="text-white/55">This member has not filled in the form yet.</p>
        </Panel>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel style={delay(140)} title="Personal details" icon={<UsersIcon className="size-[18px]" />}>
            <dl className="space-y-4">
              <Field label="Date of birth" value={date(profile.birthDate)} />
              <Field label="Phone" value={profile.phone} />
              <Field label="Location" value={[profile.city, profile.country].filter(Boolean).join(", ")} />
              <Field
                label="Occupations"
                value={
                  occupations.length > 0
                    ? occupations.map((entry) => (entry.detail ? `${entry.label} — ${entry.detail}` : entry.label)).join(" · ")
                    : null
                }
              />
            </dl>
          </Panel>

          <Panel style={delay(200)} title="Learning" icon={<RoomIcon className="size-[18px]" />}>
            <dl className="space-y-4">
              <Field label="English level" value={level} />
              <Field label="Languages">
                <TagList items={profile.languages} />
              </Field>
              <Field label="Interests">
                <TagList items={profile.interests} />
              </Field>
            </dl>
          </Panel>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, children }: { label: string; value?: string | null; children?: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{label}</dt>
      <dd className="mt-1 text-sm text-white">
        {children ?? (value || <span className="text-white/30">—</span>)}
      </dd>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-white/30">—</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
          {item}
        </span>
      ))}
    </span>
  );
}
