import { stopUnansweredCall } from "@/lib/calls";
import { answerRing } from "@/lib/rings";
import { getCurrentUser } from "@/lib/session";

// POST /api/rings/<id> : le membre décroche ou raccroche (l'appel ne sonne plus).
// Corps {"decline": true} : il refuse → un appel pas encore commencé se coupe aussi chez l'appelant.
export async function POST(request: Request, ctx: RouteContext<"/api/rings/[id]">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });
  const { id } = await ctx.params;
  const decline = await request
    .json()
    .then((body: { decline?: unknown }) => body?.decline === true)
    .catch(() => false);
  const link = await answerRing(id, user.id);
  const callId = link?.match(/^\/call\/([^/?#]+)$/)?.[1];
  if (decline && callId) await stopUnansweredCall(callId, user.id);
  return Response.json({ ok: true });
}
