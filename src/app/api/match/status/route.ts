import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/match/status : où en est ma recherche de partenaire ?
// "waiting" = encore dans la file ; "matched" = un appel vient d'être créé pour moi ;
// "idle" = plus dans la file (recherche annulée ou expirée).
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ status: "unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const queued = await prisma.matchQueue.findUnique({ where: { userId } });
  if (queued) return Response.json({ status: "waiting" });

  // Plus dans la file : un partenaire a peut-être créé l'appel pour nous deux.
  const recentCall = await prisma.call.findFirst({
    where: {
      participants: { some: { userId } },
      createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (recentCall) return Response.json({ status: "matched", callId: recentCall.id });

  return Response.json({ status: "idle" });
}
