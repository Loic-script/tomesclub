import { Suspense, type CSSProperties, type ReactNode } from "react";
import { AdminBell, AdminBellFallback } from "./admin-bell";

// Les morceaux d'interface de l'espace admin : même verre sombre que l'espace membre.

/** Règle le retard d'une animation d'entrée (variable --d du CSS). */
export const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** "il y a 5 min", "il y a 2 h"... (appelé seulement côté serveur, après connection()). */
export function timeAgo(date: Date): string {
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
}

/** L'en-tête d'une page admin, avec la cloche à droite. */
export function AdminHeader({
  eyebrow,
  title,
  subtitle,
  right,
  bell = true,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  bell?: boolean;
}) {
  return (
    <header className="anim-rise relative z-30 mb-8 flex flex-wrap items-end gap-4" style={delay(40)}>
      <div className="min-w-0 flex-1">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          <span aria-hidden className="h-px w-5 rounded-full bg-accent/70" />
          {eyebrow}
        </p>
        <h1 className="text-headline font-display text-[2rem] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[2.6rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-[15px] font-medium leading-relaxed text-white/60">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {right}
        {bell && (
          <Suspense fallback={<AdminBellFallback />}>
            <AdminBell />
          </Suspense>
        )}
      </div>
    </header>
  );
}

/** Une carte de verre avec un titre. */
export function Panel({
  title,
  icon,
  action,
  children,
  className = "",
  style,
}: {
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section style={style} className={`neu anim-rise rounded-3xl p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center gap-3">
          {icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80">
              {icon}
            </span>
          )}
          <h2 className="min-w-0 flex-1 truncate font-display text-lg font-bold text-white">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/** Un chiffre clé (en haut du tableau de bord). */
export function StatTile({
  label,
  value,
  hint,
  icon,
  tone,
  live = false,
  style,
}: {
  label: string;
  value: number | string;
  hint?: ReactNode;
  icon: ReactNode;
  /** Le dégradé de la pastille (classes Tailwind from-… to-…). */
  tone: string;
  /** Petit point vert qui pulse (donnée en direct). */
  live?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div style={style} className="neu anim-rise group relative overflow-hidden rounded-3xl p-5">
      {/* Halo de couleur dans le coin */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br ${tone} opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <span
          className={`flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg shadow-black/20`}
        >
          {icon}
        </span>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <span className="relative flex size-1.5">
              <span className="anim-ping absolute inset-0 rounded-full bg-emerald-300" />
              <span className="relative size-1.5 rounded-full bg-emerald-300" />
            </span>
            Live
          </span>
        )}
      </div>
      <p className="relative mt-4 font-display text-4xl font-extrabold tabular-nums tracking-tight text-white">
        {value}
      </p>
      <p className="relative mt-1 text-sm font-semibold text-white/70">{label}</p>
      {hint && <p className="relative mt-2 text-xs text-white/45">{hint}</p>}
    </div>
  );
}

/** Une petite étiquette arrondie. */
export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "accent" | "navy" }) {
  const tones = {
    neutral: "bg-white/10 text-white/70",
    good: "bg-emerald-400/15 text-emerald-300",
    warn: "bg-amber-400/15 text-amber-300",
    accent: "bg-accent/15 text-accent",
    navy: "bg-[#6d72ff]/20 text-[#b9bcff]",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Le message quand une liste est vide. */
export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10 text-white/60">
        {icon}
      </span>
      <p className="mt-3 font-semibold text-white">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-white/50">{text}</p>}
    </div>
  );
}
