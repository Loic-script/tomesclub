"use server";

import { markGuideSeen } from "@/lib/guide";
import { requireMember } from "@/lib/session";

/** Le membre a fermé le guide qui s'était ouvert tout seul : il ne s'ouvrira plus automatiquement. */
export async function markGuideSeenAction(): Promise<void> {
  const user = await requireMember();
  await markGuideSeen(user.id);
}
