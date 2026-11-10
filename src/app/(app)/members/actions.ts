"use server";

import { followMember, unfollowMember } from "@/lib/members";
import { requireMember } from "@/lib/session";

// Les actions des boutons "Follow" / "Following".

/** `next` = true pour suivre, false pour ne plus suivre. */
export async function toggleFollowAction(memberId: string, next: boolean): Promise<void> {
  const user = await requireMember();
  if (next) {
    await followMember(user.id, memberId);
  } else {
    await unfollowMember(user.id, memberId);
  }
}
