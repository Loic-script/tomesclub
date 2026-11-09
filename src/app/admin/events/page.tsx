import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { CreateEventForm } from "./create-event-form";
import { DeleteEventButton } from "./delete-event-button";

export const metadata: Metadata = { title: "Events · Admin" };

// Page /admin/events : publier et gérer les événements et annonces du club.
export default function AdminEventsPage() {
  return (
    <Suspense fallback={<p className="m-auto text-zinc-500">Loading...</p>}>
      <AdminEvents />
    </Suspense>
  );
}

async function AdminEvents() {
  await requireAdmin();

  const events = await prisma.event.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 50,
  });

  const format = (date: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-display text-2xl font-bold text-navy">Events &amp; announcements</h1>

      <CreateEventForm />

      <h2 className="mb-3 mt-8 font-display text-lg font-bold text-navy">
        Published <span className="text-base font-semibold text-zinc-400">({events.length})</span>
      </h2>

      {events.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-zinc-500 shadow-sm">
          Nothing published yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
            >
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  event.kind === "event" ? "bg-brand/10 text-brand" : "bg-navy/10 text-navy"
                }`}
              >
                {event.kind === "event" ? "Event" : "Announcement"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-900">{event.title}</p>
                <p className="text-xs text-zinc-500">
                  {event.startsAt ? `Starts ${format(event.startsAt)}` : `Posted ${format(event.createdAt)}`}
                </p>
              </div>
              <DeleteEventButton eventId={event.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
