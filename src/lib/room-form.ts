import "server-only";
import { getActivity } from "@/lib/activities";
import {
  DEFAULT_PEOPLE,
  MAX_DURATION,
  MIN_DURATION,
  ROOM_LEVELS,
  ROOM_MAX_PEOPLE,
  ROOM_MIN_PEOPLE,
} from "@/lib/room-activities";
import type { NewRoom } from "@/lib/rooms";

// Lit et verifie le formulaire "Create a room" (membres et admin).
// Le formulaire ne vaut pas confiance : chaque valeur est verifiee avec le catalogue.

const text = (formData: FormData, key: string, max: number) =>
  String(formData.get(key) ?? "").trim().slice(0, max);

/** Les choix verifies, ou un message d erreur (texte). */
export async function readRoomForm(formData: FormData): Promise<NewRoom | string> {
  const activity = await getActivity(text(formData, "activity", 80));
  if (!activity) return "Please choose an activity.";

  const topic = text(formData, "topic", 160);
  if (!topic) return "Please choose or write a theme.";

  const name = text(formData, "name", 60) || activity.name;
  const description = text(formData, "description", 600);
  const isPrivate = formData.get("visibility") === "private";

  const formatValue = text(formData, "format", 60);
  const format = activity.formats.includes(formatValue) ? formatValue : (activity.formats[0] ?? null);

  const levelValue = text(formData, "level", 20);
  const level = ROOM_LEVELS.some((entry) => entry.value === levelValue) ? levelValue : "all";

  const minutes = Number(formData.get("duration"));
  const durationMin =
    Number.isInteger(minutes) && minutes >= MIN_DURATION && minutes <= MAX_DURATION ? minutes : null;
  if (durationMin === null) {
    return `Please choose a duration between ${MIN_DURATION} and ${MAX_DURATION} minutes.`;
  }

  // La limite de personnes : un nombre entre 2 et 20.
  const people = Math.round(Number(formData.get("maxParticipants")));
  const maxParticipants = Number.isFinite(people)
    ? Math.min(ROOM_MAX_PEOPLE, Math.max(ROOM_MIN_PEOPLE, people))
    : DEFAULT_PEOPLE;

  return {
    name,
    topic,
    isPrivate,
    activity: activity.key,
    description: description || null,
    format,
    level,
    durationMin,
    maxParticipants,
    // Les membres invités (salle privée seulement), au plus 50.
    invitees: isPrivate
      ? [...new Set(formData.getAll("invite").map(String).filter(Boolean))].slice(0, 50)
      : [],
    // Le paiement (vérifié par l'action du membre ; le montant est mis par le serveur).
    paymentMethod: isPrivate && ["mvola", "orange"].includes(text(formData, "paymentMethod", 10))
      ? text(formData, "paymentMethod", 10)
      : null,
    paymentRef: isPrivate ? text(formData, "paymentRef", 60) || null : null,
    paymentAmount: null,
  };
}
