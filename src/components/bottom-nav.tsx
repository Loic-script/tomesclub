"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { SideRail, type RailItem } from "@/components/side-rail";
import { GuideDialog } from "@/components/guide-dialog";
import { GuideQuestionIcon } from "@/components/guide-icons";
import { authClient } from "@/lib/auth-client";
import type { GuideStepData } from "@/lib/guide-defaults";

// La navigation : barre du bas (tablette, ordinateur) ; rail sur le côté droit (téléphone).
const TABS = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/calls", label: "Calls", icon: PhoneIcon },
  { href: "/rooms", label: "Rooms", icon: RoomsIcon },
  { href: "/events", label: "Events", icon: CalendarIcon },
  { href: "/notifications", label: "Alerts", icon: BellIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function BottomNav({ guideSteps = [] }: { guideSteps?: GuideStepData[] }) {
  const pathname = usePathname();
  const router = useRouter();
  // Le guide « How it works »
  const [guideOpen, setGuideOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { unread, tabs } = useUnreadCount(pathname);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  /** La pastille d'un menu (Alerts = le total ; rien sur le menu ouvert). */
  const badgeOf = (href: string) =>
    href === "/notifications" ? unread : isActive(href) ? 0 : (tabs[TAB_KEY[href] ?? ""] ?? 0);

  /** Un onglet de la barre du bas : icône + nom + pastille. */
  const renderTab = (tab: { href: string; label: string; icon: () => ReactElement }) => {
    const active = isActive(tab.href);
    const Icon = tab.icon;
    const count = badgeOf(tab.href);
    return (
      <Link
        href={tab.href}
        aria-current={active ? "page" : undefined}
        className={`${ITEM} ${active ? "neu-inset text-accent" : "text-white/60 hover:-translate-y-0.5 hover:text-white"}`}
      >
        <span className="relative">
          <Icon />
          {count > 0 && <Badge count={count} />}
        </span>
        {tab.label}
      </Link>
    );
  };

  // Téléphone : tous les menus dans le rail de droite (le Logout est dans la barre bleue du haut).
  const railItems: RailItem[] = [
    ...ALL_TABS.map((tab) => {
      const Icon = tab.icon;
      return {
        key: tab.href,
        label: tab.label,
        href: tab.href,
        icon: <Icon />,
        active: isActive(tab.href),
        badge: badgeOf(tab.href),
      };
    }),
    {
      key: "guide",
      label: "Guide",
      icon: <GuideQuestionIcon className="size-5 text-accent" />,
      onClick: () => setGuideOpen(true),
    },
  ];

  return (
    <>
      {/* Tablette et ordinateur : la barre du bas, avec tous les menus */}
      <div className="fixed inset-x-4 bottom-4 z-20 mx-auto max-w-xl max-sm:hidden">
        <nav aria-label="Main" className="neu nav-glass rounded-full p-2">
          <ul className="flex items-center justify-between gap-1">
            {ALL_TABS.map((tab) => (
              <li key={tab.href} className="flex-1">
                {renderTab(tab)}
              </li>
            ))}
            {/* Tablette : le guide ici (Logout est dans la barre bleue du haut) */}
            <li className="flex-1 lg:hidden">
              <GuideTab onClick={() => setGuideOpen(true)} />
            </li>
            {/* Ordinateur : Logout (pas de barre bleue sur grand écran) */}
            <li className="flex-1 max-lg:hidden">
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className={`${ITEM} w-full text-white/60 hover:-translate-y-0.5 hover:text-accent disabled:opacity-60`}
              >
                <LogoutIcon />
                {signingOut ? "..." : "Logout"}
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Téléphone : le rail sur le côté droit */}
      <SideRail className="sm:hidden" label="Main" items={railItems} />

      <GuideDialog steps={guideSteps} open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}

/** L'onglet « Guide » (le ?) : ouvre la fenêtre « How it works ». */
function GuideTab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="How Tomes Club works"
      className={`${ITEM} w-full text-white/60 hover:-translate-y-0.5 hover:text-accent`}
    >
      <GuideQuestionIcon className="size-5 text-accent" />
      Guide
    </button>
  );
}

/** Le style commun des boutons de la barre. */
const ITEM =
  "flex flex-col items-center gap-0.5 rounded-full px-2 py-2 text-[11px] font-semibold leading-tight transition-all duration-300";

/** La liste des membres. */
const MEMBERS_TAB = { href: "/members", label: "Members", icon: MembersIcon } as const;

/** Tous les menus, dans l'ordre (Members après Events). */
const ALL_TABS = [...TABS.slice(0, 4), MEMBERS_TAB, ...TABS.slice(4)];

function MembersIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="7.5" r="3" />
      <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="5" cy="10" r="2.1" />
      <path d="M1.8 17.5a3.6 3.6 0 0 1 4-3" />
      <circle cx="19" cy="10" r="2.1" />
      <path d="M22.2 17.5a3.6 3.6 0 0 0-4-3" />
    </svg>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} new`}
      className="absolute -right-2.5 -top-2 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-4 text-navy ring-2 ring-[#2a1238]"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/**
 * Le nombre de notifications pas lues : relu à chaque changement de page
 * et toutes les 30 secondes (seulement si l onglet est visible).
 */
/** Le menu et sa clé dans les pastilles (voir MEMBER_TAB_KINDS). */
const TAB_KEY: Record<string, string> = { "/home": "home", "/calls": "calls", "/rooms": "rooms", "/events": "events" };

function useUnreadCount(pathname: string): { unread: number; tabs: Record<string, number> } {
  const [unread, setUnread] = useState(0);
  const [tabs, setTabs] = useState<Record<string, number>>({});
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/notifications/unread", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { unread?: number; tabs?: Record<string, number> | null };
        if (alive) {
          setUnread(data.unread ?? 0);
          setTabs(data.tabs ?? {});
        }
      } catch {
        // Pas de réseau : on réessaie au prochain tour.
      }
    };
    void load();
    const timer = setInterval(load, 30 * 1000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [pathname]);
  return { unread, tabs };
}

/* Icônes fines (traits blancs) */

const iconProps = {
  viewBox: "0 0 24 24",
  className: "size-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function LogoutIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" />
      <path d="M10 8l-4 4 4 4M6 12h10" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v10h4.5v-5.5h3V20H18V10" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg {...iconProps}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9Z" />
    </svg>
  );
}

function RoomsIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 19a6.2 6.2 0 0 1 12.4 0" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M15.6 14.5a4.9 4.9 0 0 1 5.6 4.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg {...iconProps}>
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M10.5 20a2 2 0 0 0 3 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
