import type { CSSProperties, ReactNode } from "react";

// Petits morceaux d'interface du "mode application" (fond sombre, cartes en verre).

/** Règle le retard d'une animation d'entrée (variable --d du CSS). */
export const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Carte en verre dépoli sur le fond sombre. */
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
    <section
      style={style}
      className={`rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-md ${className}`}
    >
      {children}
    </section>
  );
}

/** L'en-tête d'une page de l'application. */
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="anim-rise mb-6 flex items-center gap-4" style={delay(50)}>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
