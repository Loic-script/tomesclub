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

/** L'en-tête d'une page de l'application. */
export function PageHeader({
  title,
  subtitle,
  right,
  bell = true,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /** La cloche des notifications (cachée sur la page Notifications elle-même). */
  bell?: boolean;
}) {
  return (
    <header className="anim-rise mb-6 flex items-center gap-3" style={delay(50)}>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/65">{subtitle}</p>}
      </div>
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
