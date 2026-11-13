import { UploadTooBigError } from "@/lib/activity-files";
import { isProofImage, MAX_PROOF_BYTES, savePaymentProof } from "@/lib/payment-proofs";
import { getCurrentUser } from "@/lib/session";

// POST /api/payment-proofs?name=<nom du fichier>
// Le membre connecté envoie la capture d'écran de son paiement MVola.
// Le corps de la requête = l'image. Réponse : { id }.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const name = new URL(request.url).searchParams.get("name")?.trim() || "payment.png";
  const mime = request.headers.get("content-type") ?? "";
  if (!isProofImage(mime)) {
    return Response.json({ error: "Please send a picture (JPG, PNG or WebP)." }, { status: 400 });
  }
  if (!request.body) return Response.json({ error: "The picture is empty." }, { status: 400 });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_PROOF_BYTES) {
    return Response.json({ error: "This picture is too big (8 MB maximum)." }, { status: 413 });
  }

  try {
    const id = await savePaymentProof({ userId: user.id, name, mime, body: request.body });
    return Response.json({ id });
  } catch (error) {
    if (error instanceof UploadTooBigError) {
      return Response.json({ error: "This picture is too big." }, { status: 413 });
    }
    console.error("[payment-proofs] not saved:", error);
    return Response.json({ error: "The picture was not saved. Try again." }, { status: 500 });
  }
}
