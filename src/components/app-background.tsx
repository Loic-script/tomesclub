import Image from "next/image";
import type { CSSProperties } from "react";

// Le fond commun de l'application et des pages de connexion :
// la photo "Learn English!", un voile rouge bordeaux transparent (la palette
// reste maîtresse et le texte reste lisible), et de petits drapeaux qui flottent.

/** Retard d'entrée (--d) et vitesse de flottement (--float) d'un drapeau. */
const float = (delayMs: number, floatSec: number) =>
  ({ "--d": `${delayMs}ms`, "--float": `${floatSec}s` }) as CSSProperties;

/** Les drapeaux : petits, posés dans les coins, jamais devant le contenu. */
const FLAGS = [
  {
    src: "/flags/us-uk.png",
    className: "left-[24%] top-[8%] w-16 rotate-6 max-md:left-[6%] max-md:top-[4%]",
    style: float(400, 9),
  },
  {
    src: "/flags/uk.png",
    className: "right-[2%] top-[52%] w-14 -rotate-6 max-md:hidden",
    style: float(700, 11),
  },
  {
    src: "/flags/england.png",
    className: "left-[2%] top-[62%] w-12 -rotate-3 max-md:hidden",
    style: float(1000, 8),
  },
  {
    src: "/flags/english.png",
    className: "bottom-[3%] right-[26%] w-14 rotate-3 max-md:hidden",
    style: float(1300, 10),
  },
] as const;

export function AppBackground() {
  return (
    <>
      {/* La photo, derrière tout le reste */}
      <Image
        src="/learn-english.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none select-none object-cover"
      />

      {/* Le voile clair : il garde la page lisible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(150deg,rgba(255,250,251,0.93),rgba(252,238,243,0.9)_45%,rgba(245,215,226,0.9))]"
      />
      {/* Le filtre rouge transparent de la palette (il bouge très lentement) */}
      <div
        aria-hidden
        className="anim-gradient pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(147,10,57,0.16),rgba(92,4,35,0.08)_50%,rgba(247,201,72,0.12))]"
      />

      {/* Les drapeaux qui flottent doucement */}
      {FLAGS.map((flag) => (
        <span
          key={flag.src}
          aria-hidden
          style={flag.style}
          className={`anim-bubble pointer-events-none absolute overflow-hidden rounded-xl shadow-lg shadow-brand/15 ring-1 ring-white/60 ${flag.className}`}
        >
          <Image
            src={flag.src}
            alt=""
            width={120}
            height={80}
            className="h-auto w-full object-cover opacity-90"
          />
        </span>
      ))}
    </>
  );
}
