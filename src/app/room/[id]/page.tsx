import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { VideoRoom } from "@/components/video-room";
import { createParticipantToken, getBrowserLiveKitUrl } from "@/lib/livekit";
import { findActivity, levelLabel } from "@/lib/room-activities";
import { closeRoom, getRoom, ROOM_PREFIX, roomEndsAt, roomIsOver } from "@/lib/rooms";
import { requireMember } from "@/lib/session";
import { endRoomIfOver } from "./actions";

export const metadata: Metadata = { title: "Room" };

// Page /room/<id> : la salle de groupe en vidéo (plein écran, sans barre du bas).
export default function GroupRoomPage({ params }: PageProps<"/room/[id]">) {
  return (
    <main className="flex h-dvh flex-col bg-zinc-950">
      <Suspense fallback={<p className="m-auto text-zinc-400">Connecting...</p>}>
        {params.then(({ id }) => (
          <Room roomId={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function Room({ roomId }: { roomId: string }) {
  const user = await requireMember();

  const room = await getRoom(roomId);
  if (!room) notFound();

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
          href="/rooms"
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
      name: user.firstName,
      roomName: `${ROOM_PREFIX}${room.id}`,
    }),
  ]);

  // Ce que la barre du haut affiche : l'activité, le thème, le temps restant.
  const activity = findActivity(room.activity);
  const endsAtMs = roomEndsAt(room);
  const endsAt = endsAtMs !== null ? new Date(endsAtMs).toISOString() : null;

  return (
    <VideoRoom
      token={token}
      serverUrl={serverUrl}
      leaveTo="/rooms"
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
