"use client";

import { useActionState, useState } from "react";
import { createRoomAction, type CreateRoomState } from "./actions";

const VISIBILITIES = [
  { value: "public", label: "Public", hint: "Everyone sees it in the list." },
  { value: "private", label: "Private", hint: "Only people with the link can join." },
] as const;

const initialState: CreateRoomState = { error: null };

// Le formulaire "Create a room", replié derrière un bouton.
export function CreateRoomForm() {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [state, formAction, pending] = useActionState(createRoomAction, initialState);

  const field =
    "neu-inset w-full rounded-xl px-3 py-2 text-white placeholder:text-white/40 outline-none transition focus:ring-2 focus:ring-accent/40";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="neu neu-btn flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-bold text-white"
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
              <span className="mb-1 block text-sm font-medium text-white/75">Room name *</span>
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
              <span className="mb-1 block text-sm font-medium text-white/75">Topic (optional)</span>
              <input
                name="topic"
                type="text"
                maxLength={80}
                placeholder="e.g. Talk about your week"
                className={field}
              />
            </label>

            {/* Publique ou privée ? */}
            <div>
              <span className="mb-1 block text-sm font-medium text-white/75">Who can see it?</span>
              <div className="flex gap-2">
                {VISIBILITIES.map((option) => (
                  <label
                    key={option.value}
                    className={`flex-1 cursor-pointer rounded-xl px-3 py-2 text-center transition-all duration-200 ${
                      visibility === option.value
                        ? "neu-inset text-accent"
                        : "text-white/60 ring-1 ring-white/15 hover:text-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={visibility === option.value}
                      onChange={() => setVisibility(option.value)}
                      className="sr-only"
                    />
                    <span className="flex items-center justify-center gap-1.5 text-sm font-semibold">
                      {option.value === "private" && <LockIcon />}
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-white/50">
                {VISIBILITIES.find((option) => option.value === visibility)?.hint}
              </p>
            </div>
            <p aria-live="polite" className="min-h-5 text-sm text-amber-300">
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

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
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
