import type { Metadata } from "next";
import { getEventRegistrations } from "@/lib/event-responses";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { eventIsLive } from "@/lib/event-live";
import { CalendarIcon } from "../admin-icons";
import { AdminHeader, delay, EmptyState, Panel } from "../admin-ui";
import { AdminEventItem } from "./admin-event-item";
import { CreateEventForm } from "./create-event-form";

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
      liveStartedAt: true,
      liveEndedAt: true,
      isPaid: true,
      price: true,
      currency: true,
    },
  });
  const registrations = await getEventRegistrations(
    rows.map((row) => row.id),
    null,
    true,
  );
  const now = Date.now();
  return rows.map((event) => ({
    ...event,
    registered: registrations.get(event.id)?.people ?? [],
    past: Boolean(event.startsAt && event.startsAt.getTime() < now),
    live: eventIsLive(event),
  }));
}

/** Date au format du champ datetime-local (heure du serveur, comme à l'enregistrement). */
function toInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

      <div className="grid items-start gap-5 xl:grid-cols-5">
        {/* ----- Publier ----- */}
        <div className="xl:sticky xl:top-8 xl:col-span-2">
          <CreateEventForm />
        </div>

        {/* ----- Ce qui est publié ----- */}
        <Panel
          className="xl:col-span-3"
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
                <AdminEventItem
                  key={event.id}
                  event={{
                    id: event.id,
                    kind: event.kind === "announcement" ? "announcement" : "event",
                    title: event.title,
                    description: event.description,
                    startsAtInput: event.startsAt ? toInputValue(event.startsAt) : "",
                    dayLabel: event.startsAt ? day.format(event.startsAt) : null,
                    monthLabel: event.startsAt ? month.format(event.startsAt) : null,
                    whenLabel: event.startsAt
                      ? full.format(event.startsAt)
                      : `Posted ${full.format(event.createdAt)}`,
                    hasImage: Boolean(event.imageType),
                    isPaid: event.isPaid,
                    price: event.price,
                    currency: event.currency,
                    registered: event.registered,
                    past: event.past,
                    live: event.live,
                  }}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
