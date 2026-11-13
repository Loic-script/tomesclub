"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatSize } from "@/lib/file-kinds";
import { CalendarIcon, ImageIcon, MegaphoneIcon } from "../admin-icons";
import { createEvent, type CreateEventState } from "./actions";
import { EventPriceFields } from "./event-price-fields";
import {
  EventSessionFields,
  type EventActivityChoice,
} from "./event-session-fields";

const initialState: CreateEventState = { error: null };

const KINDS = [
  {
    value: "event",
    label: "Scheduled event",
    hint: "A class with a date",
    icon: CalendarIcon,
  },
  {
    value: "announcement",
    label: "Announcement",
    hint: "News for everyone",
    icon: MegaphoneIcon,
  },
] as const;

/** Envoie un fichier de l'événement (même envoi que les fichiers des activités). */
function uploadEventFile(
  eventId: string,
  file: File,
  onProgress: (ratio: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `/api/admin/activity-files?activity=${encodeURIComponent(`event:${eventId}`)}&name=${encodeURIComponent(file.name)}`,
    );
    xhr.setRequestHeader(
      "content-type",
      file.type || "application/octet-stream",
    );
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(String(xhr.status)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

/** Le bouton "New event" : ouvre le formulaire dans une fenêtre. */
export function NewEventButton({
  activities,
}: {
  activities: EventActivityChoice[];
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="neu-btn inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-brand px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/30"
      >
        <span aria-hidden className="text-lg leading-none">
          +
        </span>
        New event
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Publish something"
              className="my-auto w-full max-w-2xl"
            >
              <CreateEventForm
                activities={activities}
                onDone={() => setOpen(false)}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// Le formulaire admin "publier un événement ou une annonce" (dans la fenêtre "New event").
export function CreateEventForm({
  activities,
  onDone,
}: {
  activities: EventActivityChoice[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createEvent,
    initialState,
  );
  const [kind, setKind] = useState<"event" | "announcement">("event");
  const [preview, setPreview] = useState<string | null>(null);
  // Les fichiers du direct (PowerPoint, PDF, vidéo...) : envoyés juste après la création.
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const sentFor = useRef<string | null>(null);

  // L'événement est créé : on envoie les fichiers, puis on ferme la fenêtre.
  useEffect(() => {
    const eventId = state.eventId;
    if (!eventId || sentFor.current === eventId) return;
    sentFor.current = eventId;
    if (files.length === 0) {
      router.refresh();
      onDone();
      return;
    }
    void (async () => {
      setUploading(true);
      let failed = 0;
      for (const file of files) {
        try {
          await uploadEventFile(eventId, file, (ratio) =>
            setProgress((current) => ({ ...current, [file.name]: ratio })),
          );
        } catch {
          failed += 1;
        }
      }
      setUploading(false);
      router.refresh();
      if (failed > 0) {
        setUploadError(
          `The event is published, but ${failed} file(s) could not be sent. Add them again with "Files".`,
        );
        return;
      }
      onDone();
    })();
  }, [state.eventId, files, router, onDone]);

  // Libérer l'aperçu de l'image quand il change.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const field =
    "neu-inset w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:ring-2 focus:ring-accent/60 [color-scheme:dark]";
  const label =
    "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/50";

  return (
    <form
      action={formAction}
      className="neu anim-rise space-y-5 rounded-3xl p-5 sm:p-6"
      style={{ "--d": "100ms" } as React.CSSProperties}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-white">
            Publish something
          </h2>
          <p className="mt-1 text-xs text-white/50">
            All members get a notification.
          </p>
        </div>
        <button
          type="button"
          onClick={onDone}
          aria-label="Close"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Type : événement daté ou simple annonce */}
      <div
        role="radiogroup"
        aria-label="Type"
        className="grid grid-cols-2 gap-2"
      >
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
              <span className="mt-2 block text-sm font-bold">
                {option.label}
              </span>
              <span
                className={`block text-[11px] ${active ? "text-white/80" : "text-white/45"}`}
              >
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
          <input
            name="startsAt"
            type="datetime-local"
            required
            className={field}
          />
        </label>
      )}

      {kind === "event" && (
        <EventPriceFields fieldClass={field} labelClass={label} />
      )}

      {/* Le direct vidéo : activité, thème, durée, places */}
      {kind === "event" && (
        <EventSessionFields
          activities={activities}
          fieldClass={field}
          labelClass={label}
        />
      )}

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
            <img
              src={preview}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <span className="flex flex-col items-center gap-2 text-center text-white/45">
              <ImageIcon className="size-7" />
              <span className="text-xs font-semibold">
                Click to add a picture
              </span>
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

      {/* Les fichiers à montrer pendant le direct */}
      {kind === "event" && (
        <div>
          <span className={label}>Files for the live (optional)</span>
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            onChange={(event) => {
              const chosen = Array.from(event.target.files ?? []);
              setFiles((current) => [
                ...current,
                ...chosen.filter(
                  (file) => !current.some((item) => item.name === file.name),
                ),
              ]);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="neu-inset flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm font-semibold text-white/60 transition hover:border-accent/60 hover:text-white"
          >
            <span aria-hidden className="text-lg leading-none">
              +
            </span>
            Add files (PowerPoint, PDF, Word, pictures, videos...)
          </button>
          {files.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {files.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-xs text-white/80"
                >
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="shrink-0 text-white/40">
                    {formatSize(file.size)}
                  </span>
                  {uploading ? (
                    <span className="w-10 shrink-0 text-right tabular-nums text-accent">
                      {Math.round((progress[file.name] ?? 0) * 100)}%
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((item) => item !== file),
                        )
                      }
                      aria-label={`Remove ${file.name}`}
                      className="shrink-0 rounded-full px-1.5 text-white/40 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {uploadError && (
        <p className="rounded-2xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100 ring-1 ring-amber-300/30">
          {uploadError}
        </p>
      )}

      {state.error && (
        <p
          aria-live="polite"
          className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-medium text-red-200"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="neu-btn w-full rounded-full bg-gradient-to-r from-accent to-brand px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/30 disabled:opacity-60"
      >
        {uploading
          ? "Sending the files..."
          : pending
            ? "Publishing..."
            : kind === "event"
              ? "Publish the event"
              : "Publish the announcement"}
      </button>
    </form>
  );
}
