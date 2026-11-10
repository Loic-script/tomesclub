import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { delay, GlassCard, PageHeader } from "@/components/app-ui";
import { FollowButton } from "@/components/follow-button";
import { MemberAvatar } from "@/components/member-avatar";
import { getPublicMemberProfile } from "@/lib/members";
import { ENGLISH_LEVELS, OCCUPATIONS } from "@/lib/onboarding-options";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Member" };

// Page /members/[id] : la fiche publique d'un autre membre.
export default function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
      <MemberView params={params} />
    </Suspense>
  );
}

async function MemberView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireMember();
  if (id === me.id) {
    // Ma propre fiche : on envoie vers ma page profil.
    return (
      <GlassCard className="anim-rise text-center">
        <p className="text-white">This is you.</p>
        <Link
          href="/profile"
          className="neu-sm neu-btn mt-4 inline-block rounded-full px-5 py-2 text-sm font-semibold text-white"
        >
          Open my profile
        </Link>
      </GlassCard>
    );
  }

  const member = await getPublicMemberProfile(id, me.id);
  if (!member) notFound();

  const level = ENGLISH_LEVELS.find((entry) => entry.value === member.englishLevel)?.label;
  const occupations = member.occupations.map((entry) => ({
    label: OCCUPATIONS.find((occupation) => occupation.kind === entry.kind)?.label ?? entry.kind ?? "?",
    detail: entry.detail ?? "",
  }));
  const place = [member.city, member.country].filter(Boolean).join(", ");

  return (
    <>
      <PageHeader
        title={member.firstName}
        subtitle={member.online ? "Online now" : "Member of the club"}
        right={
          <Link
            href="/calls"
            aria-label="Back to members"
            className="neu-sm neu-btn rounded-full px-4 py-2 text-sm font-semibold text-white"
          >
            Back
          </Link>
        }
      />

      <div className="space-y-5">
        {/* ----- La carte du membre ----- */}
        <GlassCard className="anim-pop text-center" style={delay(120)}>
          <div className="relative mx-auto w-fit">
            <span className="neu-sm block rounded-full p-1.5">
              <MemberAvatar
                userId={member.id}
                name={`${member.firstName} ${member.lastName}`}
                hasPhoto={member.hasPhoto}
                size="size-24"
              />
            </span>
            <span
              aria-label={member.online ? "Online" : "Offline"}
              className={`absolute bottom-1.5 right-1.5 size-5 rounded-full border-4 border-[#2b1538] ${
                member.online ? "bg-emerald-400" : "bg-white/30"
              }`}
            />
          </div>

          <h2 className="mt-3 font-display text-2xl font-bold text-white">
            {member.firstName} {member.lastName}
          </h2>
          {place && <p className="text-sm text-white/55">{place}</p>}

          {/* Il me suit déjà ? On le dit. */}
          {member.followsMe && (
            <p className="mt-2 inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70">
              Follows you
            </p>
          )}

          <div className="mt-4 flex items-center justify-center gap-6">
            <Count value={member.followerCount} label="Followers" />
            <Count value={member.followingCount} label="Following" />
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <FollowButton
              memberId={member.id}
              following={member.following}
              followsMe={member.followsMe}
              size="lg"
            />
            <Link
              href="/calls"
              className="neu-sm neu-btn rounded-full px-6 py-2.5 text-sm font-semibold text-white"
            >
              Call
            </Link>
          </div>
        </GlassCard>

        {/* ----- Les détails ----- */}
        <GlassCard className="anim-rise space-y-4" style={delay(200)}>
          {level && <Row label="English level" value={level} />}
          {occupations.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/40">Occupation</p>
              <ul className="mt-1 space-y-1">
                {occupations.map((occupation) => (
                  <li key={occupation.label} className="text-sm text-white">
                    {occupation.label}
                    {occupation.detail && (
                      <span className="text-white/55"> — {occupation.detail}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {member.languages.length > 0 && <Chips label="Languages" values={member.languages} />}
          {member.interests.length > 0 && <Chips label="Interests" values={member.interests} />}
        </GlassCard>
      </div>
    </>
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <span className="text-center">
      <span className="block font-display text-xl font-bold text-white">{value}</span>
      <span className="block text-[11px] text-white/50">{label}</span>
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="text-sm text-white">{value}</p>
    </div>
  );
}

function Chips({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <li
            key={value}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
          >
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}
