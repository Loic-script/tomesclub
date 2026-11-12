import { isAdmin } from "@/lib/admin";
import {
  cleanMessage,
  listConversations,
  listThread,
  markReadByCoach,
  sendCoachMessage,
} from "@/lib/coach-chat";

// La messagerie de l'admin (coach). Admin seulement.
// GET /api/admin/chat            → la liste des discussions
// GET /api/admin/chat?user=<id>  → les messages avec ce membre (et ils deviennent "lus")
// POST /api/admin/chat           → { userId, body } : écrire à ce membre
export async function GET(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = new URL(request.url).searchParams.get("user");
  if (!userId) return Response.json({ conversations: await listConversations() });

  await markReadByCoach(userId);
  return Response.json({ messages: await listThread(userId) });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const data = (await request.json().catch(() => null)) as { userId?: unknown; body?: unknown } | null;
  const body = cleanMessage(data?.body);
  if (!body) return Response.json({ error: "Write a message first." }, { status: 400 });
  if (typeof data?.userId !== "string") return Response.json({ error: "Unknown member." }, { status: 400 });

  const message = await sendCoachMessage(data.userId, body);
  if (!message) return Response.json({ error: "Unknown member." }, { status: 404 });
  return Response.json({ message });
}
