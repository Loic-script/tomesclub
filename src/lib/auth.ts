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

  // Deux façons de se connecter : le compte Google, ou un email + un mot de passe.
  socialProviders:
    googleClientId && googleClientSecret
      ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
      : {},

  // Email + mot de passe : connexion et inscription depuis la page /login.
  // (Pas encore d'envoi d'email : pas de vérification d'adresse ni de "mot de passe oublié".)
  emailAndPassword: {
    enabled: true,
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
