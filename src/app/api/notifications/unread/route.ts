import { countUnread, countUnreadByTab } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";

// GET /api/notifications/unread → { unread: 3, tabs: { home, calls, rooms, events } }
// Les pastilles de la barre du bas (Alerts = le total).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ unread: 0, tabs: null }, { status: 401 });
  const [unread, tabs] = await Promise.all([countUnread(user.id), countUnreadByTab(user.id)]);
  return Response.json({ unread, tabs });
}
