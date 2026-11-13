import type { Metadata } from "next";
import { endLiveIfOver } from "./actions";
import { eventFilesKey } from "@/lib/event-price";
import { listFilesForActivity } from "@/lib/activity-files";
import { getActivity } from "@/lib/activities";
import { countryCodeOf } from "@/lib/countries";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VideoRoom } from "@/components/video-room";
import { isAdmin } from "@/lib/admin";
import { EVENT_ROOM_PREFIX, eventIsLive, getLiveEvent } from "@/lib/event-live";
import {
  createParticipantToken,
  createRoomServiceClient,
  getBrowserLiveKitUrl,
} from "@/lib/livekit";
import { REGISTERED } from "@/lib/event-responses";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Live event" };

// Page /live/<id> : le direct vidéo d'un événement.
// Le coach (session admin) et les membres arrivent dans la même salle.
export default function LiveEventPage({
  params,
  searchParams,
}: PageProps<"/live/[id]">) {
  return (
    <main className="flex h-dvh flex-col bg-zinc-950">
      <Suspense
        fallback={<p className="m-auto text-zinc-400">Connecting...</p>}
      >
        {Promise.all([params, searchParams]).then(([{ id }, query]) => (
          <LiveEvent eventId={id} asAdmin={query.as === "admin"} />
        ))}
      </Suspense>
    </main>
  );
}

/**
 * Qui entre. Comme admin seulement depuis l'espace admin (lien "?as=admin"), sinon comme membre.
 * Le nom : "Admin", "Prénom · Teacher", "Prénom · Leader", ou le prénom.
 */
async function whoIsJoining(
  asAdmin: boolean,
): Promise<{
  id: string;
  name: string;
  coach: boolean;
  country: string | null;
}> {
  if (asAdmin && (await isAdmin()))
    return { id: "coach", name: "Admin", coach: true, country: null };
  if (!(await getCurrentUser()) && (await isAdmin()))
    return { id: "coach", name: "Admin", coach: true, country: null };
  const user = await requireMember();
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true, country: true },
  });
  const role =
    profile?.role === "teacher"
      ? " · Teacher"
      : profile?.role === "leader"
        ? " · Leader"
        : "";
  return {
    id: user.id,
    name: `${user.firstName}${role}`,
    coach: false,
    country: countryCodeOf(profile?.country),
  };
}

async function LiveEvent({
  eventId,
  asAdmin,
}: {
  eventId: string;
  asAdmin: boolean;
}) {
  const person = await whoIsJoining(asAdmin);
  const leaveTo = person.coach ? "/admin/events" : "/events";

  const event = await getLiveEvent(eventId);
  if (!event) notFound();

  // L'hôte : l'admin, ou le Leader / Teacher qui organise l'événement

  const hosting = person.coach || (event.createdById !== null && event.createdById === person.id);

  // Événement payant : seulement les inscrits dont l'admin a confirmé le paiement.
  if (event.isPaid && !hosting) {
    const registration = await prisma.eventResponse.findFirst({
      where: { eventId: event.id, userId: person.id, status: REGISTERED },
      select: { paidAt: true },
    });
    if (!registration?.paidAt) {
      return (
        <div className="m-auto max-w-sm px-6 text-center">
          <h1 className="font-display text-2xl font-bold text-white">
            {registration ? "Payment not confirmed yet" : "Registration needed"}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {registration
              ? "This is a paid event. You can join as soon as the admin confirms your payment."
              : "This is a paid event. Register and pay on the Events page to join the live."}
          </p>
          <Link
            href="/events"
            className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
          >
            Back to events
          </Link>
        </div>
      );
    }
  }

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
            : "The host has not started this event yet. You will get a notification."}
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

  // Complet ? (On peut revenir si on y est déjà, par exemple après un rechargement.)
  if (event.maxParticipants) {
    const people = await createRoomServiceClient()
      .listParticipants(`${EVENT_ROOM_PREFIX}${event.id}`)
      .then((list) => list.map((participant) => participant.identity))
      .catch(() => null);
    if (
      people &&
      people.length >= event.maxParticipants &&
      !people.includes(person.id)
    ) {
      return (
        <div className="m-auto max-w-sm px-6 text-center">
          <h1 className="font-display text-2xl font-bold text-white">
            This live is full
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {people.length}/{event.maxParticipants} people are already inside.
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
  }

  // L'activité, ses fichiers et ceux de l'événement (montrés par l'admin, comme dans une room)
  const activity = await getActivity(event.activity);
  const files = hosting
    ? [
        ...(await listFilesForActivity(eventFilesKey(event.id))),
        ...(await listFilesForActivity(event.activity)),
      ]
    : [];
  const endsAt =
    event.durationMin && event.liveStartedAt
      ? new Date(
          event.liveStartedAt.getTime() + event.durationMin * 60 * 1000,
        ).toISOString()
      : null;

  const [serverUrl, token] = await Promise.all([
    getBrowserLiveKitUrl(),
    createParticipantToken({
      identity: person.id,
      name: person.name,
      metadata: JSON.stringify({ country: person.country }),
      roomName: `${EVENT_ROOM_PREFIX}${event.id}`,
    }),
  ]);

  return (
    <VideoRoom
      token={token}
      serverUrl={serverUrl}
      leaveTo={leaveTo}
      stage={{
        isHost: hosting,
        files,
        activityName: activity?.name ?? event.activity ?? event.title,
      }}
      onTimeUp={endsAt ? endLiveIfOver.bind(null, event.id) : undefined}
      room={{
        activityIcon: activity?.icon ?? "🔴",
        activityName: activity
          ? `${activity.name} · Live event`
          : event.activity
            ? `${event.activity} · Live event`
            : "Live event",
        theme: event.topic ?? event.title,
        description: event.description,
        format: null,
        level: null,
        durationMin: event.durationMin,
        endsAt,
      }}
    />
  );
}
