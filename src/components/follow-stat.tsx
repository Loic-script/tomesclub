"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MemberAvatar } from "@/components/member-avatar";

export type FollowPerson = { id: string; name: string; hasPhoto: boolean };

/** true seulement dans le navigateur (createPortal a besoin de document). */
const useClient = () => useSyncExternalStore(() => () => {}, () => true, () => false);

/**
 * Une case « Followers » ou « Following » : on la touche → la liste des personnes s'ouvre
 * (fenêtre en bas sur téléphone, au centre sur ordinateur).
 * Sert dans l'admin (fiche d'un membre) et sur ma page Profile.
 */
export function FollowStat({
  label,
  icon,
  people,
  total,
  emptyText,
  hrefBase = "/admin/members/",
  variant = "card",
}: {
  label: string;
  icon: ReactNode;
  people: FollowPerson[];
  total: number;
  emptyText: string;
  /** Le début du lien vers la fiche d'une personne (admin ou espace membre). */
  hrefBase?: string;
  /** card = grande case (admin) ; pill = petit bouton (page Profile). */
  variant?: "card" | "pill";
}) {
  const client = useClient();
  const [open, setOpen] = useState(false);

  // Échap ferme la liste.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {variant === "pill" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="neu-btn group flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-white"
        >
          <span className="font-display text-xl font-extrabold tabular-nums">{total}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/60 group-hover:text-accent">{label}</span>
        </button>
      ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="neu-inset group w-full rounded-2xl p-4 text-left transition hover:bg-white/[0.06] max-sm:text-center"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/45 max-sm:justify-center">
          {icon}
          {label}
        </span>
        <span className="mt-1 block font-display text-2xl font-extrabold tabular-nums text-white">{total}</span>
        <span className="mt-1 block text-[10px] font-semibold text-accent/80 group-hover:text-accent">See the list →</span>
      </button>
      )}

      {open &&
        client &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={label}
              onClick={(event) => event.stopPropagation()}
              className="anim-rise flex max-h-[80dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-gradient-to-b from-[#2e1a52] to-[#3a0d2a] text-white shadow-2xl sm:max-w-md sm:rounded-[1.75rem]"
            >
              <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white/80">{icon}</span>
                <p className="min-w-0 flex-1 font-display text-lg font-bold">
                  {label} <span className="text-white/45">· {total}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex size-9 items-center justify-center rounded-full text-xl text-white/60 hover:bg-white/10 hover:text-white"
                >
                  ×
                </button>
              </header>

              {people.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-white/55">{emptyText}</p>
              ) : (
                <ul className="min-h-0 flex-1 divide-y divide-white/[0.07] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
                  {people.map((person) => (
                    <li key={person.id}>
                      <Link
                        href={`${hrefBase}${person.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.06]"
                      >
                        <MemberAvatar userId={person.id} name={person.name} hasPhoto={person.hasPhoto} size="size-10" />
                        <span className="min-w-0 flex-1 break-words text-sm font-semibold">{person.name}</span>
                        <span aria-hidden className="text-white/35">›</span>
                      </Link>
                    </li>
                  ))}
                  {total > people.length && (
                    <li className="px-5 py-3 text-center text-xs text-white/45">
                      + {total - people.length} more
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
