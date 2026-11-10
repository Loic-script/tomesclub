import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { delay, GlassCard, PageHeader } from "@/components/app-ui";
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
                const details = [
                  `Hosted by ${room.isMine ? "you" : room.hostName}`,
                  room.durationMin ? `${room.durationMin} min` : null,
                  level,
                  room.isPrivate && room.isMine ? "share the link to invite" : null,
                ].filter(Boolean);
                return (
                  <li key={room.id} className="anim-rise" style={delay(320 + index * 80)}>
                    <GlassCard className="flex items-center gap-4">
                      <span
                        title={activity?.name}
                        className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-brand font-display text-lg font-bold text-white shadow-md"
                      >
                        {activity ? (
                          <span aria-hidden className="text-2xl leading-none">
                            {activity.icon}
                          </span>
                        ) : (
                          (room.name[0]?.toUpperCase() ?? "R")
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate font-semibold text-white">
                          {room.name}
                          {room.isPrivate && (
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                              <LockIcon /> Private
                            </span>
                          )}
                        </p>
                        {activity && (
                          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-accent">
                            {activity.name}
                          </p>
                        )}
                        {room.topic && (
                          <p className="line-clamp-2 text-sm text-white/85">{room.topic}</p>
                        )}
                        <p className="mt-0.5 truncate text-xs text-white/60">{details.join(" · ")}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="neu-inset flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white/75">
                          <PeopleDot /> {room.participants}
                        </span>
                        <Link
                          href={`/room/${room.id}`}
                          className="neu-btn rounded-full bg-brand px-4 py-2 text-sm font-bold text-white shadow-md"
                        >
                          Join
                        </Link>
                      </div>
                    </GlassCard>
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
