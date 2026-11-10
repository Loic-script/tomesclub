"use server";

import { redirect } from "next/navigation";
import { findActivity, ROOM_DURATIONS, ROOM_LEVELS } from "@/lib/room-activities";
import { createRoom } from "@/lib/rooms";
import { requireMember } from "@/lib/session";

export type CreateRoomState = { error: string | null };

const text = (formData: FormData, key: string, max: number) =>
  String(formData.get(key) ?? "").trim().slice(0, max);

/** Formulaire "Create a room" : vérifie les choix, crée la salle puis y entre directement. */
export async function createRoomAction(
  _prevState: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const user = await requireMember();

  // Le formulaire ne vaut pas confiance : on vérifie chaque valeur avec le catalogue.
  const activity = findActivity(text(formData, "activity", 60));
  if (!activity) return { error: "Please choose an activity." };

  const topic = text(formData, "topic", 160);
  if (!topic) return { error: "Please choose or write a theme." };

  const name = text(formData, "name", 60) || activity.name;
  const description = text(formData, "description", 600);
  const isPrivate = formData.get("visibility") === "private";

  const formatValue = text(formData, "format", 60);
  const format = activity.formats.includes(formatValue) ? formatValue : activity.formats[0];

  const levelValue = text(formData, "level", 20);
  const level = ROOM_LEVELS.some((entry) => entry.value === levelValue) ? levelValue : "all";

  const minutes = Number(formData.get("duration"));
  const durationMin = (ROOM_DURATIONS as readonly number[]).includes(minutes) ? minutes : null;
  if (durationMin === null) return { error: "Please choose a duration between 5 and 30 minutes." };

  let roomId: string;
  try {
    const room = await createRoom(user.id, {
      name,
      topic,
      isPrivate,
      activity: activity.key,
      description: description || null,
      format,
      level,
      durationMin,
    });
    roomId = room.id;
  } catch (error) {
    console.error("[createRoomAction]", error);
    return { error: "Could not create the room. Is the video server running?" };
  }

  redirect(`/room/${roomId}`);
}
