import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Card, delay, LevelMeter, PageHeader, PageSkeleton, SectionHeader } from "@/components/app-ui";
import {
  BriefcaseIcon,
  CakeIcon,
  ChatIcon,
  HeartIcon,
  LogoutIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
} from "@/components/icons";
import { MemberAvatar } from "@/components/member-avatar";
import { SignOutButton } from "@/components/sign-out-button";
import { ENGLISH_LEVELS, OCCUPATIONS } from "@/lib/onboarding-options";
import { getFullProfile } from "@/lib/profile";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Profile" };

// Page /profile : ma carte de membre (à gauche sur ordinateur),
// mes informations (à droite), et les boutons Edit / Sign out.
export default function ProfilePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
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
  const place = [profile.city, profile.country].filter(Boolean).join(", ") || null;
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const levelLabel = ENGLISH_LEVELS.find((entry) => entry.value === profile.englishLevel)?.label;

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Your member card and what the club knows about you."
        actions={
          <>
            <Link href="/profile/edit" className="btn btn-primary">
              <PencilIcon className="size-4" />
              Edit profile
            </Link>
            <SignOutButton className="btn btn-secondary" icon={<LogoutIcon className="size-4" />} />
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
        {/* ----- La carte de membre du club ----- */}
        <div className="anim-rise lg:sticky lg:top-10" style={delay(80)}>
          <article
            aria-label="Member card"
            className="card mx-auto w-full max-w-sm overflow-hidden text-center lg:max-w-none"
          >
            {/* Le bandeau aux couleurs du club */}
            <div aria-hidden className="relative h-24 overflow-hidden bg-brand">
              <svg viewBox="0 0 320 96" preserveAspectRatio="none" className="absolute inset-0 size-full">
                <polygon points="0,96 320,20 320,96" className="fill-brand-dark/60" />
                <polygon points="210,0 320,0 320,44" className="fill-accent" />
              </svg>
              <span className="absolute left-1/2 top-3 h-2 w-14 -translate-x-1/2 rounded-full bg-white/25" />
            </div>

            <div className="-mt-14 flex justify-center">
              <span className="relative rounded-full bg-surface p-1.5 shadow-card">
                <MemberAvatar
                  userId={user.id}
                  name={fullName}
                  hasPhoto={Boolean(profile.photoType)}
                  size="size-28"
                />
              </span>
            </div>

            <div className="px-6 pb-6 pt-3">
              <h2 className="break-words font-display text-2xl font-semibold text-ink">{fullName}</h2>
              <p className="eyebrow mt-1">Tomes Club member</p>
              {levelLabel && (
                <span className="mt-3 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-ink">
                  {levelLabel} English
                </span>
              )}

              <dl className="mt-5 flex items-center justify-center gap-3 border-t border-line pt-4 text-sm">
                <dt className="eyebrow">ID No</dt>
                <dd className="font-mono font-medium text-ink">{user.id.slice(0, 8).toUpperCase()}</dd>
              </dl>

              {/* Le code-barres du membre */}
              <div className="mt-4 px-4">
                <Barcode seed={user.id} />
                <p className="mt-1.5 font-mono text-xs tracking-[0.3em] text-mute">
                  {user.id.slice(0, 12).toUpperCase()}
                </p>
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Motivate · Activate · Develop
              </p>
            </div>
          </article>
        </div>

        {/* ----- Mes informations ----- */}
        <div className="min-w-0 space-y-6">
          <Card className="anim-rise" style={delay(120)}>
            <SectionHeader title="About me" />
            <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <InfoItem icon={<MailIcon className="size-4" />} label="Email" value={user.email} />
              <InfoItem icon={<PhoneIcon className="size-4" />} label="Phone" value={profile.phone} />
              <InfoItem icon={<MapPinIcon className="size-4" />} label="Lives in" value={place} />
              <InfoItem icon={<CakeIcon className="size-4" />} label="Born" value={birthDate} />
            </dl>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="anim-rise" style={delay(160)}>
              <SectionHeader title="English level" />
              {levelLabel ? <LevelMeter level={profile.englishLevel} /> : <NotSet />}
            </Card>

            <Card className="anim-rise" style={delay(200)}>
              <SectionHeader title="What I do" />
              {occupations.length > 0 ? (
                <ul className="space-y-3">
                  {occupations.map((entry) => (
                    <li key={`${entry.label}-${entry.detail}`} className="flex gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand">
                        <BriefcaseIcon className="size-4" />
                      </span>
                      <span className="min-w-0 text-sm">
                        <span className="block font-semibold text-ink">{entry.label}</span>
                        {entry.detail && (
                          <span className="block break-words text-mute">{entry.detail}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <NotSet />
              )}
            </Card>
          </div>

          <Card className="anim-rise" style={delay(240)}>
            <div className="grid gap-6 md:grid-cols-2">
              <ChipGroup
                icon={<ChatIcon className="size-4" />}
                label="Languages I speak"
                values={profile.languages}
              />
              <ChipGroup
                icon={<HeartIcon className="size-4" />}
                label="What I like"
                values={profile.interests}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ---------- Petits morceaux ---------- */

function InfoItem({ icon, label, value }: { icon: ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex min-w-0 gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-blush text-mute">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-mute">{label}</dt>
        <dd className={`break-words text-sm ${value ? "font-medium text-ink" : "text-mute"}`}>
          {value ?? "Not added yet"}
        </dd>
      </div>
    </div>
  );
}

function ChipGroup({ icon, label, values }: { icon: ReactNode; label: string; values: string[] }) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="text-brand">{icon}</span>
        {label}
      </h3>
      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {values.map((value) => (
            <li key={value} className="chip">
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <NotSet />
      )}
    </div>
  );
}

function NotSet() {
  return (
    <p className="text-sm text-mute">
      Not added yet.{" "}
      <Link href="/profile/edit" className="font-medium text-brand underline-offset-2 hover:underline">
        Add it
      </Link>
    </p>
  );
}

/** Un code-barres décoratif, toujours le même pour un même membre. */
function Barcode({ seed }: { seed: string }) {
  const widths = Array.from({ length: 32 }, (_, index) => {
    const code = seed.charCodeAt(index % seed.length) + index;
    return (code % 3) + 1; // barres de 1 à 3 unités
  });
  return (
    <div aria-hidden className="flex h-10 items-stretch justify-center gap-0.5">
      {widths.map((width, index) => (
        <span
          key={index}
          className="bg-ink"
          style={{ width: `${width * 1.5}px`, opacity: index % 7 === 3 ? 0.7 : 1 }}
        />
      ))}
    </div>
  );
}
