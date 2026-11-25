import Link from "next/link";
import { GuideButton } from "@/components/guide-dialog";
import { MemberAvatar } from "@/components/member-avatar";
import { MemberTopBarShell } from "@/components/member-top-bar-shell";
import { getGuideSteps } from "@/lib/guide";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

/**
 * La barre du haut de l'espace membre (téléphone et tablette) :
 * ma photo et mon nom (→ mon profil), et le « ? » du guide.
 * Les gros titres des pages sont cachés sur ces écrans (voir PageHeader).
 */
export async function MemberTopBar() {
  const user = await getCurrentUser();
  if (!user) return <MemberTopBarShell />;
  const [profile, steps] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: user.id },
      select: { firstName: true, lastName: true, photoType: true },
    }),
    getGuideSteps(),
  ]);
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || user.name;

  return (
    <MemberTopBarShell>
      <Link href="/profile" aria-label="My profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-full pr-2">
        <span className="rounded-full bg-gradient-to-br from-accent to-brand p-[2px]">
          <MemberAvatar userId={user.id} name={name} hasPhoto={Boolean(profile?.photoType)} size="size-10" />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Welcome back</span>
          <span className="block truncate font-display text-base font-bold leading-tight text-white">{name}</span>
        </span>
      </Link>
      <GuideButton steps={steps} />
    </MemberTopBarShell>
  );
}
