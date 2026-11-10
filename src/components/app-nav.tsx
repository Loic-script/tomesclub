"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  BellIcon,
  CalendarIcon,
  HomeIcon,
  PeopleIcon,
  PhoneIcon,
  UserIcon,
} from "@/components/icons";

// La navigation principale.
// - Ordinateur : la liste verticale de la barre latérale.
// - Téléphone : la barre d'onglets fixée en bas (5 onglets).
// usePathname() lit l'adresse : ces composants doivent être dans un <Suspense>.
// Les versions "Static" servent de remplaçant pendant le chargement.

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** D'autres adresses qui allument aussi cet onglet. */
  alsoActiveOn?: string[];
  /** Montré dans la barre du bas sur téléphone ? */
  inTabBar: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: HomeIcon, inTabBar: true },
  { href: "/calls", label: "Calls", icon: PhoneIcon, alsoActiveOn: ["/members"], inTabBar: true },
  { href: "/rooms", label: "Rooms", icon: PeopleIcon, inTabBar: true },
  { href: "/events", label: "Events", icon: CalendarIcon, inTabBar: true },
  { href: "/notifications", label: "Notifications", icon: BellIcon, inTabBar: false },
  { href: "/profile", label: "Profile", icon: UserIcon, inTabBar: true },
];

function isActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  return [item.href, ...(item.alsoActiveOn ?? [])].some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

/* ---------- Barre latérale (ordinateur) ---------- */

export function SidebarNav({ badge }: { badge?: ReactNode }) {
  return <SidebarList pathname={usePathname()} badge={badge} />;
}

export function SidebarNavStatic() {
  return <SidebarList pathname={null} />;
}

function SidebarList({ pathname, badge }: { pathname: string | null; badge?: ReactNode }) {
  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
                active
                  ? "bg-brand-50 font-semibold text-brand"
                  : "font-medium text-mute hover:bg-blush hover:text-ink"
              }`}
            >
              <Icon
                className={`size-5 transition-colors ${
                  active ? "text-brand" : "text-mute group-hover:text-ink"
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {item.href === "/notifications" && badge}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Barre d'onglets (téléphone) ---------- */

export function MobileTabBar() {
  return <TabBar pathname={usePathname()} />;
}

export function MobileTabBarStatic() {
  return <TabBar pathname={null} />;
}

function TabBar({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {NAV_ITEMS.filter((item) => item.inTabBar).map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-1 text-xs transition-colors ${
                  active ? "font-semibold text-brand" : "font-medium text-mute hover:text-ink"
                }`}
              >
                {active && (
                  <span aria-hidden className="absolute inset-x-0 top-0 mx-auto h-0.5 w-8 rounded-full bg-brand" />
                )}
                <Icon className="size-6" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
