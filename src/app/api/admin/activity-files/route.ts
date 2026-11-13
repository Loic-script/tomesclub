import { after } from "next/server";
import { getActivity } from "@/lib/activities";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { convertToPdf, MAX_UPLOAD_BYTES, saveActivityFile, UploadTooBigError } from "@/lib/activity-files";

// POST /api/admin/activity-files?activity=<cle>&name=<nom du fichier>
// Le corps de la requete = le fichier lui-meme (envoye en flux, sans limite de memoire).
// Admin seulement.
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  // Une activité ("debate") ou un événement ("event:<id>")
  const key = url.searchParams.get("activity") ?? "";
  let ownerKey: string | null = null;
  if (key.startsWith("event:")) {
    const event = await prisma.event.findFirst({ where: { id: key.slice(6), kind: "event" }, select: { id: true } });
    ownerKey = event ? key : null;
  } else {
    ownerKey = (await getActivity(key))?.key ?? null;
  }
  if (!ownerKey) return Response.json({ error: "Unknown activity or event." }, { status: 404 });
  const activity = { key: ownerKey };

  const name = url.searchParams.get("name")?.trim();
  if (!name) return Response.json({ error: "The file has no name." }, { status: 400 });
  if (!request.body) return Response.json({ error: "The file is empty." }, { status: 400 });

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "This file is too big." }, { status: 413 });
  }

  try {
    const saved = await saveActivityFile({
      activityKey: activity.key,
      name,
      mime: request.headers.get("content-type") ?? "",
      body: request.body,
    });
    // PowerPoint, Word, Excel : la version PDF se fabrique apres la reponse.
    if (saved.kind === "office") after(() => convertToPdf(saved.id));
    return Response.json({ id: saved.id });
  } catch (error) {
    if (error instanceof UploadTooBigError) {
      return Response.json({ error: "This file is too big." }, { status: 413 });
    }
    console.error("[upload activity file]", error);
    return Response.json({ error: "The upload failed. Please try again." }, { status: 500 });
  }
}
