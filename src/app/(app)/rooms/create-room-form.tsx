"use client";

import { useActionState, useState } from "react";
import { GlobeIcon, LockIcon, PlusIcon } from "@/components/icons";
import { createRoomAction, type CreateRoomState } from "./actions";

const VISIBILITIES = [
  { value: "public", label: "Public", hint: "Everyone sees it in the list.", icon: GlobeIcon },
  { value: "private", label: "Private", hint: "Only people with the link can join.", icon: LockIcon },
] as const;

const initialState: CreateRoomState = { error: null };

// Le formulaire "Create a room" : compact, toujours visible.
// Mêmes champs qu avant (name, topic, visibility) et même action serveur.
export function CreateRoomForm() {
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [state, formAction, pending] = useActionState(createRoomAction, initialState);

  return (
    <section id="create-room" aria-labelledby="create-room-title" className="card scroll-mt-24 p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand">
          <PlusIcon />
        </span>
        <div>
          <h2 id="create-room-title" className="font-display text-lg font-semibold text-ink">
            Create a room
          </h2>
          <p className="text-sm text-mute">Open a group conversation.</p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="room-name" className="label">
            Room name
          </label>
          <input
            id="room-name"
            name="name"
            type="text"
            required
            maxLength={60}
            placeholder="e.g. Morning conversation club"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="room-topic" className="label">
            Topic <span className="font-normal text-mute">(optional)</span>
          </label>
          <input
            id="room-topic"
            name="topic"
            type="text"
            maxLength={80}
            placeholder="e.g. Talk about your week"
            className="field"
          />
        </div>

        {/* Publique ou privée ? Deux cartes à choisir */}
        <fieldset>
          <legend className="label">Who can join?</legend>
          <div className="grid grid-cols-2 gap-2">
            {VISIBILITIES.map((option) => {
              const selected = visibility === option.value;
              const Icon = option.icon;
              return (
                <label
                  key={option.value}
                  className={`relative flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                    selected
                      ? "border-brand bg-brand-50"
                      : "border-line-strong bg-surface hover:border-blush-2 hover:bg-blush/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={selected}
                    onChange={() => setVisibility(option.value)}
                    className="sr-only"
                  />
                  <span
                    className={`flex items-center gap-1.5 text-sm font-semibold ${
                      selected ? "text-brand" : "text-ink"
                    }`}
                  >
                    <Icon className="size-4" />
                    {option.label}
                  </span>
                  <span className="text-xs leading-snug text-mute">{option.hint}</span>
                  {selected && (
                    <span aria-hidden className="absolute right-3 top-3 size-2 rounded-full bg-brand" />
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        <p
          aria-live="polite"
          className={state.error ? "well px-3 py-2 text-sm font-medium text-danger" : "sr-only"}
        >
          {state.error}
        </p>

        <button type="submit" disabled={pending} className="btn btn-primary btn-lg w-full">
          {pending ? "Opening the room..." : "Open the room"}
        </button>
      </form>
    </section>
  );
}
