import { isAdmin } from "@/lib/admin";
import { fileResponse, openActivityFile } from "@/lib/activity-files";
import { auth } from "@/lib/auth";

// GET /api/activity-files/<id>            : le fichier d origine
// GET /api/activity-files/<id>?variant=pdf : sa version PDF (PowerPoint, Word...)
// ?download=1 : telecharger au lieu d afficher.
// Accessible a l admin et aux membres connectes. Gere "Range" (avancer dans une video).
export async function GET(request: Request, ctx: RouteContext<"/api/activity-files/[id]">) {
  if (!(await isAdmin())) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await ctx.params;
  const url = new URL(request.url);
  const file = await openActivityFile(id, url.searchParams.get("variant") === "pdf" ? "pdf" : "original");
  if (!file) return new Response("Not found", { status: 404 });

  return fileResponse(request, file);
}
