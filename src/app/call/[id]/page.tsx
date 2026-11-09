import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCallForMember } from "@/lib/calls";
import { createParticipantToken } from "@/lib/livekit";
import { requireUser } from "@/lib/session";
import { CallRoom } from "./call-room";

export const metadata: Metadata = { title: "In a call" };

// Page /call/<id> : la salle vidéo.
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

  return <CallRoom token={token} serverUrl={serverUrl} />;
}

/**
 * L'adresse LiveKit à donner au navigateur.
 * Si le .env dit "localhost", on la remplace par l'adresse utilisée pour ouvrir le site
 * (ex : 192.168.1.82) : sur un autre PC, "localhost" voudrait dire "cet autre PC".
 */
async function getBrowserLiveKitUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!configured) throw new Error("NEXT_PUBLIC_LIVEKIT_URL est absent du fichier .env");

  const url = new URL(configured);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    const host = (await headers()).get("host"); // ex : "192.168.1.82:3000"
    if (host) url.hostname = new URL(`http://${host}`).hostname;
  }
  return url.toString().replace(/\/$/, "");
}
