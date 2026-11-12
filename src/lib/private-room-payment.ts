import "server-only";

// Le paiement d'une salle privée (Leader / Teacher) : l'hôte envoie l'argent à l'admin
// par MVola ou Orange Money, puis tape la référence de la transaction.
// L'admin vérifie la référence et accepte la salle.
// Réglages dans les variables d'environnement (Mini Railway → Variables) :
//   PRIVATE_ROOM_PRICE     le prix en Ariary (10000 par défaut)
//   MVOLA_NUMBER           le numéro MVola de l'admin (ex : 034 00 000 00)
//   ORANGE_MONEY_NUMBER    le numéro Orange Money de l'admin (ex : 032 00 000 00)
//   PAYMENT_RECEIVER_NAME  le nom affiché du bénéficiaire (facultatif)

export type PrivateRoomPayment = {
  price: number;
  mvola: string | null;
  orange: string | null;
  receiver: string | null;
};

export function privateRoomPayment(): PrivateRoomPayment {
  const price = Math.round(Number(process.env.PRIVATE_ROOM_PRICE ?? 10000));
  return {
    price: Number.isFinite(price) && price > 0 ? price : 10000,
    mvola: process.env.MVOLA_NUMBER?.trim() || null,
    orange: process.env.ORANGE_MONEY_NUMBER?.trim() || null,
    receiver: process.env.PAYMENT_RECEIVER_NAME?.trim() || null,
  };
}
