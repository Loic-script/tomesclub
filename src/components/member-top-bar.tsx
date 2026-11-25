import Link from "next/link";
import { MemberAvatar } from "@/components/member-avatar";
import { MemberTopBarShell, TopBarSignOut } from "@/components/member-top-bar-shell";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

/**
 * La barre du haut de l'espace membre (téléphone et tablette) :
 * ma photo et mon nom (→ mon profil), et le bouton Logout (le guide est dans le menu « + »).
 * Les gros titres des pages sont cachés sur ces écrans (voir PageHeader).
 */
export async function MemberTopBar() {
  const user = await getCurrentUser();
  if (!user) return <MemberTopBarShell />;
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { firstName: true, lastName: true, photoType: true },
  });
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || user.name;

  return (
    <MemberTopBarShell>
      <Link href="/profile" aria-label="My profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-full pr-2">
        <span className="rounded-full bg-gradient-to-br from-accent to-brand p-[2px]">
          <MemberAvatar userId={user.id} name={name} hasPhoto={Boolean(profile?.photoType)} size="size-10" />
        </span>
        {/* Le nom en entier (il passe à la ligne s'il est long, jamais coupé) */}
        <span className="min-w-0 break-words font-display text-[15px] font-bold leading-snug text-white">{name}</span>
      </Link>
      <TopBarSignOut />
    </MemberTopBarShell>
  );
}
