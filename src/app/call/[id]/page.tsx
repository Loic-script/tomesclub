import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { countryCodeOf } from "@/lib/countries";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VideoRoom } from "@/components/video-room";
import { CALL_MINUTES, getCallForMember } from "@/lib/calls";
import { createParticipantToken, getBrowserLiveKitUrl } from "@/lib/livekit";
import { requireUser } from "@/lib/session";
import { endCallForTime, hangUpBeforeStart, startCallCountdown } from "./actions";
import Link from "next/link";

export const metadata: Metadata = { title: "In a call" };

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

  // Appel refusé, annulé ou déjà fini : on ne rentre pas dans une salle vide.
  if (call.endedAt) {
    return (
      <div className="m-auto max-w-sm px-6 text-center">
        <p className="text-4xl" aria-hidden>📵</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-white">This call has ended</h1>
        <p className="mt-2 text-sm text-white/60">The call was declined, cancelled or is already over.</p>
        <Link href="/calls" className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white">
          Back to calls
        </Link>
      </div>
    );
  }

  // Mon pays : le drapeau à côté de mon nom dans la vidéo
  const myProfile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { country: true } });
  const [serverUrl, token] = await Promise.all([
    getBrowserLiveKitUrl(),
    createParticipantToken({
      identity: user.id,
      name: user.name,
      roomName: call.id,
      metadata: JSON.stringify({ country: countryCodeOf(myProfile?.country) }),
    }),
  ]);

  return (
    <VideoRoom
      token={token}
      serverUrl={serverUrl}
      leaveTo="/calls"
      callMinutes={CALL_MINUTES}
      onTimeUp={endCallForTime.bind(null, call.id)}
      onCallStarted={startCallCountdown.bind(null, call.id)}
      onHangUpEarly={hangUpBeforeStart.bind(null, call.id)}
    />
  );
}
