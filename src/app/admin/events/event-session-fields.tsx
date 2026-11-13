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
  const [activity, setActivity] = useState(defaultActivity ?? "");
  const listId = useId();
  const topics = activities.find((entry) => entry.key === activity)?.topics ?? [];

  return (
    <div className="anim-dropdown grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className={labelClass}>Activity</span>
        <select
          name="activity"
          value={activity}
          onChange={(event) => setActivity(event.target.value)}
          className={fieldClass}
        >
          <option value="" className="bg-[#22102f]">
            No activity
          </option>
          {activities.map((entry) => (
            <option key={entry.key} value={entry.key} className="bg-[#22102f]">
              {entry.name}
            </option>
          ))}
        </select>
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
