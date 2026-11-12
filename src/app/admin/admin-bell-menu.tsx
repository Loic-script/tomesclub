"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { BellIcon, CheckIcon, KindIcon, kindTone } from "./admin-icons";
import { markAllAdminReadAction } from "./notifications/actions";

export type BellItem = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  ago: string;
};

// Le bouton cloche et son petit panneau (les 6 dernières notifications).
export function AdminBellMenu({ unread, items }: { unread: number; items: BellItem[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const box = useRef<HTMLDivElement>(null);

  // Fermer avec Échap ou en cliquant ailleurs.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onClick = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unread > 0 ? `Notifications (${unread} new)` : "Notifications"}
        className={`neu-sm neu-btn relative flex size-11 shrink-0 items-center justify-center rounded-full transition ${
          open ? "text-accent" : "text-white/80 hover:text-white"
        }`}
      >
        <BellIcon />
        {unread > 0 && (
          <>
            <span aria-hidden className="anim-ping absolute -right-0.5 -top-0.5 size-5 rounded-full bg-accent/60" />
            <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-navy">
              {unread > 9 ? "9+" : unread}
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Latest notifications"
          className="anim-dropdown absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-3xl border border-white/15 bg-[#241238]/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <p className="flex-1 font-display text-base font-bold text-white">
              Notifications
              {unread > 0 && (
                <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-accent">
                  {unread} new
                </span>
              )}
            </p>
            {unread > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => markAllAdminReadAction())}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <CheckIcon className="size-3.5" />
                {pending ? "..." : "Mark read"}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-white/50">
              Nothing yet. New members, rooms and event sign-ups will show up here.
            </p>
          ) : (
            <ul className="max-h-[22rem] overflow-y-auto p-2">
              {items.map((item) => {
                const inside = (
                  <>
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${kindTone(item.kind)} text-white`}
                    >
                      <KindIcon kind={item.kind} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm font-semibold ${item.read ? "text-white/65" : "text-white"}`}>
                        {item.title}
                      </span>
                      {item.body && <span className="block truncate text-xs text-white/45">{item.body}</span>}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[10px] text-white/40">{item.ago}</span>
                      {!item.read && <span aria-label="New" className="size-2 rounded-full bg-accent" />}
                    </span>
                  </>
                );
                const row = "flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition hover:bg-white/[0.06]";
                return (
                  <li key={item.id}>
                    {item.link ? (
                      <Link href={item.link} onClick={() => setOpen(false)} className={row}>
                        {inside}
                      </Link>
                    ) : (
                      <div className={row}>{inside}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-white/10 px-4 py-3 text-center text-sm font-semibold text-accent transition hover:bg-white/[0.04]"
          >
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
