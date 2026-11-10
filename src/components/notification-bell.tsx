import Link from "next/link";
import { cache } from "react";
import { BellIcon } from "@/components/icons";
import { countUnread } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";

// Le nombre de notifications non lues.
// cache() : lu une seule fois par requête, même si la cloche et le menu l'affichent.
const unreadForCurrentUser = cache(async (): Promise<number> => {
  const user = await getCurrentUser();
  return user ? countUnread(user.id) : 0;
});

/** La cloche de la barre du haut (téléphone), avec la pastille des non lues. */
export async function NotificationBell() {
  const unread = await unreadForCurrentUser();

  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Notifications (${unread} new)` : "Notifications"}
      className="btn btn-ghost btn-icon relative text-ink"
    >
      <BellIcon />
      {unread > 0 && (
        <span className="absolute right-1 top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[0.625rem] font-bold leading-none text-white ring-2 ring-cream">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

/** La place que prend la cloche pendant le chargement. */
export function NotificationBellFallback() {
  return (
    <span aria-hidden className="btn btn-ghost btn-icon text-ink">
      <BellIcon />
    </span>
  );
}

/** Le compteur à côté de "Notifications" dans la barre latérale. */
export async function UnreadBadge() {
  const unread = await unreadForCurrentUser();
  if (unread === 0) return null;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold leading-none text-white">
      <span className="sr-only">, </span>
      {unread > 99 ? "99+" : unread}
      <span className="sr-only"> unread</span>
    </span>
  );
}
