// Le prix d'un événement : gratuit, ou un tarif dans une monnaie.
// Sans "server-only" : utilisé par le navigateur ET par le serveur.

export const EVENT_CURRENCIES = ["Ar", "€", "$"] as const;
export type EventCurrency = (typeof EVENT_CURRENCIES)[number];

/** "Free", ou "10 000 Ar". */
export function formatEventPrice(event: { isPaid: boolean; price: number | null; currency: string | null }): string {
  if (!event.isPaid || event.price === null) return "Free";
  return `${new Intl.NumberFormat("fr-FR").format(event.price)} ${event.currency ?? "Ar"}`;
}

/** Le direct vidéo d'un événement : durée et nombre de places maximum. */
export const EVENT_MAX_DURATION = 120;
export const EVENT_MIN_PEOPLE = 2;
export const EVENT_MAX_PEOPLE = 60;

/** La clé des fichiers d'un événement (même table que les fichiers des activités). */
export const eventFilesKey = (eventId: string) => `event:${eventId}`;
