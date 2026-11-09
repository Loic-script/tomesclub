"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

// La montre du panneau de droite : cadran en relief doux, aiguilles animées,
// heure digitale dessous. L'heure vient du navigateur (rien côté serveur).

/** Préviens React chaque seconde. */
function subscribeEverySecond(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

export function SideClock({ className = "" }: { className?: string }) {
  // Côté serveur : 0 → on n'affiche rien ; côté navigateur : l'heure, à la seconde.
  const tick = useSyncExternalStore(
    subscribeEverySecond,
    () => Math.floor(Date.now() / 1000),
    () => 0,
  );
  if (tick === 0) return null;

  const now = new Date(tick * 1000);
  const seconds = now.getSeconds();
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;

  const digital = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  const dateLine = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(now);

  return (
    <aside aria-label="Clock" className={className}>
      <div
        className="neu anim-rise w-64 rounded-[2rem] p-6"
        style={{ "--d": "300ms" } as CSSProperties}
      >
        {/* Le cadran */}
        <div className="neu-inset relative mx-auto size-48 rounded-full">
          {/* Les 12 repères */}
          {Array.from({ length: 12 }, (_, index) => (
            <span
              key={index}
              aria-hidden
              className="absolute inset-0 flex justify-center"
              style={{ transform: `rotate(${index * 30}deg)` }}
            >
              <span
                className={`mt-3 block w-0.5 rounded-full ${
                  index % 3 === 0 ? "h-3.5 bg-accent" : "h-2 bg-white/35"
                }`}
              />
            </span>
          ))}

          {/* Heures, minutes, trotteuse */}
          <Hand rotation={hours * 30} className="h-[26%] w-1.5 bg-white" />
          <Hand rotation={minutes * 6} className="h-[36%] w-1 bg-white/70" />
          <Hand rotation={seconds * 6} className="h-[40%] w-0.5 bg-accent" />

          {/* Le centre */}
          <span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow" />
        </div>

        {/* L'heure digitale */}
        <p className="mt-5 text-center font-display text-3xl font-bold tabular-nums text-white">
          {digital}
        </p>
        <p className="text-center text-sm text-white/60">{dateLine}</p>
      </div>
    </aside>
  );
}

/** Une aiguille, pivotée autour du centre du cadran. */
function Hand({ rotation, className }: { rotation: number; className: string }) {
  return (
    <span
      aria-hidden
      className={`absolute bottom-1/2 left-1/2 origin-bottom -translate-x-1/2 rounded-full ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    />
  );
}
