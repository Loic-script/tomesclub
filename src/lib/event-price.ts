// Le prix d'un événement : gratuit, ou un tarif dans une monnaie.
// Sans "server-only" : utilisé par le navigateur ET par le serveur.

export const EVENT_CURRENCIES = ["Ar", "€", "$"] as const;
export type EventCurrency = (typeof EVENT_CURRENCIES)[number];

/** "Free", ou "10 000 Ar". */
export function formatEventPrice(event: { isPaid: boolean; price: number | null; currency: string | null }): string {
  if (!event.isPaid || event.price === null) return "Free";
  return `${new Intl.NumberFormat("fr-FR").format(event.price)} ${event.currency ?? "Ar"}`;
}
