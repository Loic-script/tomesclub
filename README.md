# Tomes Club — application web d'appel vidéo

## Les outils

| Outil | Version | À quoi ça sert |
|---|---|---|
| Next.js | 16.4.5 | Le site web (pages + serveur) |
| React | 19.3 | Les composants de l'interface |
| TypeScript | 5.9 | Le langage (JavaScript avec des types) |
| Tailwind CSS | 4 | Le design (couleurs, tailles...) |
| LiveKit | serveur 1.13.11 | Les appels vidéo |
| PostgreSQL | 17 | La base de données |
| Prisma | 7.10.1 | Parler à PostgreSQL depuis le code |
| Better Auth | 1.7 | Connexion avec Google, sessions |

## Démarrer (développement)

Il faut **2 terminaux** :

```bash
# Terminal 1 : le serveur vidéo LiveKit
npm run livekit:dev

# Terminal 2 : le site web
npm run dev
```

Ensuite, ouvrir http://localhost:3000

## Commandes utiles

| Commande | Ce qu'elle fait |
|---|---|
| `npm run dev` | Lance le site en mode développement |
| `npm run livekit:dev` | Lance le serveur vidéo LiveKit local |
| `npm run check:setup` | Vérifie que PostgreSQL et LiveKit marchent |
| `npm run db:migrate` | Applique les changements de `prisma/schema.prisma` dans la base |
| `npm run db:studio` | Ouvre une page pour voir les données de la base |
| `npm run build` | Prépare le site pour la production |

## Les fichiers importants

```
.env                    → mots de passe et clés (SECRET, jamais sur GitHub)
.env.example            → modèle du .env, sans les secrets
prisma/schema.prisma    → la structure de la base de données (tables)
prisma7.config.ts       → configuration de Prisma
src/app/                → les pages du site
src/app/(auth)/         → pages /login, /register et /onboarding (formulaire d'accueil)
src/app/call/           → page /call (choisir des membres, lancer un appel)
src/app/call/[id]/      → la salle vidéo /call/<id> (LiveKit)
src/lib/calls.ts        → appels vidéo (base de données + LiveKit)
src/lib/session.ts      → lire l'utilisateur connecté (serveur)
src/app/api/auth/       → API d'authentification (Better Auth)
src/lib/auth.ts         → configuration de l'authentification (serveur)
src/lib/auth-client.ts  → authentification côté navigateur
src/lib/prisma.ts       → connexion à la base de données
src/lib/livekit.ts      → outils LiveKit côté serveur (tokens, salles)
scripts/check-setup.ts  → script de vérification
tools/livekit/          → serveur LiveKit pour Windows (non envoyé sur GitHub)
```

## Activer la connexion avec Google

Le site se connecte **uniquement avec Google**. Pour que le bouton marche, il faut 2 clés :

1. Va sur https://console.cloud.google.com et crée un projet (ex : « Tomes Club »).
2. Menu **APIs & Services → OAuth consent screen** : choisis **External**, donne le nom
   « Tomes Club », ton email, et enregistre.
3. Menu **APIs & Services → Credentials → Create credentials → OAuth client ID** :
   - Type : **Web application**
   - **Authorized JavaScript origins** : `http://localhost:3000`
   - **Authorized redirect URIs** : `http://localhost:3000/api/auth/callback/google`
   (quand le site sera en ligne, ajouter aussi l'adresse du site, en https)
4. Copie le **Client ID** et le **Client secret** dans `.env` :
   `GOOGLE_CLIENT_ID="..."` et `GOOGLE_CLIENT_SECRET="..."`

Sans ces clés, le bouton affiche « Google sign-in is not set up yet ».
En développement, l'email + mot de passe reste utilisable par l'API (pour les tests) ;
en production, il est désactivé.

## Installer sur un nouvel ordinateur

1. `npm install`
2. Copier `.env.example` en `.env` et mettre le mot de passe PostgreSQL
3. Créer la base : `CREATE DATABASE tomes_club;`
4. Télécharger le serveur LiveKit Windows sur https://github.com/livekit/livekit/releases
   et mettre `livekit-server.exe` dans `tools/livekit/`
5. `npm run check:setup`
