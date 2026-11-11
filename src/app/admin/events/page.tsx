import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { CalendarIcon, MegaphoneIcon } from "../admin-icons";
import { AdminHeader, Chip, delay, EmptyState, Panel } from "../admin-ui";
import { CreateEventForm } from "./create-event-form";
import { DeleteEventButton } from "./delete-event-button";

export const metadata: Metadata = { title: "Events · Admin" };

// Page /admin/events : publier et gérer les événements et annonces du club.
export default function AdminEventsPage() {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
      <AdminEvents />
    </Suspense>
  );
}

/** Les événements (sans les octets de l'image) + les réponses, et "passé ou pas". */
async function loadEvents() {
  const rows = await prisma.event.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      kind: true,
      title: true,
      description: true,
      startsAt: true,
      imageType: true,
      createdAt: true,
      responses: { select: { status: true } },
    },
  });
  const now = Date.now();
  return rows.map(({ responses, ...event }) => ({
    ...event,
    going: responses.filter((response) => response.status === "going").length,
    interested: responses.filter((response) => response.status === "interested").length,
    past: Boolean(event.startsAt && event.startsAt.getTime() < now),
  }));
}

async function AdminEvents() {
  await requireAdmin();
  const events = await loadEvents();
  const upcoming = events.filter((event) => event.kind === "event" && !event.past).length;

  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric" });
  const month = new Intl.DateTimeFormat("en-GB", { month: "short" });
  const full = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <AdminHeader
        eyebrow="Publishing"
        title="Events & news"
        subtitle={`${upcoming} upcoming ${upcoming === 1 ? "event" : "events"} · members are notified when you publish`}
      />

      <div className="grid items-start gap-5 lg:grid-cols-5">
        {/* ----- Publier ----- */}
        <div className="lg:sticky lg:top-8 lg:col-span-2">
          <CreateEventForm />
        </div>

        {/* ----- Ce qui est publié ----- */}
        <Panel
          className="lg:col-span-3"
          style={delay(160)}
          title={
            <>
              Published <span className="text-sm font-semibold text-white/40">({events.length})</span>
            </>
          }
          icon={<CalendarIcon className="size-[18px]" />}
        >
          {events.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon />}
              title="Nothing published yet"
              text="Your first class or news will show up here."
            />
          ) : (
            <ul className="space-y-3">
              {events.map((event) => (
                <li
                  key={event.id}
                  className={`neu-inset flex items-center gap-4 rounded-2xl p-3 ${event.past ? "opacity-60" : ""}`}
                >
                  {/* L'image, ou la date, ou le mégaphone */}
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-accent to-brand">
                    {event.imageType ? (
                      // eslint-disable-next-line @next/next/no-img-element -- image privée servie par notre API
                      <img src={`/api/event/image/${event.id}`} alt="" className="size-full object-cover" />
                    ) : event.startsAt ? (
                      <span className="flex size-full flex-col items-center justify-center text-white">
                        <span className="font-display text-xl font-extrabold leading-none">
                          {day.format(event.startsAt)}
                        </span>
                        <span className="text-[10px] font-bold uppercase">{month.format(event.startsAt)}</span>
                      </span>
                    ) : (
                      <span className="flex size-full items-center justify-center bg-gradient-to-br from-[#6d72ff] to-navy text-white">
                        <MegaphoneIcon className="size-6" />
                      </span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      {event.kind === "event" ? (
                        <Chip tone="accent">Event</Chip>
                      ) : (
                        <Chip tone="navy">Announcement</Chip>
                      )}
                      {event.past && <Chip>Past</Chip>}
                    </span>
                    <span className="mt-1 block truncate text-sm font-semibold text-white">{event.title}</span>
                    <span className="block truncate text-[11px] text-white/45">
                      {event.startsAt ? full.format(event.startsAt) : `Posted ${full.format(event.createdAt)}`}
                    </span>
                    {event.kind === "event" && (
                      <span className="mt-1.5 flex gap-3 text-[11px]">
                        <span className="font-semibold text-emerald-300">{event.going} going</span>
                        <span className="text-white/50">{event.interested} interested</span>
                      </span>
                    )}
                  </span>

                  <DeleteEventButton eventId={event.id} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
