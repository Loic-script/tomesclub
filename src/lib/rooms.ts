import "server-only";
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
};

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
      createdById: creatorId,
    },
    select: { id: true },
  });

  try {
    await createRoomServiceClient().createRoom({
      name: `${ROOM_PREFIX}${room.id}`,
      emptyTimeout: EMPTY_TIMEOUT_SECONDS,
      maxParticipants: MAX_PARTICIPANTS,
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
      createdAt: true,
      createdById: true,
      createdBy: { select: { name: true, profile: { select: { firstName: true } } } },
    },
  });

  const participantsById = new Map(
    open.map((room) => [room.name.slice(ROOM_PREFIX.length), Number(room.numParticipants)]),
  );

  return rows.map((row) => ({
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
    endsAt: row.durationMin
      ? new Date(row.createdAt.getTime() + row.durationMin * 60 * 1000).toISOString()
      : null,
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
      createdAt: true,
    },
  });
}
