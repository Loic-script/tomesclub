"use server";

import { redirect } from "next/navigation";
import { createRoom } from "@/lib/rooms";
import { requireMember } from "@/lib/session";

export type CreateRoomState = { error: string | null };

/** Formulaire "Create a room" : crée la salle puis y entre directement. */
export async function createRoomAction(
  _prevState: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const user = await requireMember();

  const name = String(formData.get("name") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim().slice(0, 80);
  if (!name) return { error: "Please give your room a name." };

  let roomId: string;
  try {
    const room = await createRoom(user.id, name, topic || null);
    roomId = room.id;
  } catch (error) {
    console.error("[createRoomAction]", error);
    return { error: "Could not create the room. Is the video server running?" };
  }

  redirect(`/room/${roomId}`);
}
