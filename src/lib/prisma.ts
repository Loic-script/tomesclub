import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Connexion unique à PostgreSQL pour toute l'application.
//
// En développement, Next.js recharge le code à chaque modification, et
// "prisma generate" peut réécrire le client pendant que le serveur tourne.
// Deux versions du code vivent alors en même temps. On garde donc UN client
// par version (la clé = la classe PrismaClient), et on ferme les anciens
// seulement après un petit délai : une requête en cours a le temps de finir.
// Sans ce délai, on fermait un client encore utilisé, d'où l'erreur
// "Cannot use a pool after calling end on the pool".
const globalForPrisma = globalThis as unknown as {
  prismaClients?: Map<typeof PrismaClient, PrismaClient>;
};

/** Temps laissé aux requêtes en cours avant de fermer un ancien client. */
const CLOSE_OLD_AFTER_MS = 30_000;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL est absent du fichier .env");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

function getPrismaClient(): PrismaClient {
  const clients = (globalForPrisma.prismaClients ??= new Map());

  const existing = clients.get(PrismaClient);
  if (existing) return existing;

  const fresh = createPrismaClient();

  // En production le code ne change jamais : il n'y a qu'un seul client.
  if (process.env.NODE_ENV === "production") {
    clients.set(PrismaClient, fresh);
    return fresh;
  }

  // En développement : nouvelle version du client → on programme la fermeture
  // des anciennes, sans les couper tout de suite.
  const outdated = [...clients.entries()];
  clients.clear();
  clients.set(PrismaClient, fresh);

  for (const [, old] of outdated) {
    const timer = setTimeout(() => {
      void old.$disconnect().catch(() => {});
    }, CLOSE_OLD_AFTER_MS);
    // Ce minuteur ne doit pas retenir le processus ouvert.
    timer.unref?.();
  }

  return fresh;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
