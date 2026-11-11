import { isAdmin } from "@/lib/admin";
import { fileStream, openActivityFile } from "@/lib/activity-files";
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

  const disposition = `${url.searchParams.get("download") ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.name)}`;
  const headers: Record<string, string> = {
    "Content-Type": file.mime,
    "Accept-Ranges": "bytes",
    "Content-Disposition": disposition,
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };

  // Une partie seulement (le lecteur video le demande pour avancer / reculer).
  const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && file.size > 0) {
    let start = range[1] ? Number(range[1]) : NaN;
    let end = range[2] ? Number(range[2]) : file.size - 1;
    if (Number.isNaN(start)) {
      // "bytes=-500" : les 500 derniers octets
      start = Math.max(0, file.size - end);
      end = file.size - 1;
    }
    end = Math.min(end, file.size - 1);
    if (start > end || start >= file.size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${file.size}` } });
    }
    return new Response(fileStream(file.path, start, end), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${file.size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }

  return new Response(fileStream(file.path), {
    headers: { ...headers, "Content-Length": String(file.size) },
  });
}
