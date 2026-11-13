"use client";

import Link from "next/link";
import { MemberAvatar } from "@/components/member-avatar";
import { MvolaLogo } from "@/components/payment-dialog";
import { PaymentCheckDialog } from "../payment-check-dialog";
import { formatEventPrice } from "@/lib/event-price";
import { useActionState, useEffect, useState, useTransition } from "react";
import {
  CalendarIcon,
  CheckIcon,
  ImageIcon,
  MegaphoneIcon,
} from "../admin-icons";
import {
  endEventAction,
  setPaidAction,
  startEventAction,
  updateEvent,
  type UpdateEventState,
} from "./actions";
import { DeleteEventButton } from "./delete-event-button";
import { EventPriceFields } from "./event-price-fields";
import {
  EventSessionFields,
  type EventActivityChoice,
} from "./event-session-fields";
import { ActivityFilesDialog } from "../rooms/activity-files-dialog";
import { ActivityIcon } from "@/components/activity-icon";
import type { ActivityFileView } from "@/lib/file-kinds";

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
  isPaid: boolean;
  price: number | null;
  currency: string | null;
  /** Les membres inscrits (du premier au dernier). */
  registered: {
    id: string;
    name: string;
    hasPhoto: boolean;
    paid: boolean;
    paymentRef?: string | null;
    paymentProofId?: string | null;
  }[];
  past: boolean;
  live: boolean;
  /** Organisé par un Leader / Teacher (null = l'admin) */
  hostName: string | null;
  /** Événement payant d'un Leader / Teacher : 40 % admin, 60 % organisateur (paiements confirmés) */
  revenue: { collected: string; admin: string; host: string } | null;
  /** Le direct vidéo */
  activity: string | null;
  activityName: string | null;
  activityIcon: string | null;
  topic: string | null;
  durationMin: number | null;
  maxParticipants: number | null;
  /** Les fichiers à montrer pendant le direct */
  files: ActivityFileView[];
};

