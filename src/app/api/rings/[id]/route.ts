import { answerRing } from "@/lib/rings";
import { getCurrentUser } from "@/lib/session";

// POST /api/rings/<id> : le membre décroche ou raccroche (l'appel ne sonne plus).
export async function POST(_request: Request, ctx: RouteContext<"/api/rings/[id]">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });
  const { id } = await ctx.params;
  await answerRing(id, user.id);
  return Response.json({ ok: true });
}
