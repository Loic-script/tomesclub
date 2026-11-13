import type { CSSProperties, ReactNode } from "react";

// Fond des pages d'authentification : scène sombre bleu nuit → bordeaux,
// avec des tuiles de verre qui flottent (style de l'image de référence,
// adapté à la palette Tomes Club).
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#1a1150,#45091f_52%,#7a082e)] max-sm:items-stretch sm:px-4 sm:py-10">
      {/* Lueurs douces dans les coins */}
      <div aria-hidden className="absolute -right-24 -top-24 size-96 rounded-full bg-navy/50 blur-3xl" />
      <div aria-hidden className="absolute -bottom-32 -left-24 size-[28rem] rounded-full bg-accent/15 blur-3xl" />

      {/* Tuiles flottantes autour de la carte */}
      <Tile look="glass" className="left-[5%] top-[10%] size-28 rotate-6" style={tile(200, 9)}>
        <BubbleGlyph />
      </Tile>
      <Tile look="accent" className="left-[16%] top-[34%] size-14 -rotate-6" style={tile(500, 11)} />
      <Tile look="glass" className="bottom-[14%] left-[9%] size-20 -rotate-3 max-md:hidden" style={tile(800, 8)}>
        <AaGlyph />
      </Tile>
      <Tile look="cream" className="bottom-[36%] left-[3%] size-10 rotate-12 max-md:hidden" style={tile(1100, 10)} />
      <Tile look="glass" className="right-[6%] top-[14%] size-24 -rotate-6" style={tile(350, 10)}>
        <CameraGlyph />
      </Tile>
      <Tile look="rose" className="right-[18%] top-[36%] size-12 rotate-6 max-md:hidden" style={tile(650, 9)} />
      <Tile look="accent" className="bottom-[12%] right-[8%] size-16 rotate-3" style={tile(950, 12)} />
      <Tile look="glass" className="bottom-[32%] right-[3%] size-12 -rotate-12 max-md:hidden" style={tile(1250, 8)} />

      {/* La carte de connexion, au-dessus de la scène */}
      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </main>
  );
}

/** Retard d'entrée (--d) et vitesse de flottement (--float) d'une tuile. */
const tile = (delayMs: number, floatSec: number) =>
  ({ "--d": `${delayMs}ms`, "--float": `${floatSec}s` }) as CSSProperties;

const LOOKS = {
  /* verre dépoli */ glass: "border border-white/20 bg-white/10 backdrop-blur-sm",
  /* orange du logo */ accent: "bg-gradient-to-br from-accent/80 to-brand/50",
  /* crème du logo */ cream: "bg-cream/30",
  /* rosé */ rose: "bg-gradient-to-br from-[#f06292]/60 to-brand/40",
} as const;

function Tile({
  look,
  className,
  style,
  children,
}: {
  look: keyof typeof LOOKS;
  className: string;
  style: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <span
      aria-hidden
      style={style}
      className={`anim-bubble absolute flex items-center justify-center rounded-2xl shadow-xl shadow-black/25 ${LOOKS[look]} ${className}`}
    >
      {children}
    </span>
  );
}

/* Petites icônes, fines et blanches, dans l'esprit du club */

function BubbleGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-10 text-white/80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-8.6 8.3 9 9 0 0 1-3.3-.6L3 21l1.9-4.6a8.3 8.3 0 0 1-1.3-4.9A8.4 8.4 0 0 1 12.4 3.2a8.4 8.4 0 0 1 8.6 8.3Z" />
    </svg>
  );
}

function AaGlyph() {
  return <span className="font-display text-2xl font-bold text-white/80">Aa</span>;
}

function CameraGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-9 text-white/80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="6" width="13" height="12" rx="2.5" />
      <path d="m15 10 5-3v10l-5-3" />
    </svg>
  );
}
