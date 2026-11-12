import {
  cleanMessage,
  countUnreadForMember,
  listThread,
  markReadByMember,
  sendMemberMessage,
} from "@/lib/coach-chat";
import { getCurrentUser } from "@/lib/session";

// La discussion du membre connecté avec le coach.
// GET /api/chat?peek=1 → seulement le nombre de messages pas lus (pastille du bouton)
// GET /api/chat        → les messages (et ils deviennent "lus")
// POST /api/chat       → { body } : envoyer un message
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (new URL(request.url).searchParams.has("peek")) {
    return Response.json({ unread: await countUnreadForMember(user.id) });
  }
  await markReadByMember(user.id);
  return Response.json({ messages: await listThread(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const data = (await request.json().catch(() => null)) as { body?: unknown } | null;
  const body = cleanMessage(data?.body);
  if (!body) return Response.json({ error: "Write a message first." }, { status: 400 });

  const message = await sendMemberMessage({ id: user.id, name: user.name }, body);
  return Response.json({ message });
}
