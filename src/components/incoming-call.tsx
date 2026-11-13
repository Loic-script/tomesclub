"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MemberAvatar } from "@/components/member-avatar";

// L'écran "appel entrant", comme un téléphone qui sonne :
// un membre m'appelle, une salle privée où je suis invité s'ouvre, ou le direct d'un événement
// où je suis inscrit commence. Bouton vert = décrocher (on y va), rouge = raccrocher.

type Ring = {
  id: string;
  kind: "call" | "room" | "event";
  title: string;
  body: string | null;
  link: string;
  fromUserId: string | null;
  fromHasPhoto: boolean;
  createdAt: string;
};

const EVERY_MS = 4000;
const RING_MS = 45 * 1000;

const KIND_LABEL: Record<Ring["kind"], string> = {
  call: "Incoming video call",
  room: "Private room invitation",
  event: "Live event is starting",
};

export function IncomingCall() {
  const router = useRouter();
  const [ring, setRing] = useState<Ring | null>(null);
  const handled = useRef(new Set<string>());

  // On regarde régulièrement si quelque chose sonne.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/rings", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { rings?: Ring[] };
        const next = (data.rings ?? []).find((item) => !handled.current.has(item.id)) ?? null;
        if (alive) setRing((current) => (current && !handled.current.has(current.id) ? current : next));
      } catch {
        // Pas de réseau : on réessaie au prochain tour.
      }
    };
    void load();
    const timer = setInterval(load, EVERY_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  // Après 45 secondes sans réponse : appel manqué, la fenêtre disparaît.
  useEffect(() => {
    if (!ring) return;
    const left = new Date(ring.createdAt).getTime() + RING_MS - Date.now();
    const timer = setTimeout(() => {
      handled.current.add(ring.id);
      setRing(null);
    }, Math.max(1000, left));
    return () => clearTimeout(timer);
  }, [ring]);

  // La sonnerie (deux petites notes qui se répètent), si le navigateur l'autorise.
  useEffect(() => {
    if (!ring) return;
    let context: AudioContext | null = null;
    try {
      context = new AudioContext();
    } catch {
      return;
    }
    const beep = () => {
      if (!context || context.state === "closed") return;
      for (const [offset, frequency] of [
        [0, 880],
        [0.18, 660],
      ] as const) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, context.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + 0.16);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + offset);
        oscillator.stop(context.currentTime + offset + 0.17);
      }
    };
    beep();
    const timer = setInterval(beep, 1600);
    return () => {
      clearInterval(timer);
      void context?.close().catch(() => {});
    };
  }, [ring]);

  if (!ring) return null;

  function answer(accept: boolean) {
    if (!ring) return;
    handled.current.add(ring.id);
    void fetch(`/api/rings/${ring.id}`, { method: "POST" }).catch(() => {});
    setRing(null);
    if (accept) router.push(ring.link);
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#12081f]/80 p-4 backdrop-blur-md">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={KIND_LABEL[ring.kind]}
        className="anim-pop relative w-full max-w-xs overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-b from-[#2e1a52] to-[#4a0b26] px-6 pb-7 pt-8 text-center text-white shadow-2xl shadow-black/60"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">{KIND_LABEL[ring.kind]}</p>

        {/* La photo (ou l'icône), avec des ondes qui pulsent */}
        <div className="relative mx-auto mt-6 flex size-28 items-center justify-center">
          <span aria-hidden className="anim-ping absolute inset-0 rounded-full bg-emerald-400/25" />
          <span aria-hidden className="absolute -inset-3 animate-pulse rounded-full ring-2 ring-white/10" />
          <span className="relative rounded-full bg-white/10 p-1.5 ring-2 ring-white/20">
            {ring.fromUserId ? (
              <MemberAvatar userId={ring.fromUserId} name={ring.title} hasPhoto={ring.fromHasPhoto} size="size-24" />
            ) : (
              <span className="flex size-24 items-center justify-center rounded-full bg-white">
                <Image src="/logo.png" alt="" width={80} height={80} className="rounded-full" />
              </span>
            )}
          </span>
        </div>

        <h2 className="mt-5 truncate font-display text-2xl font-extrabold">{ring.title}</h2>
        {ring.body && <p className="mt-1 text-sm text-white/65">{ring.body}</p>}

        {/* Raccrocher (rouge) / Décrocher (vert) */}
        <div className="mt-8 flex items-start justify-center gap-14">
          <button type="button" onClick={() => answer(false)} className="group flex flex-col items-center gap-2">
            <span className="flex size-16 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-900/50 transition group-hover:scale-110 group-active:scale-95">
              <PhoneIcon className="size-7 rotate-[135deg]" />
            </span>
            <span className="text-xs font-semibold text-white/75">Decline</span>
          </button>
          <button type="button" onClick={() => answer(true)} className="group flex flex-col items-center gap-2">
            <span className="flex size-16 animate-bounce items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-900/50 transition group-hover:scale-110 group-active:scale-95">
              <PhoneIcon className="size-7" />
            </span>
            <span className="text-xs font-semibold text-white/75">Accept</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PhoneIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1Z" />
    </svg>
  );
}
