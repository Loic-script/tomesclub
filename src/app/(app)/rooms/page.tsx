import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { delay, GlassCard, PageHeader } from "@/components/app-ui";
import { listOpenRooms } from "@/lib/rooms";
import { requireMember } from "@/lib/session";
import { CreateRoomForm } from "./create-room-form";

export const metadata: Metadata = { title: "Rooms" };

// Page /rooms : les salles de groupe ouvertes, et en créer une.
export default function RoomsPage() {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
      <RoomsHome />
    </Suspense>
  );
}

async function RoomsHome() {
  await requireMember();
  const rooms = await listOpenRooms();

  return (
    <>
      <PageHeader title="Rooms" subtitle="Group conversations, open to every member." />

      <div className="space-y-5">
        <div className="anim-rise" style={delay(150)}>
          <CreateRoomForm />
        </div>

        <div className="anim-rise space-y-3" style={delay(280)}>
          <h2 className="px-1 font-display text-lg font-bold text-white">Open rooms</h2>

          {rooms === null ? (
            <GlassCard>
              <p className="text-sm text-amber-200">
                The video server is not running, so rooms are unavailable right now.
              </p>
            </GlassCard>
          ) : rooms.length === 0 ? (
            <GlassCard>
              <p className="text-center text-sm text-white/60">
                No open room right now. Be the first to create one!
              </p>
            </GlassCard>
          ) : (
            <ul className="space-y-3">
              {rooms.map((room, index) => (
                <li key={room.id} className="anim-rise" style={delay(320 + index * 80)}>
                  <GlassCard className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/80 to-brand/60 font-display text-lg font-bold text-white">
                      {room.name[0]?.toUpperCase() ?? "R"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{room.name}</p>
                      <p className="truncate text-xs text-white/55">
                        {room.topic ? `${room.topic} · ` : ""}Hosted by {room.hostName}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80">
                        <PeopleDot /> {room.participants}
                      </span>
                      <Link
                        href={`/room/${room.id}`}
                        className="rounded-full bg-white px-4 py-2 text-sm font-bold text-brand shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        Join
                      </Link>
                    </div>
                  </GlassCard>
                </li>
              ))}
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
