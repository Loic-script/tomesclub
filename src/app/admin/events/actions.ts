"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { endEventLive, startEventLive } from "@/lib/event-live";
import {
  EVENT_CURRENCIES,
  EVENT_MAX_DURATION,
  EVENT_MAX_PEOPLE,
  EVENT_MIN_PEOPLE,
  eventFilesKey,
} from "@/lib/event-price";
import { listActivities } from "@/lib/activities";
import { deleteFilesOfActivity } from "@/lib/activity-files";
import { setRegistrationPaid } from "@/lib/event-responses";
import { notifyAllMembers } from "@/lib/notifications";
import { MAX_PHOTO_BYTES, PHOTO_TYPES } from "@/lib/onboarding-options";
import { prisma } from "@/lib/prisma";

export type CreateEventState = { error: string | null; eventId?: string };
export type UpdateEventState = { error: string | null; saved: boolean };

type EventInput = {
  kind: "event" | "announcement";
  title: string;
  description: string | null;
  startsAt: Date | null;
  /** Payant : le tarif et la monnaie (null si gratuit). */
  isPaid: boolean;
  price: number | null;
  currency: string | null;
  /** Le direct : activité, thème, durée (min), places */
  activity: string | null;
  topic: string | null;
  durationMin: number | null;
  maxParticipants: number | null;
  image: { bytes: Uint8Array<ArrayBuffer>; type: string } | null;
};

/** Lit et vérifie le formulaire (création ou modification). Texte = message d'erreur. */
async function readEventForm(formData: FormData): Promise<EventInput | string> {
  const kind = String(formData.get("kind") ?? "");
  if (kind !== "event" && kind !== "announcement")
    return "Please choose a type.";

  const title = String(formData.get("title") ?? "")
    .trim()
    .slice(0, 120);
  if (!title) return "Please write a title.";

  const description = String(formData.get("description") ?? "")
    .trim()
    .slice(0, 1000);

  let startsAt: Date | null = null;
  if (kind === "event") {
    const raw = String(formData.get("startsAt") ?? "");
    if (!raw) return "Please choose a date and time for the event.";
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return "The date is not valid.";
    startsAt = parsed;
  }

  // Gratuit ou payant (seulement pour un événement daté).
  const isPaid = kind === "event" && formData.get("isPaid") === "on";
  let price: number | null = null;
  let currency: string | null = null;
  if (isPaid) {
    price = Math.round(Number(formData.get("price") ?? ""));
    if (!Number.isFinite(price) || price <= 0)
      return "Please write the price of the event.";
    if (price > 100_000_000) return "The price is too high.";
    const chosen = String(formData.get("currency") ?? "Ar");
    currency = (EVENT_CURRENCIES as readonly string[]).includes(chosen)
      ? chosen
      : "Ar";
  }

  // L'image de la carte (facultative).
  let image: EventInput["image"] = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!PHOTO_TYPES.includes(file.type))
      return "The image must be a JPG, PNG or WebP file.";
    if (file.size > MAX_PHOTO_BYTES)
      return "The image is too big (3 MB maximum).";
    image = {
      bytes: new Uint8Array(await file.arrayBuffer()),
      type: file.type,
    };
  }

  // Le direct vidéo (seulement pour un événement daté)
  let activity: string | null = null;
  let topic: string | null = null;
  let durationMin: number | null = null;
  let maxParticipants: number | null = null;
  if (kind === "event") {
    const activityKey = String(formData.get("activity") ?? "").trim();
    // Une activité du catalogue (par sa clé ou son nom), sinon celle écrite par l'admin.
    if (activityKey) {
      const match = (await listActivities()).find(
        (entry) => entry.key === activityKey || entry.name.toLowerCase() === activityKey.toLowerCase(),
      );
      activity = match ? match.key : activityKey.slice(0, 60);
    }
    topic =
      String(formData.get("topic") ?? "")
        .trim()
        .slice(0, 160) || null;
    const minutes = Math.round(Number(formData.get("durationMin") ?? ""));
    if (formData.get("durationMin")) {
      if (
        !Number.isFinite(minutes) ||
        minutes < 1 ||
        minutes > EVENT_MAX_DURATION
      ) {
        return `The duration must be between 1 and ${EVENT_MAX_DURATION} minutes.`;
      }
      durationMin = minutes;
    }
    const people = Math.round(Number(formData.get("maxParticipants") ?? ""));
    if (formData.get("maxParticipants")) {
      if (
        !Number.isFinite(people) ||
        people < EVENT_MIN_PEOPLE ||
        people > EVENT_MAX_PEOPLE
      ) {
        return `The number of people must be between ${EVENT_MIN_PEOPLE} and ${EVENT_MAX_PEOPLE}.`;
      }
      maxParticipants = people;
    }
  }

  return {
    kind,
    title,
    description: description || null,
    startsAt,
    isPaid,
    price,
    currency,
    activity,
    topic,
    durationMin,
    maxParticipants,
    image,
  };
}

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
