import { stopUnansweredCall } from "@/lib/calls";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// POST /api/rings/decline {"link": "/call/<id>"} : bouton "Decline" de la notification du téléphone.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });
  const link = await request
    .json()
    .then((body: { link?: unknown }) => (typeof body?.link === "string" ? body.link : null))
    .catch(() => null);
  const callId = link?.match(/^\/call\/([^/?#]+)$/)?.[1];
  if (!link || !callId) return Response.json({ ok: false }, { status: 400 });
  await prisma.ring.updateMany({ where: { userId: user.id, link, answeredAt: null }, data: { answeredAt: new Date() } });
  await stopUnansweredCall(callId, user.id);
  return Response.json({ ok: true });
}
