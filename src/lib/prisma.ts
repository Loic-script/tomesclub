import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Connexion unique à PostgreSQL pour toute l'application.
//
// En développement, Next.js recharge le code à chaque modification.
// Sans cette astuce, chaque rechargement ouvrirait une nouvelle connexion
// et PostgreSQL finirait par refuser ("too many connections").
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaClass?: typeof PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL est absent du fichier .env");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

function getPrismaClient(): PrismaClient {
  // On réutilise le client gardé en mémoire... sauf si Prisma a été régénéré
  // (nouvelle table après "prisma migrate") : l'ancien client ne connaît pas les nouvelles tables.
  if (globalForPrisma.prisma && globalForPrisma.prismaClass === PrismaClient) {
    return globalForPrisma.prisma;
  }
  void globalForPrisma.prisma?.$disconnect();
  return createPrismaClient();
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
      globalForPrisma.prismaClass = PrismaClient;
    }
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});