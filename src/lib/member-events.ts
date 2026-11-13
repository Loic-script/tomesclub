import "server-only";
import { notifyAdmin } from "@/lib/admin-notifications";
import { formatEventPrice } from "@/lib/event-price";
import type { EventInput } from "@/lib/event-form";
import { notifyAllMembers, notifyMembers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

// Les événements proposés par les Leaders / Teachers :
//  - la demande est gratuite, mais l'admin doit l'accepter avant qu'elle soit publiée ;
//  - événement payant : les membres paient l'admin (MVola), puis on partage :
//    l'admin garde 40 %, l'organisateur reçoit 60 %.

export const ADMIN_SHARE = 0.4;
export const HOST_SHARE = 0.6;

/** Seuls les Leaders et les Teachers peuvent proposer un événement. */
export async function canProposeEvents(userId: string): Promise<boolean> {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { role: true } });
  return profile?.role === "leader" || profile?.role === "teacher";
}

/** Un Leader / Teacher propose un événement : il attend l'accord de l'admin. */
export async function proposeEvent(userId: string, hostName: string, input: EventInput): Promise<string> {
  const event = await prisma.event.create({
    select: { id: true },
    data: {
      kind: "event",
      status: "pending",
      createdById: userId,
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      isPaid: input.isPaid,
      price: input.price,
      currency: input.currency,
      activity: input.activity,
      topic: input.topic,
      durationMin: input.durationMin,
      maxParticipants: input.maxParticipants,
      image: input.image?.bytes ?? null,
      imageType: input.image?.type ?? null,
    },
  });
  await notifyAdmin({
    kind: "event",
    title: `${hostName} proposes an event`,
    body: `${input.title} · ${input.isPaid ? formatEventPrice(input) : "Free"} · accept or refuse it in Events`,
    link: "/admin/events",
  });
  return event.id;
}

/** L'admin accepte : l'événement est publié, tous les membres et l'organisateur sont prévenus. */
export async function approveEventRequest(eventId: string): Promise<void> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, status: "pending" },
    select: { id: true, title: true, startsAt: true, createdById: true },
  });
  if (!event) return;
  await prisma.event.update({ where: { id: event.id }, data: { status: "published" } });
  if (event.createdById) {
    await notifyMembers([event.createdById], {
      kind: "event",
      title: "Your event is approved ✓",
      body: `${event.title} is now published. Members can register.`,
      link: "/events",
    });
  }
  await notifyAllMembers(
    {
      kind: "event",
      title: `New class: ${event.title}`,
      body: event.startsAt
        ? new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }).format(event.startsAt)
        : "A new event is published.",
      link: "/events",
    },
    event.createdById ?? undefined,
  );
}

/** L'admin refuse : l'organisateur est prévenu. */
export async function refuseEventRequest(eventId: string): Promise<void> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, status: "pending" },
    select: { id: true, title: true, createdById: true },
  });
  if (!event) return;
  await prisma.event.update({ where: { id: event.id }, data: { status: "refused" } });
  if (event.createdById) {
    await notifyMembers([event.createdById], {
      kind: "event",
      title: "Your event was not approved",
      body: `${event.title} · Write to the admin if you have a question.`,
      link: "/events",
    });
  }
}

export type Revenue = {
  /** Nombre de paiements confirmés par l'admin */
  paidCount: number;
  collected: number;
  adminShare: number;
  hostShare: number;
  currency: string;
};

/** Le partage des gains d'un événement payant (paiements confirmés seulement). */
export function revenueOf(event: { isPaid: boolean; price: number | null; currency: string | null }, paidCount: number): Revenue | null {
  if (!event.isPaid || !event.price) return null;
  const collected = event.price * paidCount;
  const adminShare = Math.round(collected * ADMIN_SHARE);
  return {
    paidCount,
    collected,
    adminShare,
    hostShare: collected - adminShare,
    currency: event.currency ?? "Ar",
  };
}

/** "10 000 Ar" */
export function formatMoney(amount: number, currency: string): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} ${currency}`;
}

/** Les événements d'un organisateur (pour sa page Events), avec inscrits et gains. */
export async function listMyEvents(userId: string) {
  const rows = await prisma.event.findMany({
    where: { createdById: userId },
    orderBy: [{ createdAt: "desc" }],
    take: 30,
    select: {
      id: true,
      title: true,
      status: true,
      startsAt: true,
      isPaid: true,
      price: true,
      currency: true,
      liveStartedAt: true,
      liveEndedAt: true,
      durationMin: true,
      responses: { where: { status: "registered" }, select: { paidAt: true } },
    },
  });
  return rows.map(({ responses, ...event }) => {
    const paidCount = responses.filter((response) => response.paidAt).length;
    return { ...event, registered: responses.length, paidCount, revenue: revenueOf(event, paidCount) };
  });
}

/** Ce membre organise-t-il cet événement (publié) ? */
export async function isEventHost(eventId: string, userId: string): Promise<boolean> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, createdById: userId, status: "published" },
    select: { id: true },
  });
  return Boolean(event);
}
