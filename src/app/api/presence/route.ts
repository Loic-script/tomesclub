import { NextResponse } from "next/server";
import { touchPresence } from "@/lib/members";
import { getCurrentUser } from "@/lib/session";

// Le navigateur appelle cette adresse toutes les minutes : "je suis toujours là".
// C'est ce qui allume le point vert "en ligne" chez les autres membres.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await touchPresence(user.id);
  return NextResponse.json({ ok: true });
}
