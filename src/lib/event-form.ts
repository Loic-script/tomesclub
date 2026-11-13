import "server-only";
import { listActivities } from "@/lib/activities";
import {
  EVENT_CURRENCIES,
  EVENT_MAX_DURATION,
  EVENT_MAX_PEOPLE,
  EVENT_MIN_PEOPLE,
} from "@/lib/event-price";
import { MAX_PHOTO_BYTES, PHOTO_TYPES } from "@/lib/onboarding-options";

// Lit et vérifie le formulaire d'un événement (admin : "Publish", Leader / Teacher : "Propose an event").

export type EventInput = {
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
export async function readEventForm(formData: FormData): Promise<EventInput | string> {
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
