import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VideoRoom } from "@/components/video-room";
import { createParticipantToken, getBrowserLiveKitUrl } from "@/lib/livekit";
import { findActivity, levelLabel } from "@/lib/room-activities";
import { getRoom, ROOM_PREFIX } from "@/lib/rooms";
import { requireMember } from "@/lib/session";

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
  const endsAt = room.durationMin
    ? new Date(room.createdAt.getTime() + room.durationMin * 60 * 1000).toISOString()
    : null;

  return (
    <VideoRoom
      token={token}
      serverUrl={serverUrl}
      leaveTo="/rooms"
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
