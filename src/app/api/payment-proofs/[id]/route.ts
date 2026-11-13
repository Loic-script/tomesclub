import { fileResponse } from "@/lib/activity-files";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { openPaymentProof } from "@/lib/payment-proofs";

// GET /api/payment-proofs/<id> : la capture de paiement.
// Visible par l'admin et par le membre qui l'a envoyée.
export async function GET(request: Request, ctx: RouteContext<"/api/payment-proofs/[id]">) {
  const { id } = await ctx.params;

  let file;
  if (await isAdmin()) {
    file = await openPaymentProof(id, { admin: true });
  } else {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });
    file = await openPaymentProof(id, { userId: session.user.id });
  }
  if (!file) return new Response("Not found", { status: 404 });

  return fileResponse(request, file);
}
