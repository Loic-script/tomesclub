import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VideoRoom } from "@/components/video-room";
import { getCallForMember } from "@/lib/calls";
import { createParticipantToken, getBrowserLiveKitUrl } from "@/lib/livekit";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "In a call" };

/** Un appel entre membres dure toujours 5 minutes (compté quand les deux sont là). */
const CALL_MINUTES = 5;

// Page /call/<id> : la salle vidéo d'un appel privé.
export default function CallRoomPage({ params }: PageProps<"/call/[id]">) {
  return (
    <main className="flex h-dvh flex-col bg-zinc-950">
      {/* L'id dans l'URL et la session sont lus au moment de la requête : <Suspense> obligatoire. */}
      <Suspense fallback={<p className="m-auto text-zinc-400">Connecting...</p>}>
        {params.then(({ id }) => (
          <Room callId={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function Room({ callId }: { callId: string }) {
  const user = await requireUser();

  // Seules les personnes invitées peuvent entrer.
  const call = await getCallForMember(callId, user.id);
  if (!call) notFound();

  const [serverUrl, token] = await Promise.all([
    getBrowserLiveKitUrl(),
    createParticipantToken({ identity: user.id, name: user.name, roomName: call.id }),
  ]);

  return (
    <VideoRoom token={token} serverUrl={serverUrl} leaveTo="/calls" callMinutes={CALL_MINUTES} />
  );
}
