import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

// Les autres membres : qui est en ligne, qui suit qui, et leur fiche publique.

/** Un membre est "en ligne" si son navigateur a donné signe de vie il y a moins de 2 minutes. */
const ONLINE_MS = 2 * 60 * 1000;

/** L'âge en années, à partir de la date de naissance (null si elle est absente). */
function ageFrom(birthDate: Date | null, today: Date): number | null {
  if (!birthDate) return null;
  let age = today.getFullYear() - birthDate.getFullYear();
  // L'anniversaire n'est pas encore passé cette année ? On enlève un an.
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/** Combien de membres le panneau de droite montre. */
const SIDE_LIMIT = 12;

export type MemberCard = {
  id: string;
  firstName: string;
  lastName: string;
  englishLevel: string | null;
  city: string | null;
  country: string | null;
  hasPhoto: boolean;
  online: boolean;
  /** Je le suis. */
  following: boolean;
  /** Il me suit (→ bouton "Follow back"). */
  followsMe: boolean;
};

/** Dit que je suis là (appelé régulièrement par le navigateur). */
export async function touchPresence(userId: string): Promise<void> {
  await prisma.profile.updateMany({
    where: { userId },
    data: { lastSeenAt: new Date() },
  });
}

/**
 * Les autres membres : les personnes en ligne d'abord, puis par prénom.
 * `limit` = 0 veut dire "tout le monde".
 */
export async function listMembers(
  currentUserId: string,
  limit: number = SIDE_LIMIT,
): Promise<MemberCard[]> {
  // "En ligne" dépend de l'heure de la requête : on le déclare à Next.js.
  await connection();
  const onlineSince = new Date(Date.now() - ONLINE_MS);

  const [rows, following, followers] = await Promise.all([
    prisma.user.findMany({
      where: { id: { not: currentUserId }, profile: { completedAt: { not: null } } },
      select: {
        id: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            englishLevel: true,
            city: true,
            country: true,
            photoType: true,
            lastSeenAt: true,
          },
        },
      },
    }),
    prisma.follow.findMany({ where: { followerId: currentUserId }, select: { followingId: true } }),
    prisma.follow.findMany({ where: { followingId: currentUserId }, select: { followerId: true } }),
  ]);

  const iFollow = new Set(following.map((row) => row.followingId));
  const theyFollowMe = new Set(followers.map((row) => row.followerId));

  const members = rows.flatMap((row) =>
    row.profile
      ? [
          {
            id: row.id,
            firstName: row.profile.firstName,
            lastName: row.profile.lastName,
            englishLevel: row.profile.englishLevel,
            city: row.profile.city,
            country: row.profile.country,
            hasPhoto: Boolean(row.profile.photoType),
            online: Boolean(row.profile.lastSeenAt && row.profile.lastSeenAt >= onlineSince),
            following: iFollow.has(row.id),
            followsMe: theyFollowMe.has(row.id),
          },
        ]
      : [],
  );

  // Les membres en ligne en premier, puis par prénom.
  members.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return a.firstName.localeCompare(b.firstName);
  });

  return limit > 0 ? members.slice(0, limit) : members;
}

export type PublicMemberProfile = {
  id: string;
  firstName: string;
  lastName: string;
  englishLevel: string | null;
  city: string | null;
  country: string | null;
  /** L'âge calculé à partir de la date de naissance. */
  age: number | null;
  languages: string[];
  interests: string[];
  occupations: { kind?: string; detail?: string }[];
  hasPhoto: boolean;
  online: boolean;
  following: boolean;
  followsMe: boolean;
  followerCount: number;
  followingCount: number;
};

/**
 * La fiche publique d'un membre (pas de téléphone, pas de date de naissance,
 * pas d'email : ces informations restent privées).
 */
export async function getPublicMemberProfile(
  memberId: string,
  currentUserId: string,
): Promise<PublicMemberProfile | null> {
  await connection();
  const onlineSince = new Date(Date.now() - ONLINE_MS);

  const [profile, following, followsMe, followerCount, followingCount] = await Promise.all([
    prisma.profile.findFirst({
      where: { userId: memberId, completedAt: { not: null } },
      select: {
        firstName: true,
        lastName: true,
        englishLevel: true,
        city: true,
        country: true,
        birthDate: true,
        languages: true,
        interests: true,
        occupations: true,
        photoType: true,
        lastSeenAt: true,
      },
    }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: memberId } },
      select: { createdAt: true },
    }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: memberId, followingId: currentUserId } },
      select: { createdAt: true },
    }),
    prisma.follow.count({ where: { followingId: memberId } }),
    prisma.follow.count({ where: { followerId: memberId } }),
  ]);
  if (!profile) return null;

  return {
    id: memberId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    englishLevel: profile.englishLevel,
    city: profile.city,
    country: profile.country,
    age: ageFrom(profile.birthDate, new Date()),
    languages: profile.languages,
    interests: profile.interests,
    occupations: Array.isArray(profile.occupations)
      ? (profile.occupations as { kind?: string; detail?: string }[])
      : [],
    hasPhoto: Boolean(profile.photoType),
    online: Boolean(profile.lastSeenAt && profile.lastSeenAt >= onlineSince),
    following: following !== null,
    followsMe: followsMe !== null,
    followerCount,
    followingCount,
  };
}

/** Suivre un membre (ne rien faire si c'est déjà le cas). */
export async function followMember(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) return;
  const target = await prisma.profile.findFirst({
    where: { userId: followingId, completedAt: { not: null } },
    select: { userId: true },
  });
  if (!target) return;

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });
}

/** Ne plus suivre un membre. */
export async function unfollowMember(followerId: string, followingId: string): Promise<void> {
  await prisma.follow.deleteMany({ where: { followerId, followingId } });
}
