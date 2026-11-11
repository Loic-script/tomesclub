"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { CalendarIcon, CheckIcon, ImageIcon, MegaphoneIcon } from "../admin-icons";
import { endEventAction, startEventAction, updateEvent, type UpdateEventState } from "./actions";
import { DeleteEventButton } from "./delete-event-button";

export type AdminEventView = {
  id: string;
  kind: "event" | "announcement";
  title: string;
  description: string | null;
  /** Pour le champ "date et heure" (AAAA-MM-JJTHH:MM). */
  startsAtInput: string;
  dayLabel: string | null;
  monthLabel: string | null;
  whenLabel: string;
  hasImage: boolean;
  going: number;
  interested: number;
  past: boolean;
  live: boolean;
};

// Une ligne de la liste admin : l'événement, ses boutons, et son formulaire de modification.
export function AdminEventItem({ event }: { event: AdminEventView }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [confirmEnd, setConfirmEnd] = useState(false);

  return (
    <li
      className={`neu-inset overflow-hidden rounded-2xl transition ${
        event.live ? "ring-2 ring-red-400/60" : event.past && !editing ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-4 p-3">
        <EventThumb event={event} />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            {event.live ? (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white">
                <span className="relative flex size-1.5">
                  <span className="anim-ping absolute inset-0 rounded-full bg-white" />
                  <span className="relative size-1.5 rounded-full bg-white" />
                </span>
                LIVE
              </span>
            ) : event.kind === "event" ? (
              <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent">Event</span>
            ) : (
              <span className="rounded-full bg-[#6d72ff]/20 px-2.5 py-1 text-[11px] font-semibold text-[#b9bcff]">
                Announcement
              </span>
            )}
            {event.past && !event.live && (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/60">Past</span>
            )}
          </span>
          <span className="mt-1 block truncate text-sm font-semibold text-white">{event.title}</span>
          <span className="block truncate text-[11px] text-white/45">{event.whenLabel}</span>
          {event.kind === "event" && (
            <span className="mt-1.5 flex gap-3 text-[11px]">
              <span className="font-semibold text-emerald-300">{event.going} going</span>
              <span className="text-white/50">{event.interested} interested</span>
            </span>
          )}
        </span>

        <span className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          {/* Le direct : Start, ou Join + End */}
          {event.kind === "event" &&
            (event.live ? (
              <>
                <Link
                  href={`/live/${event.id}`}
                  className="neu-btn rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-900/40"
                >
                  Join live
                </Link>
                {confirmEnd ? (
                  <span className="anim-dropdown flex items-center gap-1">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await endEventAction(event.id);
                          setConfirmEnd(false);
                        })
                      }
                      className="rounded-full bg-white px-3 py-2 text-xs font-bold text-navy disabled:opacity-60"
                    >
                      {pending ? "..." : "End for all"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmEnd(false)}
                      className="rounded-full px-2 py-2 text-xs font-semibold text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmEnd(true)}
                    className="neu-sm neu-btn rounded-full px-4 py-2 text-xs font-bold text-white/80 hover:text-white"
                  >
                    End
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => startEventAction(event.id))}
                title="Start the live video and tell all members"
                className="neu-btn flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-brand px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand/30 disabled:opacity-60"
              >
                <span aria-hidden>▶</span>
                {pending ? "Starting..." : "Start"}
              </button>
            ))}

          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              aria-expanded={editing}
              aria-label={editing ? "Close the editor" : `Edit ${event.title}`}
              title="Edit"
              className={`neu-sm neu-btn flex size-9 items-center justify-center rounded-full ${
                editing ? "text-accent" : "text-white/60 hover:text-white"
              }`}
            >
              <PencilIcon />
            </button>
            <DeleteEventButton eventId={event.id} />
          </span>
        </span>
      </div>

      {editing && <EditEventForm event={event} onDone={() => setEditing(false)} />}
    </li>
  );
}

/** La vignette : l'image, sinon la date, sinon le mégaphone. */
function EventThumb({ event }: { event: AdminEventView }) {
  return (
    <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-accent to-brand">
      {event.hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- image privée servie par notre API
        <img src={`/api/event/image/${event.id}`} alt="" className="size-full object-cover" />
      ) : event.dayLabel ? (
        <span className="flex size-full flex-col items-center justify-center text-white">
          <span className="font-display text-xl font-extrabold leading-none">{event.dayLabel}</span>
          <span className="text-[10px] font-bold uppercase">{event.monthLabel}</span>
        </span>
      ) : (
        <span className="flex size-full items-center justify-center bg-gradient-to-br from-[#6d72ff] to-navy text-white">
          <MegaphoneIcon className="size-6" />
        </span>
      )}
    </span>
  );
}

const initialState: UpdateEventState = { error: null, saved: false };

/** Le formulaire de modification, déplié sous la ligne. */
function EditEventForm({ event, onDone }: { event: AdminEventView; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(updateEvent.bind(null, event.id), initialState);
  const [kind, setKind] = useState(event.kind);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  // Enregistré : on referme.
  useEffect(() => {
    if (state.saved) onDone();
  }, [state.saved, onDone]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const field =
    "w-full rounded-xl bg-black/25 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-accent/60 [color-scheme:dark]";
  const label = "mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/45";
  const showImage = preview ?? (event.hasImage && !removeImage ? `/api/event/image/${event.id}` : null);

  return (
    <form action={formAction} className="anim-dropdown space-y-4 border-t border-white/10 p-4">
      <div role="radiogroup" aria-label="Type" className="flex gap-2">
        {(
          [
            { value: "event", label: "Event", icon: CalendarIcon },
            { value: "announcement", label: "Announcement", icon: MegaphoneIcon },
          ] as const
        ).map((option) => {
          const active = kind === option.value;
          const Icon = option.icon;
          return (
            <label
              key={option.value}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition focus-within:ring-2 focus-within:ring-accent/60 ${
                active ? "bg-gradient-to-r from-accent to-brand text-white" : "bg-white/[0.06] text-white/60 hover:text-white"
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
              <Icon className="size-4" />
              {option.label}
            </label>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={label}>Title</span>
          <input name="title" required maxLength={120} defaultValue={event.title} className={field} />
        </label>
        {kind === "event" && (
          <label className="block sm:col-span-2">
            <span className={label}>Date and time</span>
            <input
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={event.startsAtInput}
              className={field}
            />
          </label>
        )}
        <label className="block sm:col-span-2">
          <span className={label}>Description</span>
          <textarea
            name="description"
            rows={3}
            maxLength={1000}
            defaultValue={event.description ?? ""}
            className={`${field} resize-none`}
          />
        </label>
      </div>

      {/* L'image : garder, changer ou enlever */}
      <div className="flex items-center gap-3">
        <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black/25 text-white/40 ring-1 ring-white/10">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu de l'image
            <img src={showImage} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-6" />
          )}
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/15">
            {showImage ? "Change image" : "Add image"}
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(change) => {
                const file = change.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
                if (file) setRemoveImage(false);
              }}
            />
          </label>
          {event.hasImage && !preview && (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-white/55">
              <input
                type="checkbox"
                name="removeImage"
                checked={removeImage}
                onChange={(change) => setRemoveImage(change.target.checked)}
                className="accent-[#f7944a]"
              />
              Remove image
            </label>
          )}
        </span>
      </div>

      {state.error && (
        <p aria-live="polite" className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-full px-4 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="neu-btn flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-brand px-5 py-2 text-xs font-bold text-white shadow-lg shadow-brand/30 disabled:opacity-60"
        >
          <CheckIcon className="size-3.5" />
          {pending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function PencilIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}
