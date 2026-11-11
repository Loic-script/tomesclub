"use server";

import { redirect } from "next/navigation";
import {
  DEFAULT_PEOPLE,
  findActivity,
  ROOM_DURATIONS,
  ROOM_LEVELS,
  ROOM_MAX_PEOPLE,
  ROOM_MIN_PEOPLE,
} from "@/lib/room-activities";
import { createRoom, deleteRoomByHost } from "@/lib/rooms";
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
  if (durationMin === null) return { error: "Please choose a duration between 1 and 30 minutes." };

  // La limite de personnes : un nombre entre 2 et 20.
  const people = Math.round(Number(formData.get("maxParticipants")));
  const maxParticipants = Number.isFinite(people)
    ? Math.min(ROOM_MAX_PEOPLE, Math.max(ROOM_MIN_PEOPLE, people))
    : DEFAULT_PEOPLE;

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
      maxParticipants,
    });
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