// Une ligne de la liste admin : l'événement, ses boutons, et son formulaire de modification.
export function AdminEventItem({
  event,
  activities,
  storageReady,
}: {
  event: AdminEventView;
  activities: EventActivityChoice[];
  storageReady: boolean;
}) {
  const [showFiles, setShowFiles] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const paidCount = event.registered.filter((person) => person.paid).length;

  return (
    <li
      className={`neu-inset overflow-hidden rounded-2xl transition ${
        event.live
          ? "ring-2 ring-red-400/60"
          : event.past && !editing
            ? "opacity-60"
            : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-3">
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
              <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent">
                Event
              </span>
            ) : (
              <span className="rounded-full bg-[#6d72ff]/20 px-2.5 py-1 text-[11px] font-semibold text-[#b9bcff]">
                Announcement
              </span>
            )}
            {event.past && !event.live && (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/60">
                Past
              </span>
            )}
          </span>
          <span className="mt-1 block truncate text-sm font-semibold text-white">
            {event.title}
          </span>
          <span className="block truncate text-[11px] text-white/45">
            {event.whenLabel}
          </span>
          {event.kind === "event" && (
            <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
              <span
                className={`rounded-full px-2 py-0.5 font-bold ${
                  event.isPaid
                    ? "bg-accent/20 text-accent"
                    : "bg-emerald-400/15 text-emerald-300"
                }`}
              >
                {formatEventPrice(event)}
              </span>
              {event.hostName && (
                <span className="rounded-full bg-[#6d72ff]/20 px-2 py-0.5 font-semibold text-[#c4c6ff]">
                  by {event.hostName}
                </span>
              )}
              {/* Le direct : activité, durée, places */}
              {event.activityName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 font-semibold text-white/75">
                  <ActivityIcon
                    icon={event.activityIcon}
                    className="size-3.5 text-accent"
                  />
                  {event.activityName}
                </span>
              )}
              {event.durationMin && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold text-white/75">
                  {event.durationMin} min
                </span>
              )}
              {event.maxParticipants && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold text-white/75">
                  {event.maxParticipants} places
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowPeople((value) => !value)}
                disabled={event.registered.length === 0}
                aria-expanded={showPeople}
                className="flex items-center gap-1.5 rounded-full font-semibold text-white/75 transition hover:text-white disabled:cursor-default disabled:text-white/45"
              >
                {event.registered.length > 0 && (
                  <span className="flex -space-x-1.5">
                    {event.registered.slice(0, 4).map((person) => (
                      <span
                        key={person.id}
                        className="rounded-full ring-2 ring-[#2a1238]"
                      >
                        <MemberAvatar
                          userId={person.id}
                          name={person.name}
                          hasPhoto={person.hasPhoto}
                          size="size-5"
                        />
                      </span>
                    ))}
                  </span>
                )}
                {event.registered.length} registered
                {event.isPaid && event.registered.length > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      paidCount === event.registered.length
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-amber-400/15 text-amber-300"
                    }`}
                  >
                    {paidCount}/{event.registered.length} paid
                  </span>
                )}
                {event.registered.length > 0 && (
                  <span
                    aria-hidden
                    className={`transition-transform ${showPeople ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                )}
              </button>
            </span>
          )}
        </span>

        <span className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
          {/* Le direct : Start, ou Join + End */}
          {event.kind === "event" &&
            (event.live ? (
              <>
                <Link
                  href={`/live/${event.id}?as=admin`}
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
                onClick={() =>
                  startTransition(() => startEventAction(event.id))
                }
                title="Start the live video and tell all members"
                className="neu-btn flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-brand px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand/30 disabled:opacity-60"
              >
                <span aria-hidden>▶</span>
                {pending ? "Starting..." : "Start"}
              </button>
            ))}

          <span className="flex items-center gap-2">
            {event.kind === "event" && (
              <button
                type="button"
                onClick={() => setShowFiles(true)}
                title="Files for the live"
                className="neu-sm neu-btn flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-white/70 hover:text-white"
              >
                Files
                <span className="rounded-full bg-white/10 px-1.5 tabular-nums">
                  {event.files.length}
                </span>
              </button>
            )}
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

      {/* Les gains d'un événement payant d'un Leader / Teacher : 40 % admin, 60 % organisateur */}
      {event.revenue && (
        <div className="grid grid-cols-3 gap-2 border-t border-white/10 px-3 py-3 text-center">
          <div className="rounded-xl bg-white/5 px-2 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
              Collected
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-white">
              {event.revenue.collected}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-500/15 px-2 py-2 ring-1 ring-emerald-400/30">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/70">
              You (40%)
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-200">
              {event.revenue.admin}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 px-2 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
              Host (60%)
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-white">
              {event.revenue.host}
            </p>
          </div>
        </div>
      )}

      {/* La liste des inscrits */}
      {showPeople && event.registered.length > 0 && (
        <ul className="anim-dropdown divide-y divide-white/[0.06] border-t border-white/10 px-3 py-1.5">
          {event.registered.map((person, index) => (
            <RegisteredRow
              key={person.id}
              event={event}
              person={person}
              index={index}
            />
          ))}
        </ul>
      )}

      {editing && (
        <EditEventForm
          event={event}
          activities={activities}
          onDone={() => setEditing(false)}
        />
      )}
      {showFiles && (
        <ActivityFilesDialog
          activity={{
            key: `event:${event.id}`,
            name: event.title,
            icon: event.activityIcon ?? "📅",
          }}
          files={event.files}
          storageReady={storageReady}
          onClose={() => setShowFiles(false)}
        />
      )}
    </li>
  );
}

/**
 * Un inscrit : son nom, sa preuve de paiement (référence MVola) et son statut.
 * Événement payant : "Check" ouvre la fenêtre "Payment check" pour confirmer le paiement.
 */
function RegisteredRow({
  event,
  person,
  index,
}: {
  event: AdminEventView;
  person: AdminEventView["registered"][number];
  index: number;
}) {
  const [pending, startTransition] = useTransition();
  const [paid, setPaid] = useState(person.paid);
  const [checking, setChecking] = useState(false);
  const hasProof = Boolean(person.paymentRef || person.paymentProofId);

  function setPayment(next: boolean) {
    setPaid(next);
    setChecking(false);
    startTransition(() => setPaidAction(event.id, person.id, next));
  }

  return (
    <li className="flex items-center gap-3 py-2">
      <span className="w-5 shrink-0 text-right text-[11px] tabular-nums text-white/35">
        {index + 1}
      </span>
      <Link
        href={`/admin/members/${person.id}`}
        className="group flex min-w-0 flex-1 items-center gap-2.5"
      >
        <MemberAvatar
          userId={person.id}
          name={person.name}
          hasPhoto={person.hasPhoto}
          size="size-8"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white/90 group-hover:text-white">
            {person.name}
          </span>
          {event.isPaid && (
            <span className="flex items-center gap-1.5 truncate text-[11px] text-white/45">
              {hasProof ? (
                <>
                  <MvolaLogo size={13} />
                  {person.paymentRef
                    ? `ref ${person.paymentRef}`
                    : "screenshot"}
                  {person.paymentRef && person.paymentProofId
                    ? " + screenshot"
                    : ""}
                </>
              ) : (
                "No payment proof"
              )}
            </span>
          )}
        </span>
      </Link>

      {event.isPaid && (
        <>
          <span
            className={`hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex ${
              paid
                ? "bg-emerald-400/15 text-emerald-300"
                : "bg-amber-400/15 text-amber-300"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${paid ? "bg-emerald-300" : "bg-amber-300"}`}
            />
            {paid ? "Paid" : "Not paid"}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => setChecking(true)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition disabled:opacity-60 ${
              paid
                ? "bg-white/10 text-white/80 hover:bg-white/15"
                : "bg-gradient-to-r from-accent to-brand text-white shadow-lg shadow-brand/25 hover:brightness-110"
            }`}
          >
            {paid ? "View" : "Check"}
          </button>
        </>
      )}

      {checking && (
        <PaymentCheckDialog
          onClose={() => setChecking(false)}
          check={{
            memberId: person.id,
            memberName: person.name,
            hasPhoto: person.hasPhoto,
            context: `Event · ${event.title}`,
            amountLabel: formatEventPrice(event),
            reference: person.paymentRef ?? null,
            proofId: person.paymentProofId ?? null,
            confirmed: paid,
          }}
          actions={
            paid ? (
              <>
                <button
                  type="button"
                  onClick={() => setPayment(false)}
                  className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white/70 ring-1 ring-white/15 hover:bg-white/10 hover:text-white"
                >
                  Mark as not paid
                </button>
                <button
                  type="button"
                  onClick={() => setChecking(false)}
                  className="flex-1 rounded-full bg-white/10 py-2.5 text-sm font-bold hover:bg-white/15"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setChecking(false)}
                  className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white/70 ring-1 ring-white/15 hover:bg-white/10 hover:text-white"
                >
                  Not yet
                </button>
                <button
                  type="button"
                  onClick={() => setPayment(true)}
                  className="flex-[1.4] rounded-full bg-emerald-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-400"
                >
                  Confirm payment
                </button>
              </>
            )
          }
        />
      )}
    </li>
  );
}

