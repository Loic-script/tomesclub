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
    <Suspense fallback={<p className="pt-20 text-center text-mute">Loading...</p>}>
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
        <p className="text-ink">This is you.</p>
        <Link
          href="/profile"
          className="neu-sm neu-btn mt-4 inline-block rounded-full px-5 py-2 text-sm font-semibold text-ink"
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
  // La ligne sous le nom : "24 years old · Antananarivo, Madagascar"
  const ageLine = member.age !== null ? `${member.age} years old` : null;
  const subLine = [ageLine, place || null].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader
        title={member.firstName}
        subtitle={member.online ? "Online now" : "Member of the club"}
        right={
          <Link
            href="/calls"
            aria-label="Back to members"
            className="neu-sm neu-btn rounded-full px-4 py-2 text-sm font-semibold text-ink"
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
              className={`absolute bottom-1.5 right-1.5 size-5 rounded-full border-4 border-white ${
                member.online ? "bg-success" : "bg-blush-2"
              }`}
            />
          </div>

          <h2 className="mt-3 font-display text-2xl font-bold text-ink">
            {member.firstName} {member.lastName}
          </h2>
          {subLine && <p className="text-sm text-mute">{subLine}</p>}

          {/* Il me suit déjà ? On le dit. */}
          {member.followsMe && (
            <p className="mt-2 inline-block rounded-full bg-blush px-3 py-1 text-[11px] font-semibold text-mute">
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
              className="neu-sm neu-btn rounded-full px-6 py-2.5 text-sm font-semibold text-ink"
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
              <p className="text-[11px] uppercase tracking-wide text-mute/70">Occupation</p>
              <ul className="mt-1 space-y-1">
                {occupations.map((occupation) => (
                  <li key={occupation.label} className="text-sm text-ink">
                    {occupation.label}
                    {occupation.detail && (
                      <span className="text-mute"> — {occupation.detail}</span>
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
      <span className="block font-display text-xl font-bold text-ink">{value}</span>
      <span className="block text-[11px] text-mute">{label}</span>
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-mute/70">{label}</p>
      <p className="text-sm text-ink">{value}</p>
    </div>
  );
}

function Chips({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-mute/70">{label}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <li
            key={value}
            className="rounded-full bg-blush px-3 py-1 text-xs font-medium text-mute"
          >
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}
