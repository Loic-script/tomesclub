"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ShuffleIcon } from "@/components/icons";
import { cancelRandomSearch, startRandomSearch } from "./actions";

// La carte "partenaire au hasard" : on cherche quelqu un qui cherche aussi,
// et dès que deux personnes se trouvent, l appel démarre.
export function RandomSearchCard() {
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Pendant la recherche : on demande toutes les 2,5 s si un partenaire est arrivé.
  useEffect(() => {
    if (!searching) return;

    const timer = setInterval(async () => {
      try {
        const response = await fetch("/api/match/status");
        if (!response.ok) return;
        const data = (await response.json()) as { status: string; callId?: string };
        if (data.status === "matched" && data.callId) {
          clearInterval(timer);
          router.push(`/call/${data.callId}`);
        } else if (data.status === "idle") {
          setSearching(false);
          setMessage("No partner found yet. Try again in a moment!");
        }
      } catch {
        // Petite erreur réseau : on réessaiera au prochain tour.
      }
    }, 2500);

    return () => {
      clearInterval(timer);
      // Si on quitte la page pendant la recherche, on sort de la file.
      cancelRandomSearch().catch(() => {});
    };
  }, [searching, router]);

  function start() {
    setMessage(null);
    startTransition(async () => {
      const result = await startRandomSearch();
      if (result.error) {
        setMessage(result.error);
      } else if (result.callId) {
        router.push(`/call/${result.callId}`);
      } else {
        setSearching(true);
      }
    });
  }

  function cancel() {
    startTransition(async () => {
      await cancelRandomSearch();
      setSearching(false);
      setMessage(null);
    });
  }

  return (
    <section
      aria-labelledby="random-title"
      aria-busy={searching}
      className="relative overflow-hidden rounded-2xl bg-brand p-6 text-white shadow-raised sm:p-8"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        {/* Le téléphone, avec des ondes pendant la recherche */}
        <span className="relative flex size-16 shrink-0 items-center justify-center">
          {searching && (
            <>
              <span aria-hidden className="anim-ping absolute inset-0 rounded-full bg-white/25" />
              <span
                aria-hidden
                className="anim-ping absolute inset-0 rounded-full bg-white/20"
                style={{ animationDelay: "0.6s" }}
              />
            </>
          )}
          <span className="relative flex size-16 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
            <ShuffleIcon className="size-7" />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
            {searching ? "Searching" : "Quick start"}
          </p>
          <h2 id="random-title" className="mt-1 font-display text-xl font-semibold sm:text-2xl">
            {searching ? "Looking for a partner..." : "Talk to a random partner"}
          </h2>
          <p className="mt-1 max-w-md text-sm text-white/80">
            {searching
              ? "The call starts as soon as someone else searches too. Keep this page open."
              : "We match you with another member who is looking for a partner right now."}
          </p>
        </div>

        {searching ? (
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="btn btn-lg shrink-0 border-white/30 text-white hover:border-white/50 hover:bg-white/10"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={pending}
            className="btn btn-lg btn-inverse shrink-0"
          >
            {pending ? "Starting..." : "Find a partner"}
          </button>
        )}
      </div>

      <p
        aria-live="polite"
        className={
          message
            ? "mt-5 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white ring-1 ring-white/15"
            : "sr-only"
        }
      >
        {message}
      </p>
    </section>
  );
}
