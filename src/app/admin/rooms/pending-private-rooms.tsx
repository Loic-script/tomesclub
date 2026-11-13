"use client";

import { useTransition } from "react";
import { ActivityIcon } from "@/components/activity-icon";
import { MvolaLogo, ScreenshotIcon } from "@/components/payment-dialog";
import { userTypeLabel } from "@/lib/onboarding-options";
import { approvePrivateRoomAction, refusePrivateRoomAction } from "./actions";

// Les salles privées demandées par un Leader / Teacher : l'admin accepte ou refuse.

export type PendingRoomView = {
  id: string;
  name: string;
  topic: string | null;
  activityIcon: string | null;
  activityName: string | null;
  durationMin: number | null;
  hostName: string;
  hostRole: string;
  invitees: string[];
  askedLabel: string;
  /** Le paiement annoncé par l'hôte : à vérifier sur le téléphone de l'admin. */
  payment: { ref: string | null; proofId: string | null; amount: string } | null;
};

export function PendingPrivateRooms({ rooms }: { rooms: PendingRoomView[] }) {
  return (
    <ul className="space-y-3">
      {rooms.map((room) => (
        <PendingRow key={room.id} room={room} />
      ))}
    </ul>
  );
}

function PendingRow({ room }: { room: PendingRoomView }) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="neu-inset rounded-2xl p-3.5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg ring-1 ring-white/20">
          <ActivityIcon icon={room.activityIcon} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-white">
            {room.name}
          </p>
          <p className="mt-0.5 text-xs text-white/60">
            {room.hostName} · <span className="text-accent">{userTypeLabel(room.hostRole)}</span> · asked{" "}
            {room.askedLabel}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {[room.activityName, room.topic, room.durationMin ? `${room.durationMin} min` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-1 text-xs text-white/50">
            <span className="font-semibold text-white/70">
              {room.invitees.length} invited
              {room.invitees.length > 0 ? ": " : ""}
            </span>
            {room.invitees.join(", ")}
          </p>
          {room.payment ? (
            <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 rounded-xl bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-100 ring-1 ring-emerald-400/30">
              Paid {room.payment.amount} by <MvolaLogo /> <strong>MVola</strong>
              {room.payment.ref && (
                <>
                  {" "}· ref{" "}
                  <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[11px] text-white">{room.payment.ref}</code>
                </>
              )}
              {room.payment.proofId && (
                <a
                  href={`/api/payment-proofs/${room.payment.proofId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 font-semibold text-white hover:bg-white/20"
                >
                  <ScreenshotIcon />
                  View screenshot
                </a>
              )}
              <span className="text-emerald-200/70">— check it before accepting</span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-amber-300">No payment information.</p>
          )}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => approvePrivateRoomAction(room.id))}
            className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-400 disabled:opacity-60 sm:flex-none"
          >
            {pending ? "..." : "Accept"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => refusePrivateRoomAction(room.id))}
            className="flex-1 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/75 transition hover:bg-red-500/20 hover:text-red-200 disabled:opacity-60 sm:flex-none"
          >
            Refuse
          </button>
        </div>
      </div>
    </li>
  );
}
