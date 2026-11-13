"use client";

import { useTransition } from "react";
import { approveEventRequestAction, refuseEventRequestAction } from "./actions";

// Les événements proposés par les Leaders / Teachers : l'admin accepte (publié) ou refuse.

export type EventRequestView = {
  id: string;
  title: string;
  hostName: string;
  hostRole: string;
  whenLabel: string | null;
  priceLabel: string;
  details: string;
  description: string | null;
};

export function EventRequests({ requests }: { requests: EventRequestView[] }) {
  return (
    <ul className="space-y-3">
      {requests.map((request) => (
        <RequestRow key={request.id} request={request} />
      ))}
    </ul>
  );
}

function RequestRow({ request }: { request: EventRequestView }) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="neu-inset rounded-2xl p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">{request.title}</p>
          <p className="mt-0.5 text-xs text-white/60">
            by {request.hostName} · <span className="text-accent">{request.hostRole}</span>
          </p>
          <p className="mt-1 text-xs text-white/50">
            {[request.whenLabel, request.priceLabel, request.details].filter(Boolean).join(" · ")}
          </p>
          {request.description && <p className="mt-2 line-clamp-3 text-xs text-white/60">{request.description}</p>}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => refuseEventRequestAction(request.id))}
            className="flex-1 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/75 transition hover:bg-red-500/20 hover:text-red-200 disabled:opacity-60 sm:flex-none"
          >
            Refuse
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => approveEventRequestAction(request.id))}
            className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-400 disabled:opacity-60 sm:flex-none"
          >
            {pending ? "..." : "Accept"}
          </button>
        </div>
      </div>
    </li>
  );
}