/** La vignette : l'image, sinon la date, sinon le mégaphone. */
function EventThumb({ event }: { event: AdminEventView }) {
  return (
    <span className="relative size-14 shrink-0 overflow-hidden rounded-xl sm:size-16 bg-gradient-to-br from-accent to-brand">
      {event.hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- image privée servie par notre API
        <img
          src={`/api/event/image/${event.id}`}
          alt=""
          className="size-full object-cover"
        />
      ) : event.dayLabel ? (
        <span className="flex size-full flex-col items-center justify-center text-white">
          <span className="font-display text-xl font-extrabold leading-none">
            {event.dayLabel}
          </span>
          <span className="text-[10px] font-bold uppercase">
            {event.monthLabel}
          </span>
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
function EditEventForm({
  event,
  activities,
  onDone,
}: {
  event: AdminEventView;
  activities: EventActivityChoice[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateEvent.bind(null, event.id),
    initialState,
  );
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
  const label =
    "mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/45";
  const showImage =
    preview ??
    (event.hasImage && !removeImage ? `/api/event/image/${event.id}` : null);

  return (
    <form
      action={formAction}
      className="anim-dropdown space-y-4 border-t border-white/10 p-4"
    >
      <div role="radiogroup" aria-label="Type" className="flex gap-2">
        {(
          [
            { value: "event", label: "Event", icon: CalendarIcon },
            {
              value: "announcement",
              label: "Announcement",
              icon: MegaphoneIcon,
            },
          ] as const
        ).map((option) => {
          const active = kind === option.value;
          const Icon = option.icon;
          return (
            <label
              key={option.value}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition focus-within:ring-2 focus-within:ring-accent/60 ${
                active
                  ? "bg-gradient-to-r from-accent to-brand text-white"
                  : "bg-white/[0.06] text-white/60 hover:text-white"
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
          <input
            name="title"
            required
            maxLength={120}
            defaultValue={event.title}
            className={field}
          />
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
        {kind === "event" && (
          <div className="sm:col-span-2">
            <EventPriceFields
              defaultPaid={event.isPaid}
              defaultPrice={event.price}
              defaultCurrency={event.currency}
              fieldClass={field}
              labelClass={label}
            />
          </div>
        )}
        {kind === "event" && (
          <div className="sm:col-span-2">
            <EventSessionFields
              activities={activities}
              defaultActivity={event.activity}
              defaultTopic={event.topic}
              defaultDuration={event.durationMin}
              defaultPeople={event.maxParticipants}
              fieldClass={field}
              labelClass={label}
            />
          </div>
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
        <p
          aria-live="polite"
          className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200"
        >
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
