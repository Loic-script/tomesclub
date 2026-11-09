"use client";

import { useActionState, useState } from "react";
import { createRoomAction, type CreateRoomState } from "./actions";

const initialState: CreateRoomState = { error: null };

// Le formulaire "Create a room", replié derrière un bouton.
export function CreateRoomForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createRoomAction, initialState);

  const field =
    "neu-inset w-full rounded-xl px-3 py-2 text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:ring-2 focus:ring-brand/30";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="neu neu-btn flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-bold text-brand"
      >
        <PlusIcon rotated={open} />
        {open ? "Close" : "Create a room"}
      </button>

      {/* Le formulaire se déplie sous le bouton */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden p-1">
          <form action={formAction} className="neu space-y-3 rounded-3xl p-5">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-600">Room name *</span>
              <input
                name="name"
                type="text"
                required
                maxLength={60}
                placeholder="e.g. Morning conversation club"
                className={field}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-600">Topic (optional)</span>
              <input
                name="topic"
                type="text"
                maxLength={80}
                placeholder="e.g. Talk about your week"
                className={field}
              />
            </label>
            <p aria-live="polite" className="min-h-5 text-sm text-red-600">
              {state.error}
            </p>
            <button
              type="submit"
              disabled={pending}
              className="neu-btn w-full rounded-full bg-brand px-5 py-2.5 font-bold text-white shadow-md disabled:opacity-60"
            >
              {pending ? "Opening the room..." : "Open the room"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PlusIcon({ rotated }: { rotated: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-5 transition-transform duration-300 ${rotated ? "rotate-45" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
