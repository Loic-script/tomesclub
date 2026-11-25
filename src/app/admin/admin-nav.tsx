"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { SideRail, type RailItem } from "@/components/side-rail";
import { adminSignOut } from "../(auth)/admin/login/actions";
import { BellIcon, BookIcon, CalendarIcon, ChatIcon, GridIcon, LogoutIcon, RoomIcon, UsersIcon } from "./admin-icons";

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
  { href: "/admin/guide", label: "Guide", icon: BookIcon, exact: false, badge: null },
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
              active ? "neu-inset text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            {/* Le petit trait orange de l'onglet actif */}
            {active && (
              <span aria-hidden className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-white" />
            )}
            <span
              className={`flex size-8 items-center justify-center rounded-xl transition ${
                active
                  ? "bg-gradient-to-br from-accent to-brand text-white shadow-lg shadow-brand/30"
                  : "bg-white/15 text-white/85 group-hover:text-white"
              }`}
            >
              <Icon className="size-[18px]" />
            </span>
            <span className="flex-1">{tab.label}</span>
            {unread > 0 && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-brand">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

const BOTTOM_ITEM =
  "relative flex flex-col items-center gap-0.5 rounded-full px-0.5 py-2 text-[10px] font-semibold leading-tight transition-all duration-300 sm:text-[11px]";

/** Un onglet de la barre du bas (icône + nom + pastille). */
function BottomTab({
  tab,
  pathname,
  badges,
  onClick,
}: {
  tab: (typeof TABS)[number];
  pathname: string;
  badges: AdminBadges;
  onClick?: () => void;
}) {
  const active = isActive(pathname, tab.href, tab.exact);
  const Icon = tab.icon;
  const unread = tab.badge && !(active && tab.badge !== "inbox" && tab.badge !== "messages") ? badges[tab.badge] : 0;
  return (
    <Link
      href={tab.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`${BOTTOM_ITEM} ${active ? "neu-inset text-accent" : "text-white/60 hover:-translate-y-0.5 hover:text-white"}`}
    >
      <Icon />
      {tab.label}
      {unread > 0 && <Dot count={unread} />}
    </Link>
  );
}

/** Se déconnecter de l'espace admin (dans la barre du bas, téléphone et tablette). */
function SignOutTab() {
  return (
    <form action={adminSignOut} className="flex-1">
      <button type="submit" className={`${BOTTOM_ITEM} w-full text-white/60 hover:-translate-y-0.5 hover:text-red-300`}>
        <LogoutIcon />
        Log out
      </button>
    </form>
  );
}

function Dot({ count }: { count: number }) {
  return (
    <span className="absolute right-[18%] top-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-4 text-navy">
      {count > 9 ? "9+" : count}
    </span>
  );
}

/**
 * Tablette : la barre du bas avec tous les onglets.
 * Téléphone : un rail sur le côté droit (flèche ‹ pour l'ouvrir), avec tous les onglets et Log out.
 */
export function AdminBottomLinks({ badges }: { badges: AdminBadges }) {
  const pathname = usePathname();
  const railItems: RailItem[] = [
    ...TABS.map((tab) => {
      const Icon = tab.icon;
      return {
        key: tab.href,
        label: tab.label,
        href: tab.href,
        icon: <Icon />,
        active: isActive(pathname, tab.href, tab.exact),
        badge: tab.badge ? badges[tab.badge] : 0,
      };
    }),
    {
      key: "logout",
      label: "Log out",
      icon: <LogoutIcon />,
      onClick: () => {
        void adminSignOut();
      },
    },
  ];

  return (
    <>
      <div className="admin-bottom-nav fixed inset-x-4 bottom-4 z-40 mx-auto max-w-xl max-sm:hidden lg:hidden">
        <nav aria-label="Admin sections" className="neu nav-glass rounded-full p-2">
          <ul className="flex items-center">
            {TABS.map((tab) => (
              <li key={tab.href} className="flex-1">
                <BottomTab tab={tab} pathname={pathname} badges={badges} />
              </li>
            ))}
            <li className="flex flex-1">
              <SignOutTab />
            </li>
          </ul>
        </nav>
      </div>

      {/* Téléphone : le rail (caché dans une discussion ouverte, comme la barre) */}
      <SideRail className="admin-bottom-nav sm:hidden" label="Admin sections" items={railItems} />
    </>
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
