import { countUnread } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";

// GET /api/notifications/unread → { unread: 3 }
// La pastille de l'onglet "Alerts" de la barre du bas.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ unread: 0 }, { status: 401 });
  return Response.json({ unread: await countUnread(user.id) });
}
