import "server-only";
import { randomUUID } from "node:crypto";
import { rm, stat } from "node:fs/promises";
import path from "node:path";
import { notifyAdmin } from "@/lib/admin-notifications";
import { cleanFileName, safeExtension, storageRoot, writeUpload } from "@/lib/activity-files";
import { MAX_MESSAGE_LENGTH, messagePreview, type ChatMessage, type Conversation } from "@/lib/chat-types";
import { fileKindOf } from "@/lib/file-kinds";
import { prisma } from "@/lib/prisma";

// La messagerie entre le coach (admin) et chaque membre.
// Une discussion par membre : toutes les lignes qui ont son userId.
// Les fichiers joints sont sur le disque : <dossier des fichiers>/chat-files/<id du message>.<ext>

/** Combien de messages on montre dans une discussion (les plus récents). */
const THREAD_LIMIT = 200;

const SELECT = {
  id: true,
  fromCoach: true,
  body: true,
  fileName: true,
  fileMime: true,
  fileSize: true,
  fileKind: true,
  createdAt: true,
} as const;

type Row = {
  id: string;
  fromCoach: boolean;
  body: string;
  fileName: string | null;
  fileMime: string | null;
  fileSize: number | null;
  fileKind: string | null;
  createdAt: Date;
};

const toMessage = (row: Row): ChatMessage => ({
  id: row.id,
  fromCoach: row.fromCoach,
  body: row.body,
  file: row.fileName
    ? {
        name: row.fileName,
        mime: row.fileMime ?? "application/octet-stream",
        size: row.fileSize ?? 0,
        kind: row.fileKind ?? "other",
        url: `/api/chat-files/${row.id}`,
      }
    : null,
  createdAt: row.createdAt.toISOString(),
});

function chatFilePath(id: string, name: string): string {
  return path.join(storageRoot(), "chat-files", `${id}${safeExtension(name)}`);
}

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
    select: SELECT,
  });
  return rows.reverse().map(toMessage);
}

type NewFile = { name: string; mime: string; body: ReadableStream<Uint8Array> };

/** Taille max d'un fichier envoyé par un membre dans le chat. */
const MEMBER_CHAT_MAX_BYTES = 100 * 1024 * 1024;

/** Enregistre un message (texte et/ou fichier). */
async function createMessage(userId: string, fromCoach: boolean, body: string, file?: NewFile): Promise<ChatMessage> {
  if (!file) {
    const row = await prisma.coachMessage.create({ data: { userId, fromCoach, body }, select: SELECT });
    return toMessage(row);
  }
  const id = randomUUID();
  const name = cleanFileName(file.name);
  const target = chatFilePath(id, name);
  // Un membre : 100 Mo par fichier au plus (le disque ne se remplit pas) ; l'admin : la grande limite.
  const size = await writeUpload(file.body, target, fromCoach ? undefined : MEMBER_CHAT_MAX_BYTES);
  try {
    const row = await prisma.coachMessage.create({
      data: {
        id,
        userId,
        fromCoach,
        body,
        fileName: name,
        fileMime: file.mime || "application/octet-stream",
        fileSize: size,
        fileKind: fileKindOf(name, file.mime),
      },
      select: SELECT,
    });
    return toMessage(row);
  } catch (error) {
    await rm(target, { force: true });
    throw error;
  }
}

/** Un membre écrit au coach. L'admin reçoit une notification (une seule tant qu'il n'a pas lu). */
export async function sendMemberMessage(
  user: { id: string; name: string },
  body: string,
  file?: NewFile,
): Promise<ChatMessage> {
  const alreadyWaiting = await prisma.coachMessage.count({
    where: { userId: user.id, fromCoach: false, readAt: null },
  });
  const message = await createMessage(user.id, false, body, file);
  if (alreadyWaiting === 0) {
    await notifyAdmin({
      kind: "message",
      title: `${user.name} sent you a message`,
      body: messagePreview(body, message.file?.name),
      link: `/admin/messages?m=${user.id}`,
    });
  }
  return message;
}

/** Le coach écrit à un membre. null = ce membre n'existe pas. */
export async function sendCoachMessage(userId: string, body: string, file?: NewFile): Promise<ChatMessage | null> {
  const member = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!member) return null;
  return createMessage(userId, true, body, file);
}

/** Le fichier joint d'un message, si la personne a le droit de le voir (admin, ou le membre de la discussion). */
export async function openChatFile(
  id: string,
  viewer: { admin: true } | { userId: string },
): Promise<{ path: string; size: number; mime: string; name: string } | null> {
  const row = await prisma.coachMessage.findUnique({
    where: { id },
    select: { userId: true, fileName: true, fileMime: true },
  });
  if (!row?.fileName) return null;
  if (!("admin" in viewer) && viewer.userId !== row.userId) return null;
  const file = chatFilePath(id, row.fileName);
  const info = await stat(file).catch(() => null);
  if (!info) return null;
  return { path: file, size: info.size, mime: row.fileMime ?? "application/octet-stream", name: row.fileName };
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
          select: { body: true, fileName: true, fromCoach: true, createdAt: true },
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
      lastBody: last ? messagePreview(last.body, last.fileName) : null,
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
