import type { Metadata } from "next";
import { userTypeLabel } from "@/lib/onboarding-options";
import { formatEventPrice } from "@/lib/event-price";
import { formatMoney, revenueOf } from "@/lib/member-events";
import { EventRequests } from "./event-requests";
import { getEventRegistrations } from "@/lib/event-responses";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { eventIsLive } from "@/lib/event-live";
import { CalendarIcon } from "../admin-icons";
import { AdminHeader, delay, EmptyState, Panel } from "../admin-ui";
import { AdminEventItem } from "./admin-event-item";
import { NewEventButton } from "./create-event-form";
import { listActivities } from "@/lib/activities";
import { listFilesByActivity } from "@/lib/activity-files";
import { eventFilesKey } from "@/lib/event-price";

export const metadata: Metadata = { title: "Events · Admin" };

// Page /admin/events : publier et gérer les événements et annonces du club.
export default function AdminEventsPage() {
  return (
    <Suspense
      fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}
    >
      <AdminEvents />
    </Suspense>
  );
}

/** Les événements (sans les octets de l'image) + les réponses, et "passé ou pas". */
async function loadEvents() {
  const rows = await prisma.event.findMany({
    where: { status: "published" },
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
      activity: true,
      topic: true,
      durationMin: true,
      maxParticipants: true,
      createdBy: {
        select: {
          name: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
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
  const [events, activities] = await Promise.all([
    loadEvents(),
    listActivities(),
  ]);
  // Les demandes des Leaders / Teachers
  const requests = await prisma.event.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      isPaid: true,
      price: true,
      currency: true,
      activity: true,
      durationMin: true,
      maxParticipants: true,
      createdBy: {
        select: {
          name: true,
          profile: { select: { firstName: true, lastName: true, role: true } },
        },
      },
    },
  });
  const filesByKey = await listFilesByActivity(
    events.map((event) => eventFilesKey(event.id)),
  );
  const activityByKey = new Map(
    activities.map((activity) => [activity.key, activity]),
  );
  // Pour les formulaires : chaque activité avec ses thèmes proposés
  const activityChoices = activities.map((activity) => ({
    key: activity.key,
    name: activity.name,
    topics: activity.categories.flatMap((category) => category.topics),
  }));
  const storageReady = Boolean(
    process.env.TWINS_VOLUME_MOUNT_PATH || process.env.UPLOAD_DIR,
  );
  const upcoming = events.filter(
    (event) => event.kind === "event" && !event.past,
  ).length;

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
        right={<NewEventButton activities={activityChoices} />}
      />

      {/* ----- Les événements proposés par les Leaders / Teachers ----- */}
      {requests.length > 0 && (
        <Panel
          className="mb-5 ring-1 ring-amber-300/30"
          style={delay(80)}
          title="Event requests"
          icon={<CalendarIcon className="size-[18px]" />}
          action={
            <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold text-amber-300">
              {requests.length} waiting
            </span>
          }
        >
          <EventRequests
            requests={requests.map((request) => ({
              id: request.id,
              title: request.title,
              hostName: request.createdBy?.profile
                ? `${request.createdBy.profile.firstName} ${request.createdBy.profile.lastName}`
                : (request.createdBy?.name ?? "A member"),
              hostRole: userTypeLabel(request.createdBy?.profile?.role),
              whenLabel: request.startsAt
                ? full.format(request.startsAt)
                : null,
              priceLabel: formatEventPrice(request),
              details: [
                request.activity
                  ? (activityByKey.get(request.activity)?.name ??
                    request.activity)
                  : null,
                request.durationMin ? `${request.durationMin} min` : null,
                request.maxParticipants
                  ? `${request.maxParticipants} places`
                  : null,
              ]
                .filter(Boolean)
                .join(" · "),
              description: request.description,
            }))}
          />
        </Panel>
      )}

      <div>
        {/* ----- Ce qui est publié (on publie avec le bouton "New event") ----- */}
        <Panel
          style={delay(160)}
          title={
            <>
              Published{" "}
              <span className="text-sm font-semibold text-white/40">
                ({events.length})
              </span>
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
                  activities={activityChoices}
                  storageReady={storageReady}
                  event={{
                    hostName: event.createdBy
                      ? event.createdBy.profile
                        ? `${event.createdBy.profile.firstName} ${event.createdBy.profile.lastName}`
                        : event.createdBy.name
                      : null,
                    revenue: (() => {
                      const revenue = event.createdBy
                        ? revenueOf(
                            event,
                            event.registered.filter((person) => person.paid)
                              .length,
                          )
                        : null;
                      return revenue
                        ? {
                            collected: formatMoney(
                              revenue.collected,
                              revenue.currency,
                            ),
                            admin: formatMoney(
                              revenue.adminShare,
                              revenue.currency,
                            ),
                            host: formatMoney(
                              revenue.hostShare,
                              revenue.currency,
                            ),
                          }
                        : null;
                    })(),
                    activity: event.activity,
                    activityName: event.activity
                      ? (activityByKey.get(event.activity)?.name ??
                        event.activity)
                      : null,
                    activityIcon: event.activity
                      ? (activityByKey.get(event.activity)?.icon ?? null)
                      : null,
                    topic: event.topic,
                    durationMin: event.durationMin,
                    maxParticipants: event.maxParticipants,
                    files: filesByKey[eventFilesKey(event.id)] ?? [],
                    id: event.id,
                    kind:
                      event.kind === "announcement" ? "announcement" : "event",
                    title: event.title,
                    description: event.description,
                    startsAtInput: event.startsAt
                      ? toInputValue(event.startsAt)
                      : "",
                    dayLabel: event.startsAt
                      ? day.format(event.startsAt)
                      : null,
                    monthLabel: event.startsAt
                      ? month.format(event.startsAt)
                      : null,
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
