import Link from "next/link";
import { Suspense, type CSSProperties, type ReactNode } from "react";
import { NotificationBell, NotificationBellFallback } from "@/components/notification-bell";

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
  subtitle,
  right,
  bell = true,
  members = true,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /** La cloche des notifications (cachée sur la page Notifications elle-même). */
  bell?: boolean;
  /** L'icône "membres" (téléphone et tablette ; cachée sur la page Members elle-même). */
  members?: boolean;
}) {
  return (
    <header className="anim-rise mb-6 flex items-center gap-3" style={delay(50)}>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/65">{subtitle}</p>}
      </div>
      {members && <MembersLink />}
      {bell && (
        // La cloche compte les notifications : lecture au moment de la requête.
        <Suspense fallback={<NotificationBellFallback />}>
          <NotificationBell />
        </Suspense>
      )}
      {right}
    </header>
  );
}
