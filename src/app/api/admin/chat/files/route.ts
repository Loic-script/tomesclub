import { isAdmin } from "@/lib/admin";
import { UploadTooBigError } from "@/lib/activity-files";
import { uploadFromRequest } from "@/lib/chat-upload";
import { sendCoachMessage } from "@/lib/coach-chat";

// POST /api/admin/chat/files?user=<id du membre>&name=<nom du fichier>
// Le coach envoie un fichier à un membre. Admin seulement.
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = new URL(request.url).searchParams.get("user");
  if (!userId) return Response.json({ error: "Unknown member." }, { status: 400 });

  const upload = uploadFromRequest(request);
  if ("error" in upload) return Response.json({ error: upload.error }, { status: upload.status });

  try {
    const message = await sendCoachMessage(userId, "", upload.file);
    if (!message) return Response.json({ error: "Unknown member." }, { status: 404 });
    return Response.json({ message });
  } catch (error) {
    if (error instanceof UploadTooBigError) {
      return Response.json({ error: "This file is too big." }, { status: 413 });
    }
    console.error("[admin chat] file not saved:", error);
    return Response.json({ error: "The file was not saved. Try again." }, { status: 500 });
  }
}
