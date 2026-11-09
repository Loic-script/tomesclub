import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { delay, GlassCard, PageHeader } from "@/components/app-ui";
import { MemberAvatar } from "@/components/member-avatar";
import { SignOutButton } from "@/components/sign-out-button";
import { OCCUPATIONS } from "@/lib/onboarding-options";
import { getFullProfile } from "@/lib/profile";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Profile" };

// Page /profile : ma fiche, avec le bouton pour la modifier.
export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-zinc-400">Loading...</p>}>
      <ProfileHome />
    </Suspense>
  );
}

async function ProfileHome() {
  const user = await requireMember();
  const profile = await getFullProfile(user.id);
  if (!profile) return null; // impossible en pratique : requireMember vérifie déjà

  const occupations = Array.isArray(profile.occupations)
    ? (profile.occupations as { kind?: string; detail?: string }[]).map((entry) => ({
        label:
          OCCUPATIONS.find((occupation) => occupation.kind === entry.kind)?.label ??
          entry.kind ??
          "?",
        detail: entry.detail ?? "",
      }))
    : [];

  const birthDate = profile.birthDate
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(
        profile.birthDate,
      )
    : null;

  return (
    <>
      <PageHeader
        title="Profile"
        right={
          <Link
            href="/profile/edit"
            className="neu-sm neu-btn rounded-full px-4 py-2 text-sm font-semibold text-brand"
          >
            Edit
          </Link>
        }
      />

      <div className="space-y-5">
        {/* La carte d'identité */}
        <GlassCard className="anim-rise flex items-center gap-4" style={delay(150)}>
          <MemberAvatar
            userId={user.id}
            name={`${profile.firstName} ${profile.lastName}`}
            hasPhoto={Boolean(profile.photoType)}
            size="size-20"
          />
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-bold text-navy">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="truncate text-sm text-zinc-500">{user.email}</p>
            {profile.englishLevel && (
              <span className="mt-1.5 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold capitalize text-white shadow-sm">
                {profile.englishLevel}
              </span>
            )}
          </div>
        </GlassCard>

        {/* Les infos */}
        <GlassCard className="anim-rise" style={delay(250)}>
          <h3 className="mb-3 font-display text-lg font-bold text-navy">About</h3>
          <dl className="space-y-2.5">
            <InfoRow label="Date of birth" value={birthDate} />
            <InfoRow label="Phone" value={profile.phone} />
            <InfoRow label="Country" value={profile.country} />
            <InfoRow label="City" value={profile.city} />
            <InfoRow
              label="What I do"
              value={
                occupations.length > 0
                  ? occupations.map((entry) => `${entry.label} — ${entry.detail}`).join(" · ")
                  : null
              }
            />
          </dl>
        </GlassCard>

        {(profile.languages.length > 0 || profile.interests.length > 0) && (
          <GlassCard className="anim-rise space-y-4" style={delay(350)}>
            {profile.languages.length > 0 && (
              <ChipGroup label="Languages" values={profile.languages} />
            )}
            {profile.interests.length > 0 && (
              <ChipGroup label="Interests" values={profile.interests} />
            )}
          </GlassCard>
        )}

        <div className="anim-rise flex justify-center pt-2" style={delay(450)}>
          <SignOutButton className="neu-sm neu-btn rounded-full px-6 py-2.5 font-semibold text-brand disabled:opacity-60" />
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-sm text-zinc-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-zinc-900">
        {value || <span className="text-zinc-300">—</span>}
      </dd>
    </div>
  );
}

function ChipGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <h3 className="mb-2 font-display text-lg font-bold text-navy">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="neu-inset rounded-full px-3 py-1 text-sm font-medium text-zinc-700"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}
