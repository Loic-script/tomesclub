"use client";

import { useActionState, useState } from "react";
import { createEvent, type CreateEventState } from "./actions";

const initialState: CreateEventState = { error: null };

// Le formulaire admin "publier un événement ou une annonce".
export function CreateEventForm() {
  const [state, formAction, pending] = useActionState(createEvent, initialState);
  const [kind, setKind] = useState<"event" | "announcement">("event");

  const field =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <form action={formAction} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="font-display text-lg font-bold text-navy">Publish something</h2>

      {/* Type : événement daté ou simple annonce */}
      <div className="flex gap-2">
        {(
          [
            { value: "event", label: "Scheduled event" },
            { value: "announcement", label: "Announcement" },
          ] as const
        ).map((option) => (
          <label
            key={option.value}
            className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-semibold transition ${
              kind === option.value
                ? "border-brand bg-brand/5 text-brand"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
            }`}
          >
            <input
              type="radio"
              name="kind"
              value={option.value}
              checked={kind === option.value}
              onChange={() => setKind(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Title *</span>
        <input name="title" type="text" required maxLength={120} className={field} placeholder="e.g. English class: daily conversations" />
      </label>

      {kind === "event" && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Date and time *</span>
          <input name="startsAt" type="datetime-local" className={field} />
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Description</span>
        <textarea name="description" rows={3} maxLength={1000} className={field} placeholder="What should members know?" />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Card image (optional, JPG/PNG/WebP, 3 MB max)
        </span>
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand hover:file:bg-brand/20"
        />
      </label>

      <p aria-live="polite" className="min-h-5 text-sm text-danger">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Publishing..." : "Publish"}
      </button>
    </form>
  );
}
