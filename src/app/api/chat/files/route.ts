import { UploadTooBigError } from "@/lib/activity-files";
import { sendMemberMessage } from "@/lib/coach-chat";
import { getCurrentUser } from "@/lib/session";
import { uploadFromRequest } from "@/lib/chat-upload";

// POST /api/chat/files?name=<nom du fichier>
// Le membre connecté envoie un fichier (photo, vidéo, document...) au coach.
// Le corps de la requête = le fichier lui-même.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const upload = uploadFromRequest(request);
  if ("error" in upload) return Response.json({ error: upload.error }, { status: upload.status });

  try {
    const message = await sendMemberMessage({ id: user.id, name: user.name }, "", upload.file);
    return Response.json({ message });
  } catch (error) {
    if (error instanceof UploadTooBigError) {
      return Response.json({ error: "This file is too big." }, { status: 413 });
    }
    console.error("[chat] file not saved:", error);
    return Response.json({ error: "The file was not saved. Try again." }, { status: 500 });
  }
}
