import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { ENGLISH_LEVELS } from "@/lib/onboarding-options";

// Les briques communes de l'espace membre : une seule façon de faire
// une carte, un en-tête, un titre de section, un état vide...

/** Règle le retard d'une animation d'entrée (variable --d du CSS). */
export const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Carte blanche posée sur le fond. `padded` = marge intérieure standard. */
export function Card({
  children,
  className = "",
  style,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  padded?: boolean;
}) {
  return (
    <section style={style} className={`card ${padded ? "p-5 sm:p-6" : ""} ${className}`}>
      {children}
    </section>
  );
}

/** L'en-tête d'une page : titre, phrase d'aide, actions à droite. */
export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Un lien de retour au-dessus du titre. */
  back?: { href: string; label: string };
}) {
  return (
    <header className="anim-rise mb-6 lg:mb-8">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-mute transition-colors hover:text-brand"
        >
          <ArrowLeftIcon className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 text-sm text-mute sm:text-base">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Le titre d'une section, avec un compteur ou une action à droite. */
export function SectionHeader({
  title,
  description,
  action,
  count,
  id,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  count?: number;
  id?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 id={id} className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-blush px-2 py-0.5 font-sans text-xs font-semibold text-mute">
              {count}
            </span>
          )}
        </h2>
        {description && <p className="mt-0.5 text-sm text-mute">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Rien à montrer : une icône, une phrase, et si possible une action. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center ${className}`}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand">
        {icon}
      </span>
      <p className="mt-4 font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-mute">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Le niveau d'anglais en 4 marches (Beginner → Advanced). */
export function LevelMeter({ level }: { level: string | null }) {
  const index = ENGLISH_LEVELS.findIndex((entry) => entry.value === level);
  if (index < 0) return null;
  const current = ENGLISH_LEVELS[index];
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold text-ink">{current.label}</p>
        <p className="text-xs text-mute">
          Level {index + 1} of {ENGLISH_LEVELS.length}
        </p>
      </div>
      <div
        role="img"
        aria-label={`English level: ${current.label}, ${index + 1} of ${ENGLISH_LEVELS.length}`}
        className="mt-2.5 grid grid-cols-4 gap-1.5"
      >
        {ENGLISH_LEVELS.map((entry, step) => (
          <span
            key={entry.value}
            className={`h-1.5 rounded-full ${step <= index ? "bg-brand" : "bg-blush-2"}`}
          />
        ))}
      </div>
      <p className="mt-2 text-sm text-mute">{current.hint}</p>
    </div>
  );
}

/** Pendant le chargement d'une page : des formes grises à la place du contenu. */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-48 rounded-lg bg-blush-2/70" />
        <div className="h-4 w-72 max-w-full rounded-md bg-blush" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-48 rounded-2xl bg-blush md:col-span-2" />
        <div className="h-36 rounded-2xl bg-blush" />
        <div className="h-36 rounded-2xl bg-blush" />
      </div>
    </div>
  );
}

/** Le jour et le mois, empilés, comme une page de calendrier. */
export function DateBlock({ date, size = "md" }: { date: Date; size?: "md" | "lg" }) {
  const large = size === "lg";
  return (
    <span
      className={`flex shrink-0 flex-col items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand ${
        large ? "size-16" : "size-14"
      }`}
    >
      <span className="text-xs font-semibold uppercase leading-none">
        {new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date)}
      </span>
      <span
        className={`mt-1 font-display font-semibold leading-none ${large ? "text-2xl" : "text-xl"}`}
      >
        {new Intl.DateTimeFormat("en-GB", { day: "2-digit" }).format(date)}
      </span>
    </span>
  );
}
