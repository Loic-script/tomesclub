import "server-only";
import { formatEventPrice } from "@/lib/event-price";
import { connection } from "next/server";
import { listAdminNotifications, type AdminNotificationItem } from "@/lib/admin-notifications";
import { ENGLISH_LEVELS } from "@/lib/onboarding-options";
import { prisma } from "@/lib/prisma";
import { getActivityMap } from "@/lib/activities";
import { createRoomServiceClient } from "@/lib/livekit";
import { ROOM_PREFIX, roomEndsAt, roomIsOver } from "@/lib/rooms";

/**
 * Les salles vraiment en direct : ouvertes sur le serveur vidéo ET avec au moins une personne dedans.
 * (id de la salle → nombre de personnes). null = serveur vidéo injoignable.
 */
async function liveRoomPeople(): Promise<Map<string, number> | null> {
  try {
    const rooms = await createRoomServiceClient().listRooms();
    return new Map(
      rooms
        .filter((room) => room.name.startsWith(ROOM_PREFIX) && Number(room.numParticipants) > 0)
        .map((room) => [room.name.slice(ROOM_PREFIX.length), Number(room.numParticipants)]),
    );
  } catch (error) {
    console.warn("[admin-stats] serveur vidéo injoignable", error);
    return null;
  }
}

// Les chiffres du tableau de bord admin (tout est lu au moment de la requête).

const DAY_MS = 24 * 60 * 60 * 1000;
const ONLINE_MS = 2 * 60 * 1000;
/** Le graphique des inscriptions couvre ces derniers jours. */
export const SIGNUP_DAYS = 14;

export type DashboardData = {
  today: string;
  totals: {
    members: number;
    newThisWeek: number;
    completed: number;
    online: number;
    openRooms: number;
    calls: number;
    callsThisWeek: number;
    upcomingEvents: number;
  };
  signups: { day: string; label: string; count: number }[];
  levels: { value: string; label: string; count: number }[];
  rooms: {
    id: string;
    name: string;
    icon: string | null;
    activity: string | null;
    topic: string | null;
    host: string;
    isPrivate: boolean;
    endsAt: string | null;
  }[];
  events: { id: string; title: string; startsAt: Date; registered: number; priceLabel: string }[];
  activity: AdminNotificationItem[];
  newest: { id: string; name: string; email: string; hasPhoto: boolean; createdAt: Date }[];
};

export async function loadDashboard(): Promise<DashboardData> {
  await connection();
  const now = Date.now();
  const weekAgo = new Date(now - 7 * DAY_MS);
  const chartStart = new Date(now - (SIGNUP_DAYS - 1) * DAY_MS);
  chartStart.setUTCHours(0, 0, 0, 0);

  // D'abord : quelles salles ont vraiment du monde en ce moment ?
  const live = await liveRoomPeople();

  const [
    members,
    newThisWeek,
    completed,
    online,
    calls,
    callsThisWeek,
    recentUsers,
    levelGroups,
    roomRows,
    eventRows,
    activity,
    newestRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.profile.count({ where: { completedAt: { not: null } } }),
    prisma.profile.count({ where: { lastSeenAt: { gte: new Date(now - ONLINE_MS) } } }),
    prisma.call.count(),
    prisma.call.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.findMany({ where: { createdAt: { gte: chartStart } }, select: { createdAt: true } }),
    prisma.profile.groupBy({
      by: ["englishLevel"],
      where: { completedAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.room.findMany({
      // Seulement les salles en direct (si le serveur vidéo ne répond pas : les plus récentes).
      where: live ? { id: { in: [...live.keys()] } } : {},
      orderBy: { createdAt: "desc" },
      take: live ? 100 : 12,
      select: {
        id: true,
        name: true,
        topic: true,
        activity: true,
        isPrivate: true,
        durationMin: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.event.findMany({
      where: { kind: "event", status: "published", startsAt: { gte: new Date(now - 2 * 60 * 60 * 1000) } },
      orderBy: { startsAt: "asc" },
      take: 4,
      select: {
        id: true,
        title: true,
        startsAt: true,
        isPaid: true,
        price: true,
        currency: true,
        responses: { select: { status: true } },
      },
    }),
    listAdminNotifications(7),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        profile: { select: { firstName: true, lastName: true, photoType: true } },
      },
    }),
  ]);

  // Les inscriptions jour par jour (jours UTC).
  const byDay = new Map<string, number>();
  for (const user of recentUsers) {
    const key = user.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const signups = Array.from({ length: SIGNUP_DAYS }, (_, index) => {
    const date = new Date(chartStart.getTime() + index * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    return { day: key, label: dayLabel.format(date), count: byDay.get(key) ?? 0 };
  });

  const levels = ENGLISH_LEVELS.map((level) => ({
    value: level.value,
    label: level.label,
    count: levelGroups.find((group) => group.englishLevel === level.value)?._count._all ?? 0,
  }));

  // En direct = du monde dedans maintenant, et le temps n'est pas fini.
  const liveRooms = roomRows.filter((room) => !roomIsOver(room) && (!live || live.has(room.id)));
  const activities = await getActivityMap(liveRooms.map((room) => room.activity));
  const rooms = liveRooms
    .slice(0, 5)
    .map((room) => {
      const found = room.activity ? activities.get(room.activity) : undefined;
      const end = roomEndsAt(room);
      return {
        id: room.id,
        name: room.name,
        icon: found?.icon ?? null,
        activity: found?.name ?? null,
        topic: room.topic,
        host: room.createdBy?.name ?? "Admin",
        isPrivate: room.isPrivate,
        endsAt: end ? new Date(end).toISOString() : null,
      };
    });

  const events = eventRows.map((event) => ({
    id: event.id,
    title: event.title,
    startsAt: event.startsAt ?? new Date(now),
    registered: event.responses.filter((response) => response.status === "registered").length,
    priceLabel: formatEventPrice(event),
  }));

  const upcomingEvents = await prisma.event.count({
    where: { kind: "event", status: "published", startsAt: { gte: new Date(now) } },
  });

  return {
    today: new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(now)),
    totals: {
      members,
      newThisWeek,
      completed,
      online,
      openRooms: liveRooms.length,
      calls,
      callsThisWeek,
      upcomingEvents,
    },
    signups,
    levels,
    rooms,
    events,
    activity,
    newest: newestRows.map((user) => ({
      id: user.id,
      name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.name,
      email: user.email,
      hasPhoto: Boolean(user.profile?.photoType),
      createdAt: user.createdAt,
    })),
  };
}
