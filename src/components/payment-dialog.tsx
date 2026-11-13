"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// La fenêtre de paiement MVola (salle privée, événement payant).
// 1. Envoyer l'argent au numéro MVola de l'admin.
// 2. Trouver la référence dans le SMS.
// 3. Donner la référence, OU une capture d'écran du paiement (ou les deux).
// L'admin vérifie ensuite et confirme.

/** Ce que le membre a donné comme preuve de paiement. */
export type PaymentDraft = { ref: string; proofId: string | null; proofPreview: string | null };

export function PaymentDialog({
  eyebrow,
  amountLabel,
  intro,
  mvola,
  receiver,
  initial,
  onCancel,
  onPaid,
}: {
  /** Le petit mot orange en haut, ex : "Private room" */
  eyebrow: string;
  /** Le montant, ex : "10 000 Ar" */
  amountLabel: string;
  intro: string;
  /** Le numéro MVola de l'admin (null = pas encore réglé) */
  mvola: string | null;
  receiver: string | null;
  initial: PaymentDraft | null;
  onCancel: () => void;
  onPaid: (value: PaymentDraft) => void;
}) {
  const [ref, setRef] = useState(initial?.ref ?? "");
  const [proofId, setProofId] = useState<string | null>(initial?.proofId ?? null);
  const [preview, setPreview] = useState<string | null>(initial?.proofPreview ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Échap ferme la fenêtre.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function copyNumber() {
    if (!mvola) return;
    try {
      await navigator.clipboard.writeText(mvola.replace(/\s+/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Le navigateur refuse : la personne recopie le numéro à la main.
    }
  }

  /** Envoie la capture tout de suite : on garde seulement son identifiant. */
  async function uploadProof(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose a picture (a screenshot of the payment).");
      return;
    }
    setUploading(true);
    try {
      const response = await fetch(`/api/payment-proofs?name=${encodeURIComponent(file.name || "payment.png")}`, {
        method: "POST",
        headers: { "content-type": file.type },
        body: file,
      });
      const data = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!response.ok || !data?.id) {
        setError(data?.error ?? "The picture was not sent. Try again.");
        return;
      }
      setProofId(data.id);
      setPreview(URL.createObjectURL(file));
    } catch {
      setError("No connection. Try again.");
    } finally {
      setUploading(false);
    }
  }

  const ready = (ref.trim().length >= 4 || proofId !== null) && !uploading && Boolean(mvola);

  // Sur la page entière (et pas dans une carte en verre, qui décalerait la fenêtre).
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pay ${amountLabel} with MVola`}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="anim-rise max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-white/15 bg-[#2a1238] p-5 shadow-2xl shadow-black/60 sm:rounded-[2rem] sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-white">Pay {amountLabel}</h2>
        <p className="mt-1 text-sm text-white/60">{intro}</p>

        {/* MVola */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#ffd400] to-[#f5b800] p-3.5 text-[#1b1b1b] shadow-lg">
          <Image src="/mvola.png" alt="MVola" width={40} height={40} className="size-10 shrink-0 rounded-xl object-cover shadow-sm" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold">Pay with MVola</span>
            <span className="block text-xs opacity-75">{receiver ? `To ${receiver}` : "To the Tomes Club admin"}</span>
          </span>
        </div>

        <ol className="mt-4 space-y-4 text-sm text-white/80">
          {/* 1. Envoyer */}
          <li className="flex gap-3">
            <Step n={1} />
            <span className="min-w-0 flex-1">
              Send <strong className="text-white">{amountLabel}</strong> by MVola to:
              {mvola ? (
                <span className="mt-1.5 flex items-center gap-2">
                  <code className="rounded-lg bg-black/30 px-2.5 py-1.5 font-mono text-base font-bold tracking-wide text-white">
                    {mvola}
                  </code>
                  <button
                    type="button"
                    onClick={copyNumber}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </span>
              ) : (
                <span className="mt-1 block text-xs text-amber-300">
                  The admin has not set the MVola number yet. Please ask the admin.
                </span>
              )}
            </span>
          </li>

          {/* 2. Le SMS */}
          <li className="flex gap-3">
            <Step n={2} />
            <span>Keep the confirmation SMS from MVola.</span>
          </li>

          {/* 3. La référence OU la capture */}
          <li className="flex gap-3">
            <Step n={3} />
            <div className="min-w-0 flex-1">
              <p>Give the reference, or a screenshot of the payment:</p>
              <input
                value={ref}
                onChange={(event) => setRef(event.target.value)}
                maxLength={60}
                placeholder="Reference, e.g. 1234567890"
                aria-label="Transaction reference"
                className="mt-2 w-full rounded-xl bg-black/30 px-3 py-2.5 font-mono text-sm text-white outline-none ring-1 ring-white/15 placeholder:text-white/30 focus:ring-2 focus:ring-accent/60"
              />

              <div className="my-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                <span className="h-px flex-1 bg-white/10" />
                or
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  void uploadProof(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              {preview ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-2 ring-1 ring-emerald-400/30">
                  {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local de la capture */}
                  <img src={preview} alt="Your payment screenshot" className="size-14 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1 text-xs text-emerald-100">Screenshot added ✓</span>
                  <button
                    type="button"
                    onClick={() => {
                      setProofId(null);
                      setPreview(null);
                    }}
                    className="rounded-full px-2.5 py-1 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/25 px-3 py-3 text-sm font-semibold text-white/75 transition hover:border-accent hover:text-white disabled:opacity-60"
                >
                  {uploading ? "Sending the picture..." : "Add a screenshot of the payment"}
                </button>
              )}
              {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
            </div>
          </li>
        </ol>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white/70 ring-1 ring-white/15 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={() => onPaid({ ref: ref.trim(), proofId, proofPreview: preview })}
            className="flex-1 rounded-full bg-gradient-to-r from-accent to-brand px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand/30 disabled:opacity-50"
          >
            I have paid
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-navy">
      {n}
    </span>
  );
}
