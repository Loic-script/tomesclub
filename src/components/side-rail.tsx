"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type RailItem = {
  key: string;
  label: string;
  icon: ReactNode;
  /** Un lien (sinon : un bouton avec onClick). */
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
};

/**
 * Téléphone : la navigation devient un rail sur le côté droit.
 * Fermé : une petite languette avec une flèche ‹ (en petits carrés dégradés).
 * Ouvert : le rail glisse depuis la droite avec TOUS les menus (pas de « + »),
 * les menus arrivent l'un après l'autre. On ferme avec la flèche ›, en touchant
 * à côté, avec Échap, en glissant vers la droite, ou en choisissant un menu.
 */
export function SideRail({ items, label, className = "" }: { items: RailItem[]; label: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const touchX = useRef<number | null>(null);
  const totalBadge = items.reduce((sum, item) => sum + (item.active ? 0 : (item.badge ?? 0)), 0);

  // Une nouvelle page : le rail se referme.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Échap ferme le rail.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Glisser du doigt : vers la gauche ouvre, vers la droite ferme.
  const onTouchStart = (event: React.TouchEvent) => {
    touchX.current = event.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (dx < -35) setOpen(true);
    if (dx > 35) setOpen(false);
  };

  return (
    <div className={className}>
      {/* Le voile derrière : toucher à côté referme */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[65] bg-[#0b0618]/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={`fixed right-0 top-1/2 z-[70] flex -translate-y-1/2 items-center transition-transform duration-500 ease-[cubic-bezier(0.22,1.2,0.36,1)] ${
          open ? "translate-x-0" : "translate-x-[calc(100%-2.5rem)]"
        }`}
      >
        {/* La languette avec la flèche */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close the menu" : "Open the menu"}
          className="rail-handle relative flex h-16 w-10 shrink-0 items-center justify-center rounded-l-2xl border border-r-0 border-white/15 bg-[#1a1240]/90 shadow-[-10px_0_30px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md"
        >
          <span className={`transition-transform duration-500 ${open ? "rotate-180" : "rail-nudge"}`}>
            <PixelArrow />
          </span>
          {!open && totalBadge > 0 && (
            <span className="absolute -left-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-5 text-navy ring-2 ring-[#1a1240]">
              {totalBadge > 9 ? "9+" : totalBadge}
            </span>
          )}
        </button>

        {/* Le rail */}
        <nav
          aria-label={label}
          inert={!open}
          className="nav-glass max-h-[calc(100dvh-2rem)] w-[5.5rem] overflow-y-auto rounded-l-[1.75rem] border border-r-0 border-white/15 py-2.5 shadow-[-18px_0_45px_-18px_rgba(0,0,0,0.85)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex flex-col gap-1 px-1.5">
            {items.map((item, index) => (
              <li
                key={item.key}
                style={{ "--i": index } as CSSProperties}
                className={`transition-all duration-500 [transition-delay:calc(var(--i)*40ms+80ms)] ${
                  open ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
                }`}
              >
                <RailEntry item={item} onPick={() => setOpen(false)} />
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function RailEntry({ item, onPick }: { item: RailItem; onPick: () => void }) {
  const look = item.active
    ? "bg-gradient-to-br from-accent to-brand text-white shadow-lg shadow-black/30"
    : "text-white/65 hover:bg-white/10 hover:text-white active:scale-95";
  const inside = (
    <>
      {item.active && (
        <span aria-hidden className="absolute -left-1.5 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_rgba(247,148,74,0.9)]" />
      )}
      <span className="relative">
        {item.icon}
        {!!item.badge && !item.active && (
          <span className="absolute -right-2.5 -top-2 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-4 text-navy ring-2 ring-[#2a1238]">
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        )}
      </span>
      <span className="mt-1 text-[10px] font-semibold leading-tight">{item.label}</span>
    </>
  );
  const shell = `relative flex w-full flex-col items-center rounded-2xl px-1 py-2.5 transition-all duration-300 ${look}`;
  return item.href ? (
    <Link href={item.href} onClick={onPick} aria-current={item.active ? "page" : undefined} className={shell}>
      {inside}
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => {
        onPick();
        item.onClick?.();
      }}
      className={shell}
    >
      {inside}
    </button>
  );
}

/** La flèche ‹ faite de petits carrés, en dégradé (rose → violet → bleu). */
function PixelArrow() {
  // Les carrés : la pointe à gauche, la tige au milieu.
  const cells: [number, number][] = [
    [3, 0], [2, 1], [1, 2], [0, 3],
    [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3],
    [1, 4], [2, 5], [3, 6],
  ];
  return (
    <svg viewBox="-0.3 -0.3 7.6 7.6" className="size-7 drop-shadow-[0_0_6px_rgba(166,107,255,0.6)]" aria-hidden>
      <defs>
        <linearGradient id="rail-arrow" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="7" y2="7">
          <stop offset="0%" stopColor="#ff5a8a" />
          <stop offset="50%" stopColor="#a66bff" />
          <stop offset="100%" stopColor="#4fb3ff" />
        </linearGradient>
      </defs>
      {cells.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x + 0.12}
          y={y + 0.12}
          width={0.76}
          height={0.76}
          rx={0.12}
          fill="url(#rail-arrow)"
          fillOpacity={0.18}
          stroke="url(#rail-arrow)"
          strokeWidth={0.3}
        />
      ))}
    </svg>
  );
}
