import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { delay, PageHeader } from "@/components/app-ui";
import { MemberAvatar } from "@/components/member-avatar";
import { SignOutButton } from "@/components/sign-out-button";
import { OCCUPATIONS } from "@/lib/onboarding-options";
import { getFullProfile } from "@/lib/profile";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Profile" };

// Page /profile : ma fiche, avec le bouton pour la modifier.
export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
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
            className="neu-sm neu-btn rounded-full px-4 py-2 text-sm font-semibold text-white"
          >
            Edit
          </Link>
        }
      />

      <div className="space-y-6">
        {/* ----- Le badge de membre, comme une carte d'identité du club ----- */}
        <div className="anim-pop mx-auto w-full max-w-xs" style={delay(150)}>
          <div className="relative overflow-hidden rounded-[1.75rem] bg-white pb-6 text-zinc-900 shadow-[0_26px_55px_-18px_rgba(0,0,0,0.65)]">
            {/* La fente du badge (pour le cordon) */}
            <div className="relative z-10 pt-4">
              <div className="mx-auto h-2.5 w-16 rounded-full bg-zinc-200 shadow-inner" />
            </div>

            {/* Le bandeau diagonal aux couleurs du club */}
            <svg
              aria-hidden
              viewBox="0 0 320 130"
              preserveAspectRatio="none"
              className="absolute inset-x-0 top-0 h-32 w-full"
            >
              <polygon points="0,0 320,0 320,52 0,118" fill="#9c0b3b" />
              <polygon points="0,0 320,0 320,30 0,86" fill="#2e3192" opacity="0.92" />
              <polygon points="210,0 320,0 320,66" fill="#f7944a" />
            </svg>

            {/* La photo */}
            <div className="relative z-10 mt-10 flex justify-center">
              <span className="rounded-full bg-white p-1.5 shadow-lg">
                <MemberAvatar
                  userId={user.id}
                  name={`${profile.firstName} ${profile.lastName}`}
                  hasPhoto={Boolean(profile.photoType)}
                  size="size-28"
                />
              </span>
            </div>

            {/* Nom, rôle, niveau */}
            <div className="relative z-10 mt-3 px-6 text-center">
              <h2 className="truncate font-display text-2xl font-bold text-navy">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-400">
                Tomes Club member
              </p>
              {profile.englishLevel && (
                <span className="mt-2 inline-block rounded-full bg-accent px-3 py-0.5 text-xs font-bold capitalize text-white shadow-sm">
                  {profile.englishLevel} english
                </span>
              )}
            </div>

            {/* Les infos, en lignes de badge */}
            <dl className="relative z-10 mt-5 space-y-2 border-t border-zinc-100 px-6 pt-4">
              <BadgeRow label="ID No" value={user.id.slice(0, 8).toUpperCase()} mono />
              <BadgeRow label="Email" value={user.email} />
              <BadgeRow label="Phone" value={profile.phone} />
              <BadgeRow
                label="Lives in"
                value={[profile.city, profile.country].filter(Boolean).join(", ") || null}
              />
              <BadgeRow label="Born" value={birthDate} />
              <BadgeRow
                label="Does"
                value={
                  occupations.length > 0
                    ? occupations.map((entry) => `${entry.label} — ${entry.detail}`).join(" · ")
                    : null
                }
              />
              <BadgeRow
                label="Speaks"
                value={profile.languages.length > 0 ? profile.languages.join(", ") : null}
              />
              <BadgeRow
                label="Likes"
                value={profile.interests.length > 0 ? profile.interests.join(", ") : null}
              />
            </dl>

            {/* Le code-barres du membre */}
            <div className="relative z-10 mt-5 px-10">
              <Barcode seed={user.id} />
              <p className="mt-1 text-center font-mono text-[10px] tracking-[0.3em] text-zinc-400">
                {user.id.slice(0, 12).toUpperCase()}
              </p>
            </div>

            {/* Pied du badge */}
            <p className="relative z-10 mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-brand/70">
              Motivate · Activate · Develop
            </p>
          </div>
        </div>

        <div className="anim-rise flex justify-center gap-3 pt-1" style={delay(400)}>
          <SignOutButton className="neu-sm neu-btn rounded-full px-6 py-2.5 font-semibold text-white/85 disabled:opacity-60" />
        </div>
      </div>
    </>
  );
}

/** Une ligne d'information du badge. */
function BadgeRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <dt className="w-16 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className={`min-w-0 flex-1 truncate text-zinc-800 ${mono ? "font-mono" : "font-medium"}`}>
        {value}
      </dd>
    </div>
  );
}

/** Un code-barres décoratif, toujours le même pour un même membre. */
function Barcode({ seed }: { seed: string }) {
  const widths = Array.from({ length: 32 }, (_, index) => {
    const code = seed.charCodeAt(index % seed.length) + index;
    return (code % 3) + 1; // barres de 1 à 3 unités
  });
  return (
    <div aria-hidden className="flex h-10 items-stretch justify-center gap-[2px]">
      {widths.map((width, index) => (
        <span
          key={index}
          className="bg-zinc-900"
          style={{ width: `${width * 1.5}px`, opacity: index % 7 === 3 ? 0.75 : 1 }}
        />
      ))}
    </div>
  );
}

