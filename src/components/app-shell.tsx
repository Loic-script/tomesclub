import Image from "next/image";
import Link from "next/link";
import { cache, Suspense } from "react";
import { MobileTabBar, MobileTabBarStatic, SidebarNav, SidebarNavStatic } from "@/components/app-nav";
import { LogoutIcon } from "@/components/icons";
import { MemberAvatar } from "@/components/member-avatar";
import {
  NotificationBell,
  NotificationBellFallback,
  UnreadBadge,
} from "@/components/notification-bell";
import { SignOutButton } from "@/components/sign-out-button";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// La coque de l'espace membre :
// - ordinateur (≥ 1024 px) : barre latérale fixe à gauche ;
// - téléphone et tablette : barre du haut (logo, cloche, avatar) + onglets en bas.

/** Le membre connecté, pour l'avatar de la coque (lu une fois par requête). */
const getShellMember = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { firstName: true, lastName: true, photoType: true },
  });
  return {
    id: user.id,
    name: profile ? `${profile.firstName} ${profile.lastName}`.trim() : user.name,
    firstName: profile?.firstName ?? user.name,
    email: user.email,
    hasPhoto: Boolean(profile?.photoType),
  };
});

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/home" className="flex min-w-0 items-center gap-2.5 rounded-xl">
      <Image
        src="/logo.png"
        alt=""
        width={compact ? 32 : 36}
        height={compact ? 32 : 36}
        className="shrink-0 rounded-full ring-1 ring-line"
        priority
      />
      <span className="min-w-0">
        <span className="block truncate font-display text-base font-semibold leading-tight text-ink">
          Tomes Club
        </span>
        {!compact && (
          <span className="block truncate text-xs text-mute">English speaking club</span>
        )}
      </span>
    </Link>
  );
}

/* ---------- Ordinateur ---------- */

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-18 shrink-0 items-center px-5">
        <Brand />
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-4">
        <Suspense fallback={<SidebarNavStatic />}>
          <SidebarNav
            badge={
              <Suspense fallback={null}>
                <UnreadBadge />
              </Suspense>
            }
          />
        </Suspense>
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <Suspense fallback={<div className="h-14 animate-pulse rounded-xl bg-blush" />}>
          <SidebarMember />
        </Suspense>
      </div>
    </aside>
  );
}

async function SidebarMember() {
  const member = await getShellMember();
  if (!member) return null;
  return (
    <div className="flex items-center gap-1">
      <Link
        href="/profile"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-blush"
      >
        <MemberAvatar userId={member.id} name={member.name} hasPhoto={member.hasPhoto} size="size-9" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{member.name}</span>
          <span className="block truncate text-xs text-mute">{member.email}</span>
        </span>
      </Link>
      <SignOutButton
        className="btn btn-ghost btn-icon"
        label="Sign out"
        labelClassName="sr-only"
        icon={<LogoutIcon />}
      />
    </div>
  );
}

/* ---------- Téléphone et tablette ---------- */

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur lg:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Brand compact />
        <div className="ml-auto flex items-center gap-1">
          <Suspense fallback={<NotificationBellFallback />}>
            <NotificationBell />
          </Suspense>
          <Suspense fallback={<span className="size-8 rounded-full bg-blush" />}>
            <TopBarAvatar />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function TopBarAvatar() {
  const member = await getShellMember();
  if (!member) return null;
  return (
    <Link href="/profile" aria-label="My profile" className="ml-1 rounded-full">
      <MemberAvatar userId={member.id} name={member.name} hasPhoto={member.hasPhoto} size="size-8" />
    </Link>
  );
}

export function MobileNav() {
  return (
    <Suspense fallback={<MobileTabBarStatic />}>
      <MobileTabBar />
    </Suspense>
  );
}
