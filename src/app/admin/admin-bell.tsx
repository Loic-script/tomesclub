import { countAdminUnread, listAdminNotifications } from "@/lib/admin-notifications";
import { AdminBellMenu, type BellItem } from "./admin-bell-menu";
import { timeAgo } from "./admin-ui";

// La cloche de l'admin : pastille des non lues + aperçu des dernières notifications.
export async function AdminBell() {
  const [unread, latest] = await Promise.all([countAdminUnread(), listAdminNotifications(6)]);
  const items: BellItem[] = latest.map((item) => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
    body: item.body,
    link: item.link,
    read: item.read,
    ago: timeAgo(item.createdAt),
  }));
  return <AdminBellMenu unread={unread} items={items} />;
}

export function AdminBellFallback() {
  return <span className="neu-sm size-11 shrink-0 rounded-full" />;
}
