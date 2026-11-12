import "server-only";
import { notifyAdmin } from "@/lib/admin-notifications";
import { MAX_MESSAGE_LENGTH, type ChatMessage, type Conversation } from "@/lib/chat-types";
import { prisma } from "@/lib/prisma";

// La messagerie entre le coach (admin) et chaque membre.
// Une discussion par membre : toutes les lignes qui ont son userId.

/** Combien de messages on montre dans une discussion (les plus récents). */
const THREAD_LIMIT = 200;

type Row = { id: string; fromCoach: boolean; body: string; createdAt: Date };

const toMessage = (row: Row): ChatMessage => ({
  id: row.id,
  fromCoach: row.fromCoach,
  body: row.body,
  createdAt: row.createdAt.toISOString(),
});

/** Nettoie le texte tapé. null = message vide ou pas du texte. */
export function cleanMessage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim().slice(0, MAX_MESSAGE_LENGTH);
  return text || null;
}

/** Les messages d'une discussion, du plus vieux au plus récent. */
export async function listThread(userId: string): Promise<ChatMessage[]> {
  const rows = await prisma.coachMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: THREAD_LIMIT,
    select: { id: true, fromCoach: true, body: true, createdAt: true },
  });
  return rows.reverse().map(toMessage);
}

/** Un membre écrit au coach. L'admin reçoit une notification (une seule tant qu'il n'a pas lu). */
export async function sendMemberMessage(user: { id: string; name: string }, body: string): Promise<ChatMessage> {
  const alreadyWaiting = await prisma.coachMessage.count({
    where: { userId: user.id, fromCoach: false, readAt: null },
  });
  const row = await prisma.coachMessage.create({
    data: { userId: user.id, fromCoach: false, body },
    select: { id: true, fromCoach: true, body: true, createdAt: true },
  });
  if (alreadyWaiting === 0) {
    await notifyAdmin({
      kind: "message",
      title: `${user.name} sent you a message`,
      body,
      link: `/admin/messages?m=${user.id}`,
    });
  }
  return toMessage(row);
}

/** Le coach écrit à un membre. null = ce membre n'existe pas. */
export async function sendCoachMessage(userId: string, body: string): Promise<ChatMessage | null> {
  const member = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!member) return null;
  const row = await prisma.coachMessage.create({
    data: { userId, fromCoach: true, body },
    select: { id: true, fromCoach: true, body: true, createdAt: true },
  });
  return toMessage(row);
}

/** Le membre a ouvert la discussion : les messages du coach sont lus. */
export async function markReadByMember(userId: string): Promise<void> {
  await prisma.coachMessage.updateMany({
    where: { userId, fromCoach: true, readAt: null },
    data: { readAt: new Date() },
  });
}

/** Le coach a ouvert la discussion : les messages du membre sont lus. */
export async function markReadByCoach(userId: string): Promise<void> {
  await prisma.coachMessage.updateMany({
    where: { userId, fromCoach: false, readAt: null },
    data: { readAt: new Date() },
  });
}

/** Pastille du bouton flottant du membre. */
export async function countUnreadForMember(userId: string): Promise<number> {
  return prisma.coachMessage.count({ where: { userId, fromCoach: true, readAt: null } });
}

/** Pastille de l'onglet "Messages" de l'admin. */
export async function countUnreadForCoach(): Promise<number> {
  return prisma.coachMessage.count({ where: { fromCoach: false, readAt: null } });
}

/**
 * Tous les membres, pour la liste de l'admin : ceux qui ont écrit en dernier d'abord,
 * puis les autres par prénom (pour commencer une nouvelle discussion).
 */
export async function listConversations(): Promise<Conversation[]> {
  const [users, unread] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        profile: { select: { firstName: true, lastName: true, photoType: true } },
        coachMessages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, fromCoach: true, createdAt: true },
        },
      },
    }),
    prisma.coachMessage.groupBy({
      by: ["userId"],
      where: { fromCoach: false, readAt: null },
      _count: { _all: true },
    }),
  ]);
  const unreadBy = new Map(unread.map((row) => [row.userId, row._count._all]));

  const list = users.map((user): Conversation => {
    const last = user.coachMessages[0];
    const fullName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : "";
    return {
      userId: user.id,
      name: fullName || user.name,
      hasPhoto: Boolean(user.profile?.photoType),
      lastBody: last?.body ?? null,
      lastFromCoach: last?.fromCoach ?? false,
      lastAt: last?.createdAt.toISOString() ?? null,
      unread: unreadBy.get(user.id) ?? 0,
    };
  });

  return list.sort((a, b) => {
    if (a.lastAt && b.lastAt) return a.lastAt < b.lastAt ? 1 : -1;
    if (a.lastAt) return -1;
    if (b.lastAt) return 1;
    return a.name.localeCompare(b.name);
  });
}
