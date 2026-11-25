"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Ce que la fenêtre montre d'un événement. */
export type EventDetails = {
  title: string;
  description: string | null;
  /** Ex : « Saturday 28 November · 20:30 » */
  dateLabel: string | null;
  priceLabel: string;
  isPaid: boolean;
  imageUrl: string | null;
};

/** true seulement dans le navigateur (createPortal a besoin de document). */
const useClient = () => useSyncExternalStore(() => () => {}, () => true, () => false);

/**
 * La fenêtre d'un événement : l'image entière, la date, le prix et la description complète.
 * En bas : le bouton d'action (ex : « Register ») ou seulement « Close ».
 * Téléphone : elle monte du bas ; ordinateur : au centre.
 */
export function EventDetailsSheet({
  details,
  onClose,
  action,
}: {
  details: EventDetails;
  onClose: () => void;
  /** Le bouton principal en bas (absent : seulement « Close »). */
  action?: ReactNode;
}) {
  const client = useClient();

  // Échap ferme ; la page derrière ne défile plus.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  if (!client) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={details.title}
        onClick={(event) => event.stopPropagation()}
        className="anim-rise flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-gradient-to-b from-[#2b1650] to-[#3d0b28] text-white shadow-2xl ring-1 ring-white/10 sm:max-w-md sm:rounded-[2rem]"
      >
        {/* L'image, entière */}
        <div className="relative shrink-0">
          {details.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- image privée servie par notre API
            <img src={details.imageUrl} alt="" className="max-h-64 w-full object-cover" />
          ) : (
            <div className="h-28 bg-[linear-gradient(135deg,#2e3192,#7a082e_55%,#9c0b3b)]" />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/45 text-xl text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-black/60"
          >
            ×
          </button>
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-lg ${
              details.isPaid ? "bg-accent text-navy" : "bg-emerald-500 text-white"
            }`}
          >
            {details.priceLabel}
          </span>
        </div>

        {/* Le texte complet */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 pt-4">
          {details.dateLabel && (
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
                <rect x="3.5" y="5" width="17" height="15" rx="3" />
                <path d="M8 3v4M16 3v4M3.5 10h17" />
              </svg>
              {details.dateLabel}
            </p>
          )}
          <h2 className="mt-1.5 break-words font-display text-2xl font-bold leading-tight">{details.title}</h2>
          {details.description ? (
            <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-white/80">{details.description}</p>
          ) : (
            <p className="mt-3 text-sm text-white/50">No description yet.</p>
          )}
        </div>

        {/* L'action */}
        <div className="shrink-0 space-y-2 border-t border-white/10 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {action}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            {action ? "Not now" : "Close"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Le petit bouton « See details » sous le titre d'une carte : ouvre la fenêtre (sans s'inscrire). */
export function EventDetailsButton({ details }: { details: EventDetails }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-accent transition hover:text-white"
      >
        See details
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden>
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
      {open && <EventDetailsSheet details={details} onClose={() => setOpen(false)} />}
    </>
  );
}
