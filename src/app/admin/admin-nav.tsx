"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Les onglets de l'espace admin, visibles sur toutes ses pages.
const TABS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/members", label: "Members", exact: false },
  { href: "/admin/events", label: "Events", exact: false },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="flex gap-2">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              active
                ? "bg-brand text-white shadow-md"
                : "bg-white text-zinc-600 shadow-sm ring-1 ring-black/5 hover:-translate-y-0.5 hover:text-brand"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
