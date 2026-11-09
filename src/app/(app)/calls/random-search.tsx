"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cancelRandomSearch, startRandomSearch } from "./actions";

// La carte "partenaire au hasard" : on cherche quelqu'un qui cherche aussi,
// et dès que deux personnes se trouvent, l'appel démarre.
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
    <section className="neu rounded-3xl p-6">
      {searching ? (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          {/* Les ondes qui pulsent autour du téléphone */}
          <span className="relative flex size-20 items-center justify-center">
            <span aria-hidden className="anim-ping absolute inset-0 rounded-full bg-brand/25" />
            <span
              aria-hidden
              className="anim-ping absolute inset-0 rounded-full bg-accent/30"
              style={{ animationDelay: "0.5s" }}
            />
            <span className="neu-inset relative flex size-16 items-center justify-center rounded-full text-brand">
              <SearchPhoneIcon />
            </span>
          </span>
          <div>
            <p className="font-display text-lg font-bold text-navy">Looking for a partner...</p>
            <p className="text-sm text-zinc-500">
              The call starts as soon as someone else searches too.
            </p>
          </div>
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="neu-sm neu-btn rounded-full px-5 py-2 text-sm font-semibold text-zinc-600 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <span className="neu-inset flex size-14 shrink-0 items-center justify-center rounded-2xl text-brand">
            <SearchPhoneIcon />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-navy">Random partner</h2>
            <p className="text-sm text-zinc-500">
              Practice English with a surprise member of the club.
            </p>
          </div>
          <button
            type="button"
            onClick={start}
            disabled={pending}
            className="neu-btn shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60"
          >
            {pending ? "..." : "Search"}
          </button>
        </div>
      )}

      <p aria-live="polite" className="mt-3 min-h-5 text-center text-sm text-red-600">
        {message}
      </p>
    </section>
  );
}

function SearchPhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9Z" />
    </svg>
  );
}
