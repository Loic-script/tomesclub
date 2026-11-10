"use client";

import { useActionState, useState, type ReactNode } from "react";
import {
  DEFAULT_DURATION,
  ROOM_ACTIVITIES,
  ROOM_DURATIONS,
  ROOM_LEVELS,
  type RoomActivity,
} from "@/lib/room-activities";
import { createRoomAction, type CreateRoomState } from "./actions";

const VISIBILITIES = [
  { value: "public", label: "Public", hint: "Everyone sees it in the list." },
  { value: "private", label: "Private", hint: "Only people with the link can join." },
] as const;

const initialState: CreateRoomState = { error: null };

const field =
  "neu-inset w-full rounded-xl px-3 py-2 text-white placeholder:text-white/40 outline-none transition focus:ring-2 focus:ring-accent/40";
const labelText = "mb-1.5 block text-sm font-medium text-white/75";

// Le formulaire "Create a room", replié derrière un bouton.
// Étape 1 : choisir l'activité. Étape 2 : thème, options, puis confirmer.
export function CreateRoomForm() {
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState<RoomActivity | null>(null);
  const [state, formAction, pending] = useActionState(createRoomAction, initialState);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="neu neu-btn flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-bold text-white"
      >
        <PlusIcon rotated={open} />
        {open ? "Close" : "Create a room"}
      </button>

      {/* Le formulaire se déplie sous le bouton */}
      {open && (
        <div className="anim-rise mt-4">
          {activity ? (
            <RoomOptions
              key={activity.key}
              activity={activity}
              onChangeActivity={() => setActivity(null)}
              formAction={formAction}
              pending={pending}
              error={state.error}
            />
          ) : (
            <ActivityPicker onPick={setActivity} />
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Étape 1 : l'activité ---------- */

function ActivityPicker({ onPick }: { onPick: (activity: RoomActivity) => void }) {
  return (
    <section className="neu rounded-3xl p-5">
      <StepTitle step={1} title="Choose an activity" hint="What will the group do together?" />
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {ROOM_ACTIVITIES.map((activity) => (
          <li key={activity.key}>
            <button
              type="button"
              onClick={() => onPick(activity)}
              title={activity.description}
              className="flex h-full w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-accent/50"
            >
              <span aria-hidden className="text-2xl leading-none">
                {activity.icon}
              </span>
              <span className="text-sm font-semibold leading-tight text-white">{activity.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Étape 2 : le thème et les options ---------- */

function RoomOptions({
  activity,
  onChangeActivity,
  formAction,
  pending,
  error,
}: {
  activity: RoomActivity;
  onChangeActivity: () => void;
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
}) {
  const [category, setCategory] = useState(activity.categories[0]?.name ?? "");
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState(activity.formats[0] ?? "");
  const [level, setLevel] = useState("all");
  const [duration, setDuration] = useState<number>(DEFAULT_DURATION);
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const topics = activity.categories.find((entry) => entry.name === category)?.topics ?? [];
  const levelName = ROOM_LEVELS.find((entry) => entry.value === level)?.label;

  function surprise() {
    const all = activity.categories.flatMap((entry) =>
      entry.topics.map((suggestion) => ({ category: entry.name, suggestion })),
    );
    const picked = all[Math.floor(Math.random() * all.length)];
    if (!picked) return;
    setCategory(picked.category);
    setTopic(picked.suggestion);
  }

  return (
    <form action={formAction} className="neu space-y-5 rounded-3xl p-5">
      <input type="hidden" name="activity" value={activity.key} />
      <input type="hidden" name="format" value={format} />
      <input type="hidden" name="duration" value={duration} />

      {/* L'activité choisie */}
      <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
        <span aria-hidden className="text-3xl leading-none">
          {activity.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Activity</p>
          <p className="font-display font-bold text-white">{activity.name}</p>
          <p className="mt-0.5 text-xs leading-5 text-white/60">{activity.description}</p>
        </div>
        <button
          type="button"
          onClick={onChangeActivity}
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/15 transition hover:text-white"
        >
          Change
        </button>
      </div>

      <StepTitle step={2} title="Theme and options" hint="Pick a suggested theme or write your own." />

      {/* ----- Le thème ----- */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-white/75">Theme *</span>
          <button
            type="button"
            onClick={surprise}
            className="rounded-full px-3 py-1 text-xs font-semibold text-accent ring-1 ring-accent/40 transition hover:bg-accent/10"
          >
            🎲 Surprise me
          </button>
        </div>

        {/* Les catégories */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {activity.categories.map((entry) => (
            <button
              key={entry.name}
              type="button"
              aria-pressed={entry.name === category}
              onClick={() => setCategory(entry.name)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                entry.name === category
                  ? "bg-accent text-ink"
                  : "text-white/65 ring-1 ring-white/15 hover:text-white"
              }`}
            >
              {entry.name} <span className="opacity-60">{entry.topics.length}</span>
            </button>
          ))}
        </div>

        {/* Les thèmes proposés : un clic remplit le champ */}
        <ul className="neu-inset max-h-48 space-y-1 overflow-y-auto rounded-2xl p-1.5">
          {topics.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => setTopic(suggestion)}
                aria-pressed={topic === suggestion}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  topic === suggestion
                    ? "bg-brand font-semibold text-white"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>

        <input
          name="topic"
          type="text"
          required
          maxLength={160}
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="…or write your own theme"
          aria-label="Theme"
          className={`${field} mt-2`}
        />
      </div>

      {/* ----- La description ----- */}
      <label className="block">
        <span className={labelText}>
          Description <span className="text-white/40">(optional)</span>
        </span>
        <textarea
          name="description"
          rows={3}
          maxLength={400}
          placeholder="What will you do? Any rules or tips for the group?"
          className={`${field} resize-y`}
        />
      </label>

      {/* ----- Le format ----- */}
      <fieldset>
        <legend className={labelText}>Format</legend>
        <div className="flex flex-wrap gap-1.5">
          {activity.formats.map((option) => (
            <ChoiceChip key={option} selected={format === option} onClick={() => setFormat(option)}>
              {option}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>

      {/* ----- Le niveau et la durée ----- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelText}>English level</span>
          <select
            name="level"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className={`${field} [&>option]:text-ink`}
          >
            {ROOM_LEVELS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className={labelText}>Duration</legend>
          <div className="grid grid-cols-6 gap-1 sm:grid-cols-3">
            {ROOM_DURATIONS.map((minutes) => (
              <ChoiceChip
                key={minutes}
                selected={duration === minutes}
                onClick={() => setDuration(minutes)}
                label={`${minutes} minutes`}
              >
                {minutes}′
              </ChoiceChip>
            ))}
          </div>
        </fieldset>
      </div>

      {/* ----- Le nom et la visibilité ----- */}
      <label className="block">
        <span className={labelText}>
          Room name <span className="text-white/40">(optional)</span>
        </span>
        <input name="name" type="text" maxLength={60} placeholder={activity.name} className={field} />
      </label>

      <div>
        <span className={labelText}>Who can see it?</span>
        <div className="flex gap-2">
          {VISIBILITIES.map((option) => (
            <label
              key={option.value}
              className={`flex-1 cursor-pointer rounded-xl px-3 py-2 text-center transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
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

      {/* ----- Le résumé à confirmer ----- */}
      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-accent/30">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Your room</p>
        <p className="mt-1 text-sm font-semibold text-white">
          {activity.icon} {activity.name}
          {topic ? ` — ${topic}` : ""}
        </p>
        <p className="mt-1 text-xs text-white/60">
          {format} · {levelName} · {duration} min · {visibility === "private" ? "Private" : "Public"}
        </p>
        {!topic.trim() && (
          <p className="mt-1 text-xs text-amber-300">Choose or write a theme first.</p>
        )}
      </div>

      <p aria-live="polite" className="min-h-5 text-sm text-amber-300">
        {error}
      </p>
      <button
        type="submit"
        disabled={pending || !topic.trim()}
        className="neu-btn w-full rounded-full bg-brand px-5 py-3 font-bold text-white shadow-md disabled:opacity-60"
      >
        {pending ? "Opening the room..." : "Confirm and open the room"}
      </button>
    </form>
  );
}

/* ---------- Petits morceaux ---------- */

function StepTitle({ step, title, hint }: { step: number; title: string; hint: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-ink">
        {step}
      </span>
      <div>
        <h2 className="font-display text-base font-bold text-white">{title}</h2>
        <p className="text-xs text-white/55">{hint}</p>
      </div>
    </div>
  );
}

function ChoiceChip({
  selected,
  onClick,
  label,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  label?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
        selected
          ? "bg-brand text-white ring-1 ring-accent/60"
          : "text-white/70 ring-1 ring-white/15 hover:text-white"
      }`}
    >
      {children}
    </button>
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
