import "server-only";
import { notifyMembers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { openLiveKitRoom } from "@/lib/rooms";

// Les salles privées :
//  - un simple membre ne peut pas en ouvrir ;
//  - un Leader / Teacher peut, mais l'admin doit d'abord accepter ;
//  - l'admin en ouvre directement ;
//  - seuls l'hôte, l'admin et les membres invités par l'hôte peuvent entrer.

/** Qui peut ouvrir une salle privée, et comment. */
export type PrivateRoomMode = "locked" | "approval" | "direct";

/** member → "locked" ; leader / teacher → "approval" (l'admin doit accepter). */
export async function privateModeFor(userId: string): Promise<PrivateRoomMode> {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { role: true } });
  return profile?.role === "leader" || profile?.role === "teacher" ? "approval" : "locked";
}

export type InvitableMember = { id: string; name: string; hasPhoto: boolean };

/** Les membres qu'on peut inviter (fiche terminée), sauf moi. */
export async function listInvitableMembers(exceptUserId: string | null): Promise<InvitableMember[]> {
  const rows = await prisma.profile.findMany({
    where: { completedAt: { not: null }, ...(exceptUserId ? { userId: { not: exceptUserId } } : {}) },
    orderBy: { firstName: "asc" },
    select: { userId: true, firstName: true, lastName: true, photoType: true },
  });
  return rows.map((row) => ({
    id: row.userId,
    name: `${row.firstName} ${row.lastName}`.trim(),
    hasPhoto: Boolean(row.photoType),
  }));
}

/** Prévient les membres invités dans une salle privée. */
export async function notifyInvitees(roomId: string, hostName: string, roomName: string): Promise<void> {
  const invites = await prisma.roomInvite.findMany({ where: { roomId }, select: { userId: true } });
  await notifyMembers(
    invites.map((invite) => invite.userId),
    {
      kind: "room",
      title: `${hostName} invites you to a private room`,
      body: roomName,
      link: `/room/${roomId}`,
    },
  );
}

/** Le nom de l'hôte (prénom), ou "Admin". */
async function hostNameOf(createdById: string | null): Promise<string> {
  if (!createdById) return "Admin";
  const user = await prisma.user.findUnique({
    where: { id: createdById },
    select: { name: true, profile: { select: { firstName: true } } },
  });
  return user?.profile?.firstName ?? user?.name ?? "A member";
}

/**
 * L'admin accepte : la salle s'ouvre dans LiveKit, son temps commence maintenant,
 * l'hôte et les invités reçoivent une notification.
 */
export async function approvePrivateRoom(roomId: string): Promise<boolean> {
  const room = await prisma.room.findFirst({
    where: { id: roomId, pendingApproval: true },
    select: { id: true, name: true, createdById: true, maxParticipants: true },
  });
  if (!room) return false;

  await openLiveKitRoom(room.id, room.maxParticipants ?? 20);
  // Le compte à rebours part de l'accord (et pas de la demande).
  await prisma.room.update({ where: { id: room.id }, data: { pendingApproval: false, createdAt: new Date() } });

  const host = await hostNameOf(room.createdById);
  if (room.createdById) {
    await notifyMembers([room.createdById], {
      kind: "room",
      title: "Your private room is approved ✓",
      body: `${room.name} · You can start now.`,
      link: `/room/${room.id}`,
    });
  }
  await notifyInvitees(room.id, host, room.name);
  return true;
}

/** L'admin refuse : la salle est supprimée, l'hôte est prévenu. */
export async function refusePrivateRoom(roomId: string): Promise<void> {
  const room = await prisma.room.findFirst({
    where: { id: roomId, pendingApproval: true },
    select: { id: true, name: true, createdById: true },
  });
  if (!room) return;
  await prisma.room.delete({ where: { id: room.id } });
  if (room.createdById) {
    await notifyMembers([room.createdById], {
      kind: "room",
      title: "Your private room was not approved",
      body: `${room.name} · You can open a public room instead.`,
      link: "/rooms",
    });
  }
}

export type PendingRoom = {
  id: string;
  name: string;
  topic: string | null;
  activity: string | null;
  durationMin: number | null;
  hostId: string | null;
  hostName: string;
  hostRole: string;
  invitees: string[];
  createdAt: Date;
};

/** Les demandes de salles privées qui attendent l'admin. */
export async function listPendingRooms(): Promise<PendingRoom[]> {
  const rows = await prisma.room.findMany({
    where: { pendingApproval: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      topic: true,
      activity: true,
      durationMin: true,
      createdAt: true,
      createdById: true,
      createdBy: { select: { name: true, profile: { select: { firstName: true, lastName: true, role: true } } } },
      invites: {
        select: { user: { select: { name: true, profile: { select: { firstName: true, lastName: true } } } } },
      },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    topic: row.topic,
    activity: row.activity,
    durationMin: row.durationMin,
    hostId: row.createdById,
    hostName: row.createdBy?.profile
      ? `${row.createdBy.profile.firstName} ${row.createdBy.profile.lastName}`
      : (row.createdBy?.name ?? "Admin"),
    hostRole: row.createdBy?.profile?.role ?? "member",
    invitees: row.invites.map((invite) =>
      invite.user.profile ? `${invite.user.profile.firstName} ${invite.user.profile.lastName}` : invite.user.name,
    ),
    createdAt: row.createdAt,
  }));
}

/** Ce membre a-t-il été invité dans cette salle ? */
export async function isInvited(roomId: string, userId: string): Promise<boolean> {
  const invite = await prisma.roomInvite.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { roomId: true },
  });
  return Boolean(invite);
}
