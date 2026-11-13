"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BellIcon, CalendarIcon, ChatIcon, GridIcon, RoomIcon, UsersIcon } from "./admin-icons";

/** Les pastilles : notifications pas lues + messages pas lus. */
export type AdminBadges = {
  inbox: number;
  messages: number;
  overview: number;
  members: number;
  rooms: number;
  events: number;
};

// Les onglets de l'espace admin : barre latérale (ordinateur) ou barre du bas (téléphone).
const TABS = [
  { href: "/admin", label: "Overview", icon: GridIcon, exact: true, badge: "overview" },
  { href: "/admin/members", label: "Members", icon: UsersIcon, exact: false, badge: "members" },
  { href: "/admin/rooms", label: "Rooms", icon: RoomIcon, exact: false, badge: "rooms" },
  { href: "/admin/events", label: "Events", icon: CalendarIcon, exact: false, badge: "events" },
  { href: "/admin/messages", label: "Messages", icon: ChatIcon, exact: false, badge: "messages" },
  { href: "/admin/notifications", label: "Inbox", icon: BellIcon, exact: false, badge: "inbox" },
] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Les liens de la barre latérale (grand écran). */
export function AdminSideLinks({ badges }: { badges: AdminBadges }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="space-y-1.5">
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.href, tab.exact);
        const Icon = tab.icon;
        const unread = tab.badge && !(active && tab.badge !== "inbox" && tab.badge !== "messages") ? badges[tab.badge] : 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent/60 ${
              active ? "neu-inset text-white" : "text-white/60 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {/* Le petit trait orange de l'onglet actif */}
            {active && (
              <span aria-hidden className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-accent" />
            )}
            <span
              className={`flex size-8 items-center justify-center rounded-xl transition ${
                active
                  ? "bg-gradient-to-br from-accent to-brand text-white shadow-lg shadow-brand/30"
                  : "bg-white/[0.06] text-white/70 group-hover:text-white"
              }`}
            >
              <Icon className="size-[18px]" />
            </span>
            <span className="flex-1">{tab.label}</span>
            {unread > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-navy">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** La barre du bas (téléphone et tablette), comme dans l'espace membre. */
export function AdminBottomLinks({ badges }: { badges: AdminBadges }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin sections"
      className="neu fixed inset-x-2 bottom-4 z-40 mx-auto max-w-md rounded-full p-1.5 sm:inset-x-4 sm:p-2 lg:hidden"
    >
      <ul className="flex items-center justify-between">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href, tab.exact);
          const Icon = tab.icon;
          const unread = tab.badge && !(active && tab.badge !== "inbox" && tab.badge !== "messages") ? badges[tab.badge] : 0;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 rounded-full px-0.5 py-2 text-[9px] min-[400px]:text-[10px] font-semibold leading-tight transition-all duration-300 sm:text-[11px] ${
                  active ? "neu-inset text-accent" : "text-white/60 hover:-translate-y-0.5 hover:text-white"
                }`}
              >
                <Icon />
                {tab.label}
                {unread > 0 && (
                  <span className="absolute right-[18%] top-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-navy">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Les nouvelles notifications arrivent toutes seules : la page se met à jour
 * toutes les 30 secondes (seulement si l'onglet est visible).
 */
export function AdminLiveRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}
