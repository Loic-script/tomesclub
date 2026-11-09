import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/profile/photo/<userId> : la photo d'un membre (stockée dans la base).
// Accessible à l'admin et aux membres connectés (avatars dans l'app).
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/profile/photo/[userId]">,
) {
  if (!(await isAdmin())) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });
  }

  const { userId } = await ctx.params;
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { photo: true, photoType: true },
  });
  if (!profile?.photo) return new Response("Not found", { status: 404 });

  return new Response(profile.photo, {
    headers: {
      "Content-Type": profile.photoType ?? "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}
