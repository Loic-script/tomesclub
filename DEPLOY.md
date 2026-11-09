# Mettre Tomes Club en ligne sur Railway

Guide simple, à suivre dans l'ordre. Compte environ 1 heure la première fois.

## Ce qu'il faut avant

| Service | Pourquoi | Prix |
|---|---|---|
| [Railway](https://railway.app) | héberge le site + la base de données | gratuit pour commencer |
| [LiveKit Cloud](https://cloud.livekit.io) | les appels vidéo | gratuit pour commencer |
| [Google Cloud](https://console.cloud.google.com) | la connexion avec Google | gratuit |

> **Pourquoi LiveKit Cloud et pas Railway ?**
> La vidéo utilise l'UDP, un type de connexion que Railway ne laisse pas passer.
> On met donc seulement le site et la base sur Railway.

---

## 1. La base de données

1. Sur Railway : **New Project** → **Deploy PostgreSQL**.
2. C'est tout. Railway crée la base et son mot de passe.

## 2. Le site

1. Dans le même projet : **New** → **GitHub Repo** → choisis `Loic-script/tomesclub`.
2. Railway lit le projet et installe tout seul (il voit que c'est Next.js).
3. Onglet **Settings** → **Networking** → **Generate Domain**.
   Tu obtiens une adresse comme `tomesclub.up.railway.app`. **Note-la.**

## 3. LiveKit Cloud

1. Crée un projet sur [cloud.livekit.io](https://cloud.livekit.io).
2. Dans **Settings → Keys**, copie les 3 valeurs : l'URL (`wss://...`), la clé et le secret.

## 4. Google

Dans la console Google, sur ton identifiant OAuth, ajoute :

- Origine autorisée : `https://tomesclub.up.railway.app`
- URI de redirection : `https://tomesclub.up.railway.app/api/auth/callback/google`

## 5. Les variables

Sur Railway, service du site → onglet **Variables**. Copie les lignes de
[`.env.production.example`](.env.production.example) et remplis les valeurs.

Deux choses à **générer de zéro** (ne jamais réutiliser celles du développement) :

```bash
# la clé des sessions
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

et un **mot de passe admin long**.

## 6. Le déploiement

Railway redéploie à chaque `git push` sur `main`.
Au démarrage, le site applique tout seul les changements de la base
(`prisma migrate deploy`), donc les tables sont créées à la première mise en ligne.

---

## Vérifier que tout marche

1. Ouvre `https://ton-adresse.up.railway.app` → la page de connexion s'affiche.
2. Clique sur **Continue with Google** → tu arrives sur le formulaire d'accueil.
3. Remplis-le → tu arrives sur l'accueil de l'application.
4. Va sur **Rooms** → crée une salle → la vidéo doit s'ouvrir (autorise la caméra).
5. Va sur `/admin` → connecte-toi avec le nouveau mot de passe admin.

## Si ça ne marche pas

| Problème | Cause probable |
|---|---|
| Google refuse la connexion | l'adresse du site n'est pas dans la console Google (étape 4) |
| La vidéo ne se connecte pas | `NEXT_PUBLIC_LIVEKIT_URL` doit commencer par `wss://` (pas `ws://`) |
| La caméra est refusée | le site doit être en `https://` |
| Erreur de base de données | `DATABASE_URL` doit pointer vers le service Postgres de Railway |
| Déconnexion permanente | `BETTER_AUTH_URL` doit être exactement l'adresse du site, sans `/` à la fin |

## Plus tard : ton propre domaine

Dans Railway → **Settings → Networking → Custom Domain**.
Pense ensuite à changer `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`
et les adresses dans la console Google.
