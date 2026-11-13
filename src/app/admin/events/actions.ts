"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { endEventLive, startEventLive } from "@/lib/event-live";
import { deleteFilesOfActivity } from "@/lib/activity-files";
import { readEventForm } from "@/lib/event-form";
import { eventFilesKey } from "@/lib/event-price";
import { setRegistrationPaid } from "@/lib/event-responses";
import { approveEventRequest, refuseEventRequest } from "@/lib/member-events";
import { notifyAllMembers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export type CreateEventState = { error: string | null; eventId?: string };
export type UpdateEventState = { error: string | null; saved: boolean };

/** Formulaire admin : publier un événement (avec date) ou une annonce. */
export async function createEvent(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  await requireAdmin();

  const input = await readEventForm(formData);
  if (typeof input === "string") return { error: input };
  const { kind, title, description, startsAt, isPaid, price, currency, image } =
    input;
  const { activity, topic, durationMin, maxParticipants } = input;

  const created = await prisma.event.create({
    select: { id: true },
    data: {
      activity,
      topic,
      durationMin,
      maxParticipants,
      kind,
      title,
      description,
      startsAt,
      isPaid,
      price,
      currency,
      image: image?.bytes ?? null,
      imageType: image?.type ?? null,
    },
  });

  // On prévient tous les membres (ceux qui n'ont pas coupé ces notifications).
  await notifyAllMembers({
    kind: kind === "event" ? "event" : "announcement",
    title: kind === "event" ? `New class: ${title}` : title,
    body:
      kind === "event" && startsAt
        ? new Intl.DateTimeFormat("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          }).format(startsAt)
        : "New announcement from the admin.",
    link: "/events",
  });

  // La fenêtre envoie ensuite les fichiers choisis, puis se ferme.
  refresh();
  return { error: null, eventId: created.id };
}

/** Modifier un événement ou une annonce (l'image n'est remplacée que si on en choisit une). */
export async function updateEvent(
  eventId: string,
  _prevState: UpdateEventState,
  formData: FormData,
): Promise<UpdateEventState> {
  await requireAdmin();

  const input = await readEventForm(formData);
  if (typeof input === "string") return { error: input, saved: false };
  const removeImage = formData.get("removeImage") === "on";

  const result = await prisma.event.updateMany({
    where: { id: eventId },
    data: {
      kind: input.kind,
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      isPaid: input.isPaid,
      activity: input.activity,
      topic: input.topic,
      durationMin: input.durationMin,
      maxParticipants: input.maxParticipants,
      price: input.price,
      currency: input.currency,
      ...(input.image
        ? { image: input.image.bytes, imageType: input.image.type }
        : removeImage
          ? { image: null, imageType: null }
          : {}),
    },
  });
  if (result.count === 0)
    return { error: "This event no longer exists.", saved: false };
  refresh();
  return { error: null, saved: true };
}

/** Supprimer un événement ou une annonce (le direct est fermé s'il tourne). */
export async function deleteEvent(eventId: string): Promise<void> {
  await requireAdmin();
  await endEventLive(eventId);
  await deleteFilesOfActivity(eventFilesKey(eventId));
  await prisma.event.delete({ where: { id: eventId } }).catch(() => {
    // Déjà supprimé : rien à faire.
  });
  redirect("/admin/events");
}

/** "Start" : lance le direct vidéo, prévient les membres, et ouvre la salle pour le coach. */
export async function startEventAction(eventId: string): Promise<void> {
  await requireAdmin();
  const ok = await startEventLive(eventId);
  if (!ok) redirect("/admin/events");
  redirect(`/live/${eventId}?as=admin`);
}

/** "End" : termine le direct pour tout le monde. */
export async function endEventAction(eventId: string): Promise<void> {
  await requireAdmin();
  await endEventLive(eventId);
  refresh();
}

/** Événement payant : confirmer (ou annuler) le paiement d'un inscrit. */
export async function setPaidAction(
  eventId: string,
  userId: string,
  paid: boolean,
): Promise<void> {
  await requireAdmin();
  await setRegistrationPaid(eventId, userId, paid === true);
  refresh();
}

/** Événement proposé par un Leader / Teacher : l admin l accepte (il est publié). */
export async function approveEventRequestAction(eventId: string): Promise<void> {
  await requireAdmin();
  await approveEventRequest(eventId);
  refresh();
}

/** Événement proposé par un Leader / Teacher : l admin le refuse. */
export async function refuseEventRequestAction(eventId: string): Promise<void> {
  await requireAdmin();
  await refuseEventRequest(eventId);
  refresh();
}
