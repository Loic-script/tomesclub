import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { notifyAdmin } from "@/lib/admin-notifications";
import { prisma } from "@/lib/prisma";

// Clés Google (console.cloud.google.com). Tant qu'elles sont vides,
// le bouton Google affiche "pas encore configuré".
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Configuration de l'authentification (côté SERVEUR uniquement).
// Better Auth s'occupe : des sessions, des cookies, et du dialogue avec Google.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // La seule façon de se connecter sur le site : le compte Google.
  socialProviders:
    googleClientId && googleClientSecret
      ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
      : {},

  // Email + mot de passe : PAS sur le site. Gardé seulement en développement,
  // pour les comptes de test automatiques (via l'API). Éteint en production.
  emailAndPassword: {
    enabled: process.env.NODE_ENV !== "production",
    minPasswordLength: 8,
    autoSignIn: true,
  },

  // Un compte vient d'être créé : l'admin est prévenu.
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await notifyAdmin({
            kind: "signup",
            title: `New account: ${user.name}`,
            body: user.email,
            link: `/admin/members/${user.id}`,
          });
        },
      },
    },
  },

  // Permet d'utiliser auth.api.* dans les Server Actions (doit rester en dernier).
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
