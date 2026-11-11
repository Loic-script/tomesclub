"use server";

import { redirect } from "next/navigation";
import { readRoomForm } from "@/lib/room-form";
import { createRoom, deleteRoomByHost } from "@/lib/rooms";
import { requireMember } from "@/lib/session";

export type CreateRoomState = { error: string | null };

/** Formulaire "Create a room" : vérifie les choix, crée la salle puis y entre directement. */
export async function createRoomAction(
  _prevState: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const user = await requireMember();

  const input = await readRoomForm(formData);
  if (typeof input === "string") return { error: input };

  let roomId: string;
  try {
    const room = await createRoom(user.id, input);
    roomId = room.id;
  } catch (error) {
    console.error("[createRoomAction]", error);
    return { error: "Could not create the room. Is the video server running?" };
  }

  redirect(`/room/${roomId}`);
}

/** Bouton "Delete" de l hôte : ferme la salle (tout le monde sort) et la supprime. */
export async function deleteRoomAction(roomId: string): Promise<void> {
  const user = await requireMember();
  await deleteRoomByHost(user.id, roomId);
}
