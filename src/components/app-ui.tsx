import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

// Petits morceaux d'interface du "mode application" (fond clair, relief doux).

/** Règle le retard d'une animation d'entrée (variable --d du CSS). */
export const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Carte en relief doux posée sur le fond. */
export function GlassCard({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section style={style} className={`neu rounded-3xl p-5 ${className}`}>
      {children}
    </section>
  );
}

/**
 * L'icône "membres" à côté de la cloche. Sur grand écran, la liste est déjà
 * dans le panneau de droite : l'icône n'apparaît donc que sur téléphone et tablette.
 */
function MembersLink() {
  return (
    <Link
      href="/members"
      aria-label="Members"
      className="neu-sm neu-btn flex size-11 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:text-white xl:hidden"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="8" r="3.2" />
        <path d="M2.8 19a6.2 6.2 0 0 1 12.4 0" />
        <circle cx="17" cy="9.5" r="2.4" />
        <path d="M15.6 14.5a4.9 4.9 0 0 1 5.6 4.5" />
      </svg>
    </Link>
  );
}

/** L'en-tête d'une page de l'application. */
export function PageHeader({
  title,
  eyebrow,
  subtitle,
  right,
  members = true,
}: {
  title: ReactNode;
  /** Le petit mot orange au-dessus du titre (ex : "Speaking practice"). */
  eyebrow?: string;
  subtitle?: string;
  right?: ReactNode;
  /** Ancienne option : la cloche est maintenant dans la barre du bas. */
  bell?: boolean;
  /** L'icône "membres" (téléphone et tablette ; cachée sur la page Members elle-même). */
  members?: boolean;
}) {
  return (
    <header className="anim-rise mb-6 flex items-center gap-3" style={delay(50)}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            <span aria-hidden className="h-px w-5 rounded-full bg-accent/70" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-headline font-display text-[2rem] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[2.5rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-xl text-[15px] font-medium leading-relaxed text-white/60">
            {subtitle}
          </p>
        )}
      </div>
      {members && <MembersLink />}
      {right}
    </header>
  );
}
