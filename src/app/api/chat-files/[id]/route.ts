import { fileResponse } from "@/lib/activity-files";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { openChatFile } from "@/lib/coach-chat";

// GET /api/chat-files/<id du message>  (?download=1 pour télécharger)
// Le fichier joint d'un message : visible par l'admin et par le membre de cette discussion.
export async function GET(request: Request, ctx: RouteContext<"/api/chat-files/[id]">) {
  const { id } = await ctx.params;

  let file;
  if (await isAdmin()) {
    file = await openChatFile(id, { admin: true });
  } else {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });
    file = await openChatFile(id, { userId: session.user.id });
  }
  if (!file) return new Response("Not found", { status: 404 });

  return fileResponse(request, file);
}
