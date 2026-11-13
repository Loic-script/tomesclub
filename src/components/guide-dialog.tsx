"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { GuideIcon, GuideQuestionIcon } from "@/components/guide-icons";
import type { GuideStepData } from "@/lib/guide-defaults";

// La fenêtre "How it works" : une étape à la fois, avec des points pour avancer,
// les flèches du clavier et Échap pour fermer.

/** true seulement dans le navigateur (createPortal a besoin de document). */
function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function GuideDialog({
  steps,
  open,
  onClose,
}: {
  steps: GuideStepData[];
  open: boolean;
  onClose: () => void;
}) {
  const isClient = useIsClient();
  const [index, setIndex] = useState(0);
  const last = steps.length - 1;
  const current = Math.min(index, last);
  const step = steps[current];

  function close() {
    setIndex(0);
    onClose();
  }

  // Clavier : Échap ferme, flèches pour avancer / reculer.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIndex(0);
        onClose();
      } else if (event.key === "ArrowRight")
        setIndex((value) => Math.min(value + 1, steps.length - 1));
      else if (event.key === "ArrowLeft")
        setIndex((value) => Math.max(value - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, steps.length]);

  if (!isClient || !open || !step) return null;

  return createPortal(
    <div
      className="on-dark fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        className="neu nav-glass anim-pop relative w-full max-w-md overflow-hidden rounded-[2rem] p-6 sm:p-7"
      >
        {/* Lueur douce derrière l'icône */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 size-48 rounded-full bg-accent/20 blur-3xl"
        />

        <header className="relative mb-5 flex items-center gap-3">
          <p className="flex-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            How it works
          </p>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white/70">
            {current + 1} / {steps.length}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close the guide"
            className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        {/* L'étape (key → petite animation à chaque changement) */}
        <div key={current} className="anim-pop relative min-h-[13.5rem]">
          <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-brand text-white shadow-lg shadow-brand/40 ring-1 ring-white/25">
            <GuideIcon icon={step.icon} className="size-8" />
          </span>
          <h2
            id="guide-title"
            className="font-display text-2xl font-extrabold leading-tight tracking-tight text-white"
          >
            {step.title}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/75">
            {step.body}
          </p>
        </div>

        {/* Les points : où on en est (on peut toucher un point pour y aller) */}
        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-1.5">
          {steps.map((item, dot) => (
            <button
              key={dot}
              type="button"
              onClick={() => setIndex(dot)}
              aria-label={`Step ${dot + 1}: ${item.title}`}
              aria-current={dot === current ? "step" : undefined}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                dot === current
                  ? "w-6 bg-accent"
                  : "w-1.5 bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>

        <footer className="relative mt-6 flex items-center gap-3">
          {current > 0 ? (
            <button
              type="button"
              onClick={() => setIndex(current - 1)}
              className="neu-sm neu-btn rounded-full px-5 py-2.5 text-sm font-semibold text-white/80 hover:text-white"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={close}
              className="rounded-full px-3 py-2.5 text-sm font-semibold text-white/50 transition hover:text-white"
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={() => (current < last ? setIndex(current + 1) : close())}
            className="neu-btn ml-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-brand px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/30"
          >
            {current < last ? "Next" : "Let's start!"}
            <span aria-hidden>→</span>
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

/**
 * Le bouton "?" (Home) qui ouvre le guide.
 * autoOpen : nouveau membre → la fenêtre s'ouvre toute seule, une seule fois (onSeen l'enregistre).
 */
export function GuideButton({
  steps,
  autoOpen = false,
  onSeen,
}: {
  steps: GuideStepData[];
  autoOpen?: boolean;
  onSeen?: () => Promise<void>;
}) {
  const [open, setOpen] = useState(autoOpen);
  const saved = useRef(false);

  function close() {
    setOpen(false);
    if (autoOpen && onSeen && !saved.current) {
      saved.current = true;
      void onSeen();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How Tomes Club works"
        title="How it works"
        className="neu-sm neu-btn relative flex size-12 items-center justify-center rounded-full text-accent"
      >
        <GuideQuestionIcon className="size-6" />
      </button>
      <GuideDialog steps={steps} open={open} onClose={close} />
    </>
  );
}
