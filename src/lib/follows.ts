import "server-only";
import type { FollowPerson } from "@/components/follow-stat";
import { prisma } from "@/lib/prisma";

/**
 * Les « followers » (qui suit ce membre) et les « following » (qui il suit), les 200 plus récents,
 * avec les totaux. Sert sur ma page Profile et sur la fiche d'un autre membre.
 */
export async function listFollowPeople(userId: string) {
  const person = { select: { id: true, name: true, profile: { select: { photoType: true } } } } as const;
  const [followers, following, followersCount, followingCount] = await Promise.all([
    prisma.follow.findMany({ where: { followingId: userId }, orderBy: { createdAt: "desc" }, take: 200, select: { follower: person } }),
    prisma.follow.findMany({ where: { followerId: userId }, orderBy: { createdAt: "desc" }, take: 200, select: { following: person } }),
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  const toPerson = (user: { id: string; name: string; profile: { photoType: string | null } | null }): FollowPerson => ({
    id: user.id,
    name: user.name,
    hasPhoto: Boolean(user.profile?.photoType),
  });
  return {
    followers: followers.map((row) => toPerson(row.follower)),
    following: following.map((row) => toPerson(row.following)),
    followersCount,
    followingCount,
  };
}
