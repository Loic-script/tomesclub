import type { Metadata } from "next";
import { ActivityIcon } from "@/components/activity-icon";
import Link from "next/link";
import { Suspense } from "react";
import { RoomProgress, RoomTimeLeft } from "@/components/room-timer";
import { requireAdmin } from "@/lib/admin";
import { getActivityMap, listActivities } from "@/lib/activities";
import { listFilesByActivity } from "@/lib/activity-files";
import { levelLabel } from "@/lib/room-activities";
import { listInvitableMembers, listPendingRooms } from "@/lib/private-rooms";
import { listOpenRooms } from "@/lib/rooms";
import { CreateRoomForm } from "../../(app)/rooms/create-room-form";
import { RoomIcon, UsersIcon } from "../admin-icons";
import { AdminHeader, Chip, delay, EmptyState, Panel, timeAgo } from "../admin-ui";
import { ActivityManager } from "./activity-manager";
import { adminCreateRoomAction } from "./actions";
import { CloseRoomButton } from "./close-room-button";
import { PendingPrivateRooms } from "./pending-private-rooms";

export const metadata: Metadata = { title: "Rooms · Admin" };

// Page /admin/rooms : les salles ouvertes, en ouvrir une, et gérer les activités.
export default function AdminRoomsPage() {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
      <AdminRooms />
    </Suspense>
  );
}

async function AdminRooms() {
  await requireAdmin();
  const [rooms, activities, files, pendingRooms, members] = await Promise.all([
    listOpenRooms(null),
    listActivities(),
    listFilesByActivity(),
    listPendingRooms(),
    listInvitableMembers(null),
  ]);
  const activityByKey = await getActivityMap([
    ...(rooms ?? []).map((room) => room.activity),
    ...pendingRooms.map((room) => room.activity),
  ]);
  const people = (rooms ?? []).reduce((sum, room) => sum + room.participants, 0);
  const custom = activities.filter((activity) => activity.custom).length;

  return (
    <>
      <AdminHeader
        eyebrow="Group practice"
        title="Rooms"
        subtitle={`${rooms?.length ?? 0} live ${rooms?.length === 1 ? "room" : "rooms"} · ${people} people inside · ${activities.length} activities`}
      />

      {/* ----- Les salles privées qui attendent l admin ----- */}
      {pendingRooms.length > 0 && (
        <Panel
          className="mb-5 ring-1 ring-amber-300/30"
          style={delay(80)}
          title="Private room requests"
          icon={<LockIcon />}
          action={<Chip tone="warn">{pendingRooms.length} waiting</Chip>}
        >
          <PendingPrivateRooms
            rooms={pendingRooms.map((room) => {
              const activity = room.activity ? activityByKey.get(room.activity) : undefined;
              return {
                id: room.id,
                name: room.name,
                topic: room.topic,
                activityIcon: activity?.icon ?? null,
                activityName: activity?.name ?? null,
                durationMin: room.durationMin,
                hostName: room.hostName,
                hostRole: room.hostRole,
                invitees: room.invitees,
                askedLabel: timeAgo(room.createdAt),
                payment:
                  room.paymentRef || room.paymentProofId
                    ? {
                        ref: room.paymentRef,
                        proofId: room.paymentProofId,
                        amount: `${new Intl.NumberFormat("fr-FR").format(room.paymentAmount ?? 0)} Ar`,
                      }
                    : null,
              };
            })}
          />
        </Panel>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-5">
        {/* ----- Les salles ouvertes ----- */}
        <Panel
          className="xl:col-span-3"
          style={delay(100)}
          title="Live rooms"
          icon={<RoomIcon className="size-[18px]" />}
          action={rooms && rooms.length > 0 ? <Chip tone="good">● {rooms.length} open</Chip> : undefined}
        >
          {rooms === null ? (
            <p className="rounded-2xl bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
              The video server is not running, so rooms are unavailable right now.
            </p>
          ) : rooms.length === 0 ? (
            <EmptyState
              icon={<RoomIcon />}
              title="No room open"
              text="Open one yourself, or wait for members to start one."
            />
          ) : (
            <ul className="space-y-3">
              {rooms.map((room) => {
                const activity = room.activity ? activityByKey.get(room.activity) : undefined;
                const full = room.maxParticipants !== null && room.participants >= room.maxParticipants;
                return (
                  <li key={room.id} className="neu-inset overflow-hidden rounded-2xl">
                    <div className="flex flex-wrap items-center gap-3 p-3.5">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-brand text-white shadow-lg ring-1 ring-white/20">
                        <ActivityIcon icon={activity?.icon} className="size-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-accent">
                          {activity?.name ?? room.name}
                        </p>
                        <p className="truncate text-sm font-semibold text-white">{room.topic ?? room.name}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-white/50">
                          <span>by {room.hostName}</span>
                          <span className="flex items-center gap-1">
                            <UsersIcon className="size-3.5" />
                            {room.participants}
                            {room.maxParticipants !== null && `/${room.maxParticipants}`}
                            {full && " · full"}
                          </span>
                          {room.endsAt ? (
                            <RoomTimeLeft endsAt={room.endsAt} refreshOnEnd className="font-bold" />
                          ) : (
                            <span>No time limit</span>
                          )}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {room.isPrivate && <Chip>Private</Chip>}
                          {room.level && <Chip tone="navy">{levelLabel(room.level)}</Chip>}
                          {room.format && <Chip>{room.format}</Chip>}
                        </div>
                      </div>
                      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                        <CloseRoomButton roomId={room.id} />
                        <Link
                          href={`/room/${room.id}?as=admin`}
                          className="neu-btn rounded-full bg-gradient-to-r from-accent to-brand px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand/30"
                        >
                          Join
                        </Link>
                      </div>
                    </div>
                    {room.endsAt && room.durationMin && (
                      <RoomProgress endsAt={room.endsAt} durationMin={room.durationMin} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* ----- Ouvrir une salle (hôte : Coach) ----- */}
        <section className="anim-rise space-y-3 xl:col-span-2" style={delay(160)}>
          <div className="px-1">
            <h2 className="font-display text-lg font-bold text-white">Open a room</h2>
            <p className="text-xs text-white/50">You will be the host, shown as “Admin”.</p>
          </div>
          <CreateRoomForm
            activities={activities}
            action={adminCreateRoomAction}
            privateMode="direct"
            members={members}
          />
        </section>
      </div>

      {/* ----- Les activités et leurs thèmes ----- */}
      <Panel
        className="mt-5"
        style={delay(220)}
        title={
          <>
            Activities &amp; themes{" "}
            <span className="text-sm font-semibold text-white/40">
              ({activities.length - custom} built-in · {custom} yours)
            </span>
          </>
        }
        icon={<ActivityIcon icon="🎯" className="size-[18px]" />}
      >
        <ActivityManager
          activities={activities}
          files={files}
          storageReady={Boolean(process.env.TWINS_VOLUME_MOUNT_PATH || process.env.UPLOAD_DIR)}
        />
      </Panel>
    </>
  );
}

/** Un cadenas fin (même style que les autres icônes de l'admin). */
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-[18px]">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
