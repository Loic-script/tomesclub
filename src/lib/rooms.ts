import "server-only";
import { connection } from "next/server";
import { createRoomServiceClient } from "@/lib/livekit";
import { notifyAllMembers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { findActivity } from "@/lib/room-activities";

// Les salles de groupe (rooms), ouvertes à tous les membres.

/** Préfixe des salles LiveKit, pour ne pas mélanger avec les appels privés. */
export const ROOM_PREFIX = "room_";

/** La salle LiveKit se ferme 10 minutes après le départ de la dernière personne. */
const EMPTY_TIMEOUT_SECONDS = 10 * 60;
const MAX_PARTICIPANTS = 30;

export type OpenRoom = {
  id: string;
  name: string;
  topic: string | null;
  hostName: string;
  participants: number;
  isPrivate: boolean;
  isMine: boolean;
  activity: string | null;
  format: string | null;
  durationMin: number | null;
  level: string | null;
  /** Fin prévue (texte ISO) : création + durée. Null si pas de durée. */
  endsAt: string | null;
  /** Le nombre de places (null = ancienne salle sans limite choisie). */
  maxParticipants: number | null;
};

/** La fin prévue d'une salle (en ms), ou null si elle n'a pas de durée. */
export function roomEndsAt(room: { createdAt: Date; durationMin: number | null }): number | null {
  return room.durationMin ? room.createdAt.getTime() + room.durationMin * 60 * 1000 : null;
}

/** Le temps de la salle est-il fini ? (à appeler après connection()) */
export function roomIsOver(room: { createdAt: Date; durationMin: number | null }): boolean {
  const end = roomEndsAt(room);
  return end !== null && Date.now() >= end;
}

/**
 * Ferme une salle pour de bon : LiveKit fait sortir tout le monde,
 * puis la salle est supprimée de la base.
 */
export async function closeRoom(id: string): Promise<void> {
  try {
    await createRoomServiceClient().deleteRoom(`${ROOM_PREFIX}${id}`);
  } catch (error) {
    // Déjà fermée dans LiveKit (ou serveur vidéo injoignable) : on supprime quand même.
    console.warn("[closeRoom]", error);
  }
  await prisma.room.deleteMany({ where: { id } });
}

/** L'hôte supprime sa salle. Renvoie false si ce n'est pas sa salle. */
export async function deleteRoomByHost(userId: string, roomId: string): Promise<boolean> {
  const room = await prisma.room.findFirst({
    where: { id: roomId, createdById: userId },
    select: { id: true },
  });
  if (!room) return false;
  await closeRoom(room.id);
  return true;
}

/** Les personnes dans la salle LiveKit (leurs identifiants). Null = serveur injoignable. */
export async function listRoomPeople(id: string): Promise<string[] | null> {
  try {
    const people = await createRoomServiceClient().listParticipants(`${ROOM_PREFIX}${id}`);
    return people.map((person) => person.identity);
  } catch (error) {
    console.warn("[listRoomPeople]", error);
    return null;
  }
}

/** Ce que l'hôte choisit en créant la salle. */
export type NewRoom = {
  name: string;
  topic: string | null;
  isPrivate: boolean;
  activity: string | null;
  description: string | null;
  format: string | null;
  level: string | null;
  durationMin: number | null;
  maxParticipants: number;
};

/** Crée une salle : d'abord dans la base, puis dans LiveKit. */
export async function createRoom(creatorId: string, input: NewRoom): Promise<{ id: string }> {
  const { name, topic, isPrivate } = input;
  const room = await prisma.room.create({
    data: {
      name: name.slice(0, 60),
      topic,
      isPrivate,
      activity: input.activity,
      description: input.description,
      format: input.format,
      level: input.level,
      durationMin: input.durationMin,
      maxParticipants: input.maxParticipants,
      createdById: creatorId,
    },
    select: { id: true },
  });

  try {
    await createRoomServiceClient().createRoom({
      name: `${ROOM_PREFIX}${room.id}`,
      emptyTimeout: EMPTY_TIMEOUT_SECONDS,
      // LiveKit refuse lui-même les personnes en trop.
      maxParticipants: Math.min(input.maxParticipants, MAX_PARTICIPANTS),
    });
  } catch (error) {
    await prisma.room.delete({ where: { id: room.id } });
    throw error;
  }

  // Une salle ouverte à tous : on prévient les membres (les salles privées, non).
  if (!isPrivate) {
    const host = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { name: true },
    });
    const activity = findActivity(input.activity);
    await notifyAllMembers(
      {
        kind: "room",
        title: activity
          ? `New room: ${name.slice(0, 60)} · ${activity.name}`
          : `New room: ${name.slice(0, 60)}`,
        body: topic
          ? `${host?.name ?? "A member"} · ${topic}`
          : `${host?.name ?? "A member"} opened a room. Come and practice!`,
        link: `/room/${room.id}`,
      },
      creatorId,
    );
  }

  return room;
}

/**
 * Les salles encore ouvertes dans LiveKit, avec le nombre de personnes dedans.
 * Les salles privées des autres sont cachées ; les miennes restent visibles pour moi.
 * Null = serveur vidéo injoignable.
 */
export async function listOpenRooms(viewerId: string): Promise<OpenRoom[] | null> {
  let liveRooms;
  try {
    liveRooms = await createRoomServiceClient().listRooms();
  } catch (error) {
    console.error("[listOpenRooms] serveur LiveKit indisponible", error);
    return null;
  }

  const open = liveRooms.filter((room) => room.name.startsWith(ROOM_PREFIX));
  if (open.length === 0) return [];

  const rows = await prisma.room.findMany({
    where: {
      id: { in: open.map((room) => room.name.slice(ROOM_PREFIX.length)) },
      OR: [{ isPrivate: false }, { createdById: viewerId }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      topic: true,
      isPrivate: true,
      activity: true,
      format: true,
      durationMin: true,
      level: true,
      maxParticipants: true,
      createdAt: true,
      createdById: true,
      createdBy: { select: { name: true, profile: { select: { firstName: true } } } },
    },
  });

  // Les salles dont le temps est fini : on les cache et on les ferme dans LiveKit.
  await connection();
  const finished = rows.filter(roomIsOver);
  if (finished.length > 0) {
    await Promise.allSettled(finished.map((row) => closeRoom(row.id)));
  }
  const stillOpen = rows.filter((row) => !finished.includes(row));

  const participantsById = new Map(
    open.map((room) => [room.name.slice(ROOM_PREFIX.length), Number(room.numParticipants)]),
  );

  return stillOpen.map((row) => ({
    id: row.id,
    name: row.name,
    topic: row.topic,
    hostName: row.createdBy.profile?.firstName ?? row.createdBy.name,
    participants: participantsById.get(row.id) ?? 0,
    isPrivate: row.isPrivate,
    isMine: row.createdById === viewerId,
    activity: row.activity,
    format: row.format,
    durationMin: row.durationMin,
    level: row.level,
    endsAt: row.durationMin ? new Date(roomEndsAt(row)!).toISOString() : null,
    maxParticipants: row.maxParticipants,
  }));
}

/** Une salle, si elle existe dans la base. */
export function getRoom(id: string) {
  return prisma.room.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      topic: true,
      activity: true,
      description: true,
      format: true,
      level: true,
      durationMin: true,
      maxParticipants: true,
      createdAt: true,
    },
  });
}
