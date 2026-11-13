"use client";

import { useId, useState } from "react";
import { EVENT_MAX_DURATION, EVENT_MAX_PEOPLE, EVENT_MIN_PEOPLE } from "@/lib/event-price";

// Le direct vidéo d'un événement : l'activité, le thème, la durée et le nombre de places.
// Utilisé par le formulaire "Publish" et par le formulaire "Edit" d'un événement.

export type EventActivityChoice = { key: string; name: string; topics: string[] };

export function EventSessionFields({
  activities,
  defaultActivity = "",
  defaultTopic = "",
  defaultDuration = null,
  defaultPeople = null,
  fieldClass,
  labelClass,
}: {
  activities: EventActivityChoice[];
  defaultActivity?: string | null;
  defaultTopic?: string | null;
  defaultDuration?: number | null;
  defaultPeople?: number | null;
  fieldClass: string;
  labelClass: string;
}) {
  // On affiche le nom (une activité du catalogue, ou celle écrite par l'admin).
  const [activity, setActivity] = useState(
    activities.find((entry) => entry.key === defaultActivity)?.name ?? defaultActivity ?? "",
  );
  const listId = useId();
  const activityListId = useId();
  const chosen = activities.find((entry) => entry.name.toLowerCase() === activity.trim().toLowerCase());
  const topics = chosen?.topics ?? [];

  return (
    <div className="anim-dropdown grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className={labelClass}>Activity</span>
        {/* Une activité de la liste, ou sa propre activité (on l'écrit) */}
        <span className="relative block">
          <input
            name="activity"
            value={activity}
            onChange={(event) => setActivity(event.target.value)}
            list={activityListId}
            maxLength={60}
            placeholder="Choose or write an activity"
            autoComplete="off"
            className={`${fieldClass} pr-11`}
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-white/50"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          <datalist id={activityListId}>
            {activities.map((entry) => (
              <option key={entry.key} value={entry.name} />
            ))}
          </datalist>
        </span>
        <span className="mt-1 block text-[11px] text-white/40">
          {activity.trim() && !chosen ? "Your own activity" : "From the list, or write your own"}
        </span>
      </label>

      <label className="block">
        <span className={labelClass}>Theme</span>
        <input
          name="topic"
          maxLength={160}
          defaultValue={defaultTopic ?? ""}
          list={topics.length > 0 ? listId : undefined}
          placeholder={topics[0] ? `e.g. ${topics[0]}` : "What will you talk about?"}
          className={fieldClass}
        />
        {topics.length > 0 && (
          <datalist id={listId}>
            {topics.map((topic) => (
              <option key={topic} value={topic} />
            ))}
          </datalist>
        )}
      </label>

      <label className="block">
        <span className={labelClass}>Duration (minutes)</span>
        <input
          name="durationMin"
          type="number"
          inputMode="numeric"
          min={1}
          max={EVENT_MAX_DURATION}
          step={1}
          defaultValue={defaultDuration ?? 60}
          className={fieldClass}
        />
        <span className="mt-1 block text-[11px] text-white/40">Up to {EVENT_MAX_DURATION} minutes</span>
      </label>

      <label className="block">
        <span className={labelClass}>Maximum people</span>
        <input
          name="maxParticipants"
          type="number"
          inputMode="numeric"
          min={EVENT_MIN_PEOPLE}
          max={EVENT_MAX_PEOPLE}
          step={1}
          defaultValue={defaultPeople ?? 30}
          className={fieldClass}
        />
        <span className="mt-1 block text-[11px] text-white/40">Up to {EVENT_MAX_PEOPLE} people</span>
      </label>
    </div>
  );
}
