import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { delay, GlassCard, PageHeader } from "@/components/app-ui";
import { RoomProgress, RoomTimeLeft } from "@/components/room-timer";
import { findActivity, levelLabel } from "@/lib/room-activities";
import { listOpenRooms } from "@/lib/rooms";
import { requireMember } from "@/lib/session";
import { CreateRoomForm } from "./create-room-form";

export const metadata: Metadata = { title: "Rooms" };

// Page /rooms : les salles de groupe ouvertes, et en créer une.
export default function RoomsPage() {
  return (
    <Suspense
      fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}
    >
      <RoomsHome />
    </Suspense>
  );
}

async function RoomsHome() {
  const user = await requireMember();
  const rooms = await listOpenRooms(user.id);

  return (
    <>
      <PageHeader
        title="Rooms"
        subtitle="Group conversations, open to every member."
      />

      <div className="space-y-5">
        <div className="anim-rise" style={delay(150)}>
          <CreateRoomForm />
        </div>

        <div className="anim-rise space-y-3" style={delay(280)}>
          <h2 className="px-1 font-display text-lg font-bold text-white">
            Open rooms
          </h2>

          {rooms === null ? (
            <GlassCard>
              <p className="text-sm text-amber-300">
                The video server is not running, so rooms are unavailable right
                now.
              </p>
            </GlassCard>
          ) : rooms.length === 0 ? (
            <GlassCard>
              <p className="text-center text-sm text-white/60">
                No open room right now. Be the first to create one!
              </p>
            </GlassCard>
          ) : (
            <ul className="space-y-4">
              {rooms.map((room, index) => {
                const activity = findActivity(room.activity);
                const level = levelLabel(room.level);
                const isFull =
                  room.maxParticipants !== null && room.participants >= room.maxParticipants;
                const chips = [
                  level,
                  room.format,
                  room.durationMin ? `${room.durationMin} min` : null,
                ].filter((chip): chip is string => Boolean(chip));
                return (
                  <li key={room.id} className="anim-rise" style={delay(320 + index * 80)}>
                    <article className="neu group overflow-hidden rounded-3xl transition duration-300 hover:-translate-y-0.5">
                      <div className="flex gap-4 p-5 pb-4">
                        {/* L activité, en grande icône */}
                        <span
                          title={activity?.name}
                          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-brand font-display text-xl font-bold text-white shadow-lg ring-1 ring-white/20"
                        >
                          {activity ? (
                            <span aria-hidden className="text-3xl leading-none drop-shadow">
                              {activity.icon}
                            </span>
                          ) : (
                            (room.name[0]?.toUpperCase() ?? "R")
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {activity && (
                              <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                                {activity.name}
                              </span>
                            )}
                            {room.isPrivate && (
                              <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                                <LockIcon /> Private
                              </span>
                            )}
                          </div>
                          <h3 className="break-words font-display text-lg font-bold leading-snug text-white">
                            {room.name}
                          </h3>
                          {room.topic && (
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/80">
                              <span aria-hidden className="text-accent">“</span>
                              {room.topic}
                              <span aria-hidden className="text-accent">”</span>
                            </p>
                          )}
                          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-white/55">
                            <span>Hosted by {room.isMine ? "you" : room.hostName}</span>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-1.5">
                              <PeopleDot />
                              <span className={isFull ? "font-semibold text-accent" : ""}>
                                {room.participants}
                                {room.maxParticipants !== null && `/${room.maxParticipants}`}
                              </span>{" "}
                              {isFull ? "· full" : "in the room"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Le niveau, le format, la durée */}
                      {chips.length > 0 && (
                        <ul className="flex flex-wrap gap-1.5 px-5 pb-4">
                          {chips.map((chip) => (
                            <li
                              key={chip}
                              className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/75 ring-1 ring-white/10"
                            >
                              {chip}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Le temps restant et le bouton */}
                      <div className="flex items-center gap-3 border-t border-white/10 bg-white/[0.03] px-5 py-3">
                        <div className="min-w-0 flex-1">
                          {room.endsAt ? (
                            <RoomTimeLeft endsAt={room.endsAt} />
                          ) : (
                            <span className="text-xs text-white/50">No time limit</span>
                          )}
                          {room.isPrivate && room.isMine && (
                            <p className="mt-1 truncate text-[11px] text-white/45">
                              Share the room link to invite people.
                            </p>
                          )}
                        </div>
                        {isFull ? (
                          <span className="shrink-0 rounded-full bg-white/10 px-5 py-2 text-sm font-bold text-white/50">
                            Full
                          </span>
                        ) : (
                          <Link
                            href={`/room/${room.id}`}
                            className="neu-btn shrink-0 rounded-full bg-brand px-5 py-2 text-sm font-bold text-white shadow-md"
                          >
                            Join
                          </Link>
                        )}
                      </div>

                      {room.endsAt && room.durationMin && (
                        <RoomProgress endsAt={room.endsAt} durationMin={room.durationMin} />
                      )}
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function PeopleDot() {
  return <span aria-hidden className="size-1.5 rounded-full bg-green-400" />;
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
