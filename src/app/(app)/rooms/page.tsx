import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { delay, EmptyState, PageHeader, PageSkeleton, SectionHeader } from "@/components/app-ui";
import { LockIcon, PeopleIcon, PlusIcon } from "@/components/icons";
import { listOpenRooms } from "@/lib/rooms";
import { requireMember } from "@/lib/session";
import { CreateRoomForm } from "./create-room-form";

export const metadata: Metadata = { title: "Rooms" };

// Page /rooms : rejoindre une salle de groupe ouverte (action principale),
// ou en créer une (formulaire à côté sur grand écran).
export default function RoomsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RoomsHome />
    </Suspense>
  );
}

async function RoomsHome() {
  const user = await requireMember();
  const rooms = await listOpenRooms(user.id);

  return (
    <>
      <PageHeader title="Rooms" subtitle="Group conversations, open to every member." />

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_var(--spacing-rail)]">
        {/* ----- Les salles ouvertes ----- */}
        <section aria-labelledby="open-rooms" className="anim-rise min-w-0" style={delay(80)}>
          <SectionHeader
            id="open-rooms"
            title="Open rooms"
            count={rooms?.length}
            description="Join a conversation that is happening now."
          />

          {rooms === null ? (
            <p className="well px-4 py-3 text-sm text-mute">
              The video server is not running, so rooms are unavailable right now.
            </p>
          ) : rooms.length === 0 ? (
            <EmptyState
              icon={<PeopleIcon />}
              title="No open room right now"
              description="Be the first: open a room, give it a topic, and the club gets a notification."
              action={
                <a href="#create-room" className="btn btn-primary xl:hidden">
                  <PlusIcon className="size-4" />
                  Create a room
                </a>
              }
            />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {rooms.map((room, index) => (
                <li
                  key={room.id}
                  className="anim-rise card flex flex-col gap-4 p-5"
                  style={delay(120 + Math.min(index, 6) * 50)}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 font-display text-lg font-semibold text-brand">
                      {room.name[0]?.toUpperCase() ?? "R"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-semibold text-ink">{room.name}</h3>
                      {room.topic && <p className="mt-0.5 text-sm text-mute">{room.topic}</p>}
                    </div>
                    {room.isPrivate && (
                      <span className="chip shrink-0 bg-accent-100 font-semibold text-accent-700">
                        <LockIcon className="size-3.5" />
                        Private
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 border-t border-line pt-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-mute">
                      <span aria-hidden className="size-2 rounded-full bg-success" />
                      {room.participants} {room.participants === 1 ? "person" : "people"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-mute">
                      · Hosted by {room.isMine ? "you" : room.hostName}
                    </span>
                    <Link href={`/room/${room.id}`} className="btn btn-primary shrink-0">
                      Join
                    </Link>
                  </div>
                  {room.isPrivate && room.isMine && (
                    <p className="-mt-1 text-xs text-mute">Share the room link to invite people.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ----- Créer une salle ----- */}
        <aside className="anim-rise min-w-0 xl:sticky xl:top-10" style={delay(160)}>
          <CreateRoomForm />
        </aside>
      </div>
    </>
  );
}
