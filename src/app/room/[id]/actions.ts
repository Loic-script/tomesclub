"use server";

import { closeRoom, getRoom, roomIsOver } from "@/lib/rooms";
import { requireMember } from "@/lib/session";

/**
 * Appelée par le navigateur quand le compte à rebours arrive à 0.
 * Le serveur vérifie lui-même que le temps est bien fini, puis ferme la salle
 * (tout le monde sort) et la supprime.
 */
export async function endRoomIfOver(roomId: string): Promise<void> {
  await requireMember();
  const room = await getRoom(roomId);
  if (!room || !roomIsOver(room)) return;
  await closeRoom(room.id);
}
