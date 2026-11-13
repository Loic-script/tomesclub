"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MemberAvatar } from "@/components/member-avatar";
import { MvolaLogo } from "@/components/payment-dialog";

// La petite fenêtre "Payment check" de l'admin : qui a payé, combien, la référence MVola
// et la capture d'écran en grand. Les boutons (confirmer, refuser...) viennent de l'écran qui l'ouvre.

export type PaymentCheck = {
  /** Le membre qui a payé */
  memberId: string | null;
  memberName: string;
  hasPhoto: boolean;
  /** Pour quoi : "Event · TG" ou "Private room · Debate" */
  context: string;
  amountLabel: string;
  reference: string | null;
  proofId: string | null;
  /** Déjà confirmé par l'admin ? */
  confirmed: boolean;
};

export function PaymentCheckDialog({
  check,
  onClose,
  actions,
}: {
  check: PaymentCheck;
  onClose: () => void;
  /** Les boutons du bas */
  actions: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const proofUrl = check.proofId ? `/api/payment-proofs/${check.proofId}` : null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copyReference() {
    if (!check.reference) return;
    try {
      await navigator.clipboard.writeText(check.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Le navigateur refuse : l'admin peut sélectionner le texte.
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Payment check"
        className="anim-pop flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#22102f] text-white shadow-2xl shadow-black/60"
      >
        {/* En-tête jaune MVola */}
        <div className="relative flex items-center gap-3 bg-gradient-to-br from-[#ffd400] to-[#f5b800] px-4 py-3.5 text-[#1b1b1b]">
          <MvolaLogo size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Payment check</p>
            <p className="truncate text-sm font-extrabold">{check.context}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full bg-black/10 transition hover:bg-black/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden className="size-4">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto p-4">
          {/* Qui, combien, statut */}
          <div className="flex items-center gap-3">
            {check.memberId ? (
              <MemberAvatar userId={check.memberId} name={check.memberName} hasPhoto={check.hasPhoto} size="size-11" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{check.memberName}</p>
              <span
                className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  check.confirmed ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"
                }`}
              >
                <span className={`size-1.5 rounded-full ${check.confirmed ? "bg-emerald-300" : "bg-amber-300"}`} />
                {check.confirmed ? "Payment confirmed" : "Waiting for your check"}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Amount</p>
              <p className="font-display text-xl font-extrabold tabular-nums">{check.amountLabel}</p>
            </div>
          </div>

          {/* La référence */}
          <div className="rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">MVola reference</p>
            {check.reference ? (
              <div className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate font-mono text-base font-bold tracking-wide">{check.reference}</code>
                <button
                  type="button"
                  onClick={copyReference}
                  className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/15"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            ) : (
              <p className="mt-1 text-sm text-white/45">No reference given.</p>
            )}
          </div>

          {/* La capture */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">Screenshot</p>
            {proofUrl && !imageError ? (
              <a
                href={proofUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative block overflow-hidden rounded-2xl bg-black/30 ring-1 ring-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- image privée servie par notre API */}
                <img
                  src={proofUrl}
                  alt="Payment screenshot"
                  onError={() => setImageError(true)}
                  className="max-h-80 w-full object-contain"
                />
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold opacity-0 backdrop-blur transition group-hover:opacity-100">
                  Open full size ↗
                </span>
              </a>
            ) : (
              <p className="rounded-2xl border border-dashed border-white/15 px-3 py-6 text-center text-sm text-white/45">
                {proofUrl ? "The screenshot could not be loaded." : "No screenshot given."}
              </p>
            )}
          </div>

          <p className="text-xs leading-relaxed text-white/45">
            Check on your MVola phone that this payment really arrived before confirming.
          </p>
        </div>

        <div className="flex gap-2 border-t border-white/10 p-3">{actions}</div>
      </div>
    </div>,
    document.body,
  );
}
