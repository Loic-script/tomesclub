import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VideoRoom } from "@/components/video-room";
import { isAdmin } from "@/lib/admin";
import { EVENT_ROOM_PREFIX, eventIsLive, getLiveEvent } from "@/lib/event-live";
import { createParticipantToken, getBrowserLiveKitUrl } from "@/lib/livekit";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Live event" };

// Page /live/<id> : le direct vidéo d'un événement.
// Le coach (session admin) et les membres arrivent dans la même salle.
export default function LiveEventPage({ params }: PageProps<"/live/[id]">) {
  return (
    <main className="flex h-dvh flex-col bg-zinc-950">
      <Suspense fallback={<p className="m-auto text-zinc-400">Connecting...</p>}>
        {params.then(({ id }) => (
          <LiveEvent eventId={id} />
        ))}
      </Suspense>
    </main>
  );
}

/** Qui entre : le coach (session admin), sinon un membre connecté. */
async function whoIsJoining(): Promise<{ id: string; name: string; coach: boolean }> {
  if (await isAdmin()) return { id: "coach", name: "Admin", coach: true };
  const user = await requireMember();
  return { id: user.id, name: user.firstName, coach: false };
}

async function LiveEvent({ eventId }: { eventId: string }) {
  const person = await whoIsJoining();
  const leaveTo = person.coach ? "/admin/events" : "/events";

  const event = await getLiveEvent(eventId);
  if (!event) notFound();

  if (!eventIsLive(event)) {
    return (
      <div className="m-auto max-w-sm px-6 text-center">
        <p className="text-4xl" aria-hidden>
          {event.liveEndedAt ? "👋" : "⏳"}
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-white">
          {event.liveEndedAt ? "This live has ended" : "Not started yet"}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {event.liveEndedAt
            ? "Thanks for coming! See you at the next class."
            : "The admin has not started this event yet. You will get a notification."}
        </p>
        <Link
          href={leaveTo}
          className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
        >
          Back to events
        </Link>
      </div>
    );
  }

  const [serverUrl, token] = await Promise.all([
    getBrowserLiveKitUrl(),
    createParticipantToken({
      identity: person.id,
      name: person.name,
      roomName: `${EVENT_ROOM_PREFIX}${event.id}`,
    }),
  ]);

  return (
    <VideoRoom
      token={token}
      serverUrl={serverUrl}
      leaveTo={leaveTo}
      room={{
        activityIcon: "🔴",
        activityName: "Live event",
        theme: event.title,
        description: event.description,
        format: null,
        level: null,
        durationMin: null,
        endsAt: null,
      }}
    />
  );
}
