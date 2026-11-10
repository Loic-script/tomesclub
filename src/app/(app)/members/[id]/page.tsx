import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card, delay, EmptyState, LevelMeter, PageSkeleton, SectionHeader } from "@/components/app-ui";
import { FollowButton } from "@/components/follow-button";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from "@/components/icons";
import { MemberAvatar } from "@/components/member-avatar";
import { getPublicMemberProfile } from "@/lib/members";
import { OCCUPATIONS } from "@/lib/onboarding-options";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Member" };

// Page /members/[id] : la fiche publique d'un autre membre.
export default function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MemberView params={params} />
    </Suspense>
  );
}

function BackLink() {
  return (
    <Link
      href="/calls"
      className="mb-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-mute transition-colors hover:text-brand"
    >
      <ArrowLeftIcon className="size-4" />
      Back to members
    </Link>
  );
}

async function MemberView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireMember();
  if (id === me.id) {
    // Ma propre fiche : on envoie vers ma page profil.
    return (
      <>
        <BackLink />
        <EmptyState
          icon={<UserIcon />}
          title="This is you"
          description="Your own profile has its own page."
          action={
            <Link href="/profile" className="btn btn-primary">
              Open my profile
            </Link>
          }
        />
      </>
    );
  }

  const member = await getPublicMemberProfile(id, me.id);
  if (!member) notFound();

  const occupations = member.occupations.map((entry) => ({
    label: OCCUPATIONS.find((occupation) => occupation.kind === entry.kind)?.label ?? entry.kind ?? "?",
    detail: entry.detail ?? "",
  }));
  const place = [member.city, member.country].filter(Boolean).join(", ");
  const fullName = `${member.firstName} ${member.lastName}`;
  const hasDetails =
    Boolean(member.englishLevel) ||
    occupations.length > 0 ||
    member.languages.length > 0 ||
    member.interests.length > 0;

  return (
    <>
      <BackLink />

      {/* ----- La carte du membre : qui, où, et les deux actions ----- */}
      <section className="anim-rise card p-6 sm:p-8" style={delay(60)}>
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:text-left">
          <MemberAvatar
            userId={member.id}
            name={fullName}
            hasPhoto={member.hasPhoto}
            size="size-28"
            online={member.online}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <h1 className="break-words font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {fullName}
              </h1>
              {member.followsMe && <span className="chip font-semibold text-mute">Follows you</span>}
            </div>

            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-mute md:justify-start">
              <span
                className={`inline-flex items-center gap-1.5 font-medium ${
                  member.online ? "text-success" : ""
                }`}
              >
                <span
                  aria-hidden
                  className={`size-2 rounded-full ${member.online ? "bg-success" : "bg-line-strong"}`}
                />
                {member.online ? "Online now" : "Member of the club"}
              </span>
              {member.age !== null && <span>{member.age} years old</span>}
              {place && (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="size-4" />
                  {place}
                </span>
              )}
            </p>

            <dl className="mt-4 flex justify-center gap-6 md:justify-start">
              <Count
                value={member.followerCount}
                label={member.followerCount === 1 ? "Follower" : "Followers"}
              />
              <Count value={member.followingCount} label="Following" />
            </dl>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row md:flex-col lg:flex-row">
            <FollowButton
              memberId={member.id}
              following={member.following}
              followsMe={member.followsMe}
              size="lg"
            />
            <Link href="/calls" className="btn btn-secondary">
              <PhoneIcon className="size-4" />
              Call
            </Link>
          </div>
        </div>
      </section>

      {/* ----- Les détails ----- */}
      {hasDetails && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {member.englishLevel && (
            <Card className="anim-rise" style={delay(120)}>
              <SectionHeader title="English level" />
              <LevelMeter level={member.englishLevel} />
            </Card>
          )}

          {occupations.length > 0 && (
            <Card className="anim-rise" style={delay(160)}>
              <SectionHeader title="Occupation" />
              <ul className="space-y-3">
                {occupations.map((occupation) => (
                  <li key={`${occupation.label}-${occupation.detail}`} className="flex gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand">
                      <BriefcaseIcon className="size-4" />
                    </span>
                    <span className="min-w-0 text-sm">
                      <span className="block font-semibold text-ink">{occupation.label}</span>
                      {occupation.detail && (
                        <span className="block break-words text-mute">{occupation.detail}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {member.languages.length > 0 && (
            <Card className="anim-rise" style={delay(200)}>
              <Chips label="Languages" values={member.languages} />
            </Card>
          )}

          {member.interests.length > 0 && (
            <Card className="anim-rise" style={delay(240)}>
              <Chips label="Interests" values={member.interests} />
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-xs text-mute">{label}</dt>
      <dd className="font-display text-xl font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function Chips({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <SectionHeader title={label} />
      <ul className="flex flex-wrap gap-2">
        {values.map((value) => (
          <li key={value} className="chip">
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}
