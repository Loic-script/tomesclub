import type { Metadata } from "next";
import { countryCodeOf } from "@/lib/countries";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { VideoRoom } from "@/components/video-room";
import { createParticipantToken, getBrowserLiveKitUrl } from "@/lib/livekit";
import { getActivity } from "@/lib/activities";
import { listFilesForActivity } from "@/lib/activity-files";
import { AdminLiveRefresh } from "@/app/admin/admin-nav";
import { isAdmin } from "@/lib/admin";
import { isInvited } from "@/lib/private-rooms";
import { levelLabel } from "@/lib/room-activities";
import {
  closeRoom,
  getRoom,
  listRoomPeople,
  ROOM_PREFIX,
  roomEndsAt,
  roomIsOver,
} from "@/lib/rooms";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireMember } from "@/lib/session";
import { endRoomIfOver } from "./actions";

export const metadata: Metadata = { title: "Room" };

// Page /room/<id> : la salle de groupe en vidéo (plein écran, sans barre du bas).
export default function GroupRoomPage({ params, searchParams }: PageProps<"/room/[id]">) {
  return (
    <main className="flex h-dvh flex-col bg-zinc-950">
      <Suspense fallback={<p className="m-auto text-zinc-400">Connecting...</p>}>
        {Promise.all([params, searchParams]).then(([{ id }, query]) => (
          <Room roomId={id} asAdmin={query.as === "admin"} />
        ))}
      </Suspense>
    </main>
  );
}

/**
 * Qui entre. Un même navigateur peut avoir une session membre ET une session admin :
 * on entre comme admin seulement depuis l'espace admin (lien "?as=admin"), sinon comme membre.
 */
async function whoIsJoining(
  asAdmin: boolean,
): Promise<{ id: string; firstName: string; coach: boolean; role: string; country: string | null }> {
  if (asAdmin && (await isAdmin())) return { id: "coach", firstName: "Admin", coach: true, role: "admin", country: null };
  if (!(await getCurrentUser()) && (await isAdmin())) {
    return { id: "coach", firstName: "Admin", coach: true, role: "admin", country: null };
  }
  const member = await requireMember();
  const profile = await prisma.profile.findUnique({
    where: { userId: member.id },
    select: { role: true, country: true },
  });
  return {
    id: member.id,
    firstName: member.firstName,
    coach: false,
    role: profile?.role ?? "member",
    country: countryCodeOf(profile?.country),
  };
}

/** Le nom dans la vidéo : "Admin", "Prénom · Teacher", "Prénom · Leader", "Prénom · Host" (créateur), ou le prénom. */
function displayName(user: { firstName: string; coach: boolean; role: string }, hosting: boolean): string {
  if (user.coach) return "Admin";
  if (user.role === "teacher") return `${user.firstName} · Teacher`;
  if (user.role === "leader") return `${user.firstName} · Leader`;
  return hosting ? `${user.firstName} · Host` : user.firstName;
}

async function Room({ roomId, asAdmin }: { roomId: string; asAdmin: boolean }) {
  const user = await whoIsJoining(asAdmin);
  const back = user.coach ? "/admin/rooms" : "/rooms";

  const room = await getRoom(roomId);
  // La salle n'existe plus (fermée, supprimée) : retour à la liste des rooms.
  if (!room) redirect(back);

  // Salle privée refusée par l'admin : elle se ferme pour de bon, l'hôte revient sur Rooms avec un message.
  if (room.refusedAt) {
    await prisma.room.deleteMany({ where: { id: room.id } });
    redirect(user.coach ? back : "/rooms?refused=1");
  }

  const hosting = user.coach || (room.createdById !== null && room.createdById === user.id);

  // Salle privée d'un Leader / Teacher pas encore acceptée par l'admin.
  if (room.pendingApproval) {
    return (
      <div className="m-auto max-w-sm px-6 text-center">
        {/* La page se recharge toute seule : dès que l'admin accepte, l'appel s'ouvre. */}
        <AdminLiveRefresh seconds={5} />
        <p className="text-4xl" aria-hidden>
          ⏳
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-white">
          {hosting ? "Waiting for the admin" : "This room is not open yet"}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {hosting
            ? "Your private room must be approved by the admin. You will get a notification, and this page opens the call by itself."
            : "The admin has not approved this private room yet."}
        </p>
        <Link
          href={back}
          className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
        >
          Back to rooms
        </Link>
      </div>
    );
  }

  // Salle privée : seulement l'hôte, l'admin et les membres invités.
  if (room.isPrivate && !hosting && !(await isInvited(room.id, user.id))) {
    return (
      <div className="m-auto max-w-sm px-6 text-center">
        <p className="text-4xl" aria-hidden>
          🔒
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-white">This room is private</h1>
        <p className="mt-2 text-sm text-white/60">Only the people invited by the host can join.</p>
        <Link
          href={back}
          className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
        >
          Back to rooms
        </Link>
      </div>
    );
  }

  // Le temps choisi par l hôte est fini : la salle est fermée.
  await connection();
  if (roomIsOver(room)) {
    // Personne n'a fermé la salle à temps : on la ferme et on la supprime maintenant.
    await closeRoom(room.id);
    return (
      <div className="m-auto max-w-sm px-6 text-center">
        <p className="text-4xl" aria-hidden>
          ⏰
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-white">This room has ended</h1>
        <p className="mt-2 text-sm text-white/60">
          Its {room.durationMin} minutes are over. Open a new room to keep practising!
        </p>
        <Link
          href={back}
          className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
        >
          Back to rooms
        </Link>
      </div>
    );
  }

  const [serverUrl, token] = await Promise.all([
    getBrowserLiveKitUrl(),
    createParticipantToken({
      identity: user.id,
      name: displayName(user, hosting),
      metadata: JSON.stringify({ country: user.country }),
      roomName: `${ROOM_PREFIX}${room.id}`,
    }),
  ]);

  // Ce que la barre du haut affiche : l'activité, le thème, le temps restant.
  const activity = await getActivity(room.activity);
  // L hote (celui qui a ouvert la salle, ou le coach) montre les fichiers de l activite.
  const isHost = hosting;
  const files = isHost ? await listFilesForActivity(room.activity) : [];
  // La salle est pleine ? (Je peux revenir si j'y suis déjà, par exemple après un rechargement.)
  if (room.maxParticipants !== null) {
    const people = await listRoomPeople(room.id);
    if (people && people.length >= room.maxParticipants && !people.includes(user.id)) {
      return (
        <div className="m-auto max-w-sm px-6 text-center">
          <p className="text-4xl" aria-hidden>
            🚪
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold text-white">This room is full</h1>
          <p className="mt-2 text-sm text-white/60">
            {people.length}/{room.maxParticipants} people are already inside. Try another room or
            open your own!
          </p>
          <Link
            href={back}
            className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
          >
            Back to rooms
          </Link>
        </div>
      );
    }
  }

  const endsAtMs = roomEndsAt(room);
  const endsAt = endsAtMs !== null ? new Date(endsAtMs).toISOString() : null;

  return (
    <VideoRoom
      token={token}
      serverUrl={serverUrl}
      leaveTo={back}
      stage={{ isHost, files, activityName: activity?.name ?? null }}
      onTimeUp={endRoomIfOver.bind(null, room.id)}
      room={{
        activityIcon: activity?.icon ?? null,
        activityName: activity?.name ?? (room.topic ? room.name : null),
        theme: room.topic,
        description: room.description,
        format: room.format,
        level: levelLabel(room.level),
        durationMin: room.durationMin,
        endsAt,
      }}
    />
  );
}
