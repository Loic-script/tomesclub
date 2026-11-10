import Link from "next/link";
import { countUnread } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";

// La cloche affichée dans l'en-tête de chaque page de l'application.
// Elle montre une pastille avec le nombre de notifications non lues.
export async function NotificationBell() {
  const user = await getCurrentUser();
  const unread = user ? await countUnread(user.id) : 0;

  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Notifications (${unread} new)` : "Notifications"}
      className="neu-sm neu-btn relative flex size-11 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:text-white"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
        <path d="M10.5 20a2 2 0 0 0 3 0" />
      </svg>

      {unread > 0 && (
        <>
          <span
            aria-hidden
            className="anim-ping absolute -right-0.5 -top-0.5 size-5 rounded-full bg-accent/60"
          />
          <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-navy">
            {unread > 9 ? "9+" : unread}
          </span>
        </>
      )}
    </Link>
  );
}

/** La place que prend la cloche pendant le chargement. */
export function NotificationBellFallback() {
  return <span className="neu-sm size-11 shrink-0 rounded-full" />;
}
