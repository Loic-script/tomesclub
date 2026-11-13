import { listActiveRings } from "@/lib/rings";
import { getCurrentUser } from "@/lib/session";

// GET /api/rings → { rings: [...] } : les appels qui sonnent encore chez le membre connecté.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ rings: [] }, { status: 401 });
  return Response.json({ rings: await listActiveRings(user.id) });
}
