"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarIcon, ImageIcon, MegaphoneIcon } from "../admin-icons";
import { createEvent, type CreateEventState } from "./actions";
import { EventPriceFields } from "./event-price-fields";

const initialState: CreateEventState = { error: null };

const KINDS = [
  { value: "event", label: "Scheduled event", hint: "A class with a date", icon: CalendarIcon },
  { value: "announcement", label: "Announcement", hint: "News for everyone", icon: MegaphoneIcon },
] as const;

// Le formulaire admin "publier un événement ou une annonce".
export function CreateEventForm() {
  const [state, formAction, pending] = useActionState(createEvent, initialState);
  const [kind, setKind] = useState<"event" | "announcement">("event");
  const [preview, setPreview] = useState<string | null>(null);

  // Libérer l'aperçu de l'image quand il change.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const field =
    "neu-inset w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:ring-2 focus:ring-accent/60 [color-scheme:dark]";
  const label = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/50";

  return (
    <form
      action={formAction}
      className="neu anim-rise space-y-5 rounded-3xl p-5 sm:p-6"
      style={{ "--d": "100ms" } as React.CSSProperties}
    >
      <div>
        <h2 className="font-display text-lg font-bold text-white">Publish something</h2>
        <p className="mt-1 text-xs text-white/50">All members get a notification.</p>
      </div>

      {/* Type : événement daté ou simple annonce */}
      <div role="radiogroup" aria-label="Type" className="grid grid-cols-2 gap-2">
        {KINDS.map((option) => {
          const active = kind === option.value;
          const Icon = option.icon;
          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-2xl p-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-accent/60 ${
                active
                  ? "bg-gradient-to-br from-accent/90 to-brand text-white shadow-lg shadow-brand/30"
                  : "neu-sm text-white/65 hover:text-white"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={option.value}
                checked={active}
                onChange={() => setKind(option.value)}
                className="sr-only"
              />
              <Icon className="size-5" />
              <span className="mt-2 block text-sm font-bold">{option.label}</span>
              <span className={`block text-[11px] ${active ? "text-white/80" : "text-white/45"}`}>
                {option.hint}
              </span>
            </label>
          );
        })}
      </div>

      <label className="block">
        <span className={label}>Title *</span>
        <input
          name="title"
          type="text"
          required
          maxLength={120}
          className={field}
          placeholder="e.g. English class: daily conversations"
        />
      </label>

      {kind === "event" && (
        <label className="anim-dropdown block">
          <span className={label}>Date and time *</span>
          <input name="startsAt" type="datetime-local" required className={field} />
        </label>
      )}

      {kind === "event" && <EventPriceFields fieldClass={field} labelClass={label} />}

      <label className="block">
        <span className={label}>Description</span>
        <textarea
          name="description"
          rows={3}
          maxLength={1000}
          className={`${field} resize-none`}
          placeholder="What should members know?"
        />
      </label>

      {/* L'image de la carte, avec aperçu */}
      <label className="group block cursor-pointer">
        <span className={label}>Card image (optional)</span>
        <span className="neu-inset relative flex h-36 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 transition group-hover:border-accent/60">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu local du fichier choisi
            <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-center text-white/45">
              <ImageIcon className="size-7" />
              <span className="text-xs font-semibold">Click to add a picture</span>
              <span className="text-[10px]">JPG, PNG or WebP · 3 MB max</span>
            </span>
          )}
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
        </span>
      </label>

      {state.error && (
        <p aria-live="polite" className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-medium text-red-200">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="neu-btn w-full rounded-full bg-gradient-to-r from-accent to-brand px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/30 disabled:opacity-60"
      >
        {pending ? "Publishing..." : kind === "event" ? "Publish the event" : "Publish the announcement"}
      </button>
    </form>
  );
}
