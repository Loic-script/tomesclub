"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

// La barre de navigation en bas, style application mobile (pilule en verre).
const TABS = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/calls", label: "Calls", icon: PhoneIcon },
  { href: "/rooms", label: "Rooms", icon: RoomsIcon },
  { href: "/events", label: "Events", icon: CalendarIcon },
  { href: "/notifications", label: "Alerts", icon: BellIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const unread = useUnreadCount(pathname);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav
      aria-label="Main"
      className="neu fixed inset-x-2 bottom-4 z-20 mx-auto max-w-md rounded-full p-1.5 sm:inset-x-4 sm:p-2"
    >
      <ul className="flex items-center justify-between gap-0 sm:gap-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-full px-0.5 py-2 text-[9px] min-[400px]:text-[10px] font-semibold leading-tight transition-all duration-300 sm:px-3 sm:text-[11px] ${
                  active
                    ? "neu-inset text-accent"
                    : "text-white/60 hover:-translate-y-0.5 hover:text-white"
                }`}
              >
                <span className="relative">
                  <Icon />
                  {tab.href === "/notifications" && unread > 0 && (
                    <span
                      aria-label={`${unread} new`}
                      className="absolute -right-2.5 -top-2 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-4 text-navy ring-2 ring-[#2a1238]"
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}

        {/* Se déconnecter, directement depuis la barre */}
        <li className="flex-1">
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="flex w-full flex-col items-center gap-0.5 rounded-full px-0.5 py-2 text-[9px] min-[400px]:text-[10px] font-semibold leading-tight text-white/60 transition-all duration-300 hover:-translate-y-0.5 hover:text-accent disabled:opacity-60 sm:px-3 sm:text-[11px]"
          >
            <LogoutIcon />
            {signingOut ? "..." : "Logout"}
          </button>
        </li>
      </ul>
    </nav>
  );
}

/**
 * Le nombre de notifications pas lues : relu à chaque changement de page
 * et toutes les 30 secondes (seulement si l onglet est visible).
 */
function useUnreadCount(pathname: string): number {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/notifications/unread", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { unread?: number };
        if (alive) setUnread(data.unread ?? 0);
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
  return unread;
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
