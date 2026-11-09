import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/event/image/<eventId> : l'image d'un événement (stockée dans la base).
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/event/image/[eventId]">,
) {
  if (!(await isAdmin())) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });
  }

  const { eventId } = await ctx.params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { image: true, imageType: true },
  });
  if (!event?.image) return new Response("Not found", { status: 404 });

  return new Response(event.image, {
    headers: {
      "Content-Type": event.imageType ?? "image/jpeg",
      "Cache-Control": "private, max-age=600",
    },
  });
}
