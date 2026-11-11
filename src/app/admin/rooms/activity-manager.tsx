"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { RoomActivity } from "@/lib/room-activities";
import { CheckIcon, TrashIcon } from "../admin-icons";
import {
  addActivityAction,
  deleteActivityAction,
  updateActivityAction,
  type ActivityFormState,
} from "./actions";

export type ManagedActivity = RoomActivity & { custom: boolean };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "builtin", label: "Built-in" },
  { key: "custom", label: "Yours" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

// Les activités des rooms : les 13 du catalogue + celles de l'admin (ajouter, modifier, supprimer).
export function ActivityManager({ activities }: { activities: ManagedActivity[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  // null = pas de formulaire ; "new" = nouvelle activité ; sinon la clé de l'activité modifiée.
  const [form, setForm] = useState<string | null>(null);
  const formTop = useRef<HTMLDivElement>(null);

  const shown = activities.filter((activity) =>
    filter === "all" ? true : filter === "custom" ? activity.custom : !activity.custom,
  );
  const editing = form && form !== "new" ? activities.find((activity) => activity.key === form) : undefined;

  function openForm(value: string) {
    setForm(value);
    requestAnimationFrame(() => formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filter activities" className="flex gap-2">
          {FILTERS.map((option) => {
            const count = activities.filter((activity) =>
              option.key === "all" ? true : option.key === "custom" ? activity.custom : !activity.custom,
            ).length;
            const active = filter === option.key;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option.key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-white text-navy shadow-lg"
                    : "neu-sm text-white/65 hover:text-white"
                }`}
              >
                {option.label}
                <span className={active ? "text-navy/60" : "text-white/40"}>{count}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => openForm("new")}
          className="neu-btn ml-auto flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-brand px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand/30"
        >
          <span aria-hidden className="text-base leading-none">+</span>
          Add an activity
        </button>
      </div>

      <div ref={formTop} className="scroll-mt-6">
        {form && (
          <ActivityForm
            key={form}
            activity={editing}
            onDone={() => setForm(null)}
          />
        )}
      </div>

      {shown.length === 0 ? (
        <p className="neu-inset rounded-2xl px-4 py-8 text-center text-sm text-white/50">
          No activity of your own yet. Click “Add an activity” to create one.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((activity) => (
            <li key={activity.key}>
              <ActivityCard activity={activity} onEdit={() => openForm(activity.key)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Une carte d'activité ---------- */

function ActivityCard({ activity, onEdit }: { activity: ManagedActivity; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();
  const themes = activity.categories.reduce((sum, category) => sum + category.topics.length, 0);

  return (
    <article className="neu-sm group flex h-full flex-col rounded-3xl p-4 transition hover:ring-1 hover:ring-accent/40">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white/15 to-white/5 text-2xl ring-1 ring-white/10">
          {activity.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-[15px] font-bold text-white">{activity.name}</h3>
          </div>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              activity.custom ? "bg-accent/20 text-accent" : "bg-white/10 text-white/50"
            }`}
          >
            {activity.custom ? "Yours" : "Built-in"}
          </span>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/55">{activity.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
        <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-white/70">{themes} themes</span>
        <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-white/70">
          {activity.formats.length} {activity.formats.length === 1 ? "format" : "formats"}
        </span>
      </div>

      {open && (
        <div className="anim-dropdown mt-3 max-h-64 space-y-3 overflow-y-auto rounded-2xl bg-black/20 p-3">
          <p className="text-[11px] text-white/60">
            <span className="font-bold text-white/80">Formats: </span>
            {activity.formats.join(" · ")}
          </p>
          {activity.categories.map((category) => (
            <div key={category.name}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-accent">{category.name}</p>
              <ul className="flex flex-wrap gap-1">
                {category.topics.map((topic) => (
                  <li key={topic} className="rounded-lg bg-white/[0.07] px-2 py-1 text-[11px] text-white/75">
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-4">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          {open ? "Hide themes" : "See themes"}
        </button>
        {activity.custom && (
          <span className="ml-auto flex items-center gap-1.5">
            {armed ? (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => deleteActivityAction(activity.key))}
                  className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                >
                  {pending ? "..." : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setArmed(false)}
                  className="rounded-full px-2 py-1.5 text-xs text-white/60 hover:text-white"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setArmed(true)}
                  aria-label={`Delete ${activity.name}`}
                  className="flex size-8 items-center justify-center rounded-full text-white/50 transition hover:bg-red-500/15 hover:text-red-300"
                >
                  <TrashIcon />
                </button>
              </>
            )}
          </span>
        )}
      </div>
    </article>
  );
}

/* ---------- Le formulaire : ajouter ou modifier ---------- */

const QUICK_ICONS = ["✨", "📚", "🎬", "🎵", "🍳", "✈️", "🧠", "🎨", "⚽", "🌍", "💡", "🗺️"];

type CategoryDraft = { id: number; name: string; topics: string };

const initialState: ActivityFormState = { error: null, saved: false };

function ActivityForm({ activity, onDone }: { activity?: ManagedActivity; onDone: () => void }) {
  const action = activity ? updateActivityAction.bind(null, activity.key) : addActivityAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [icon, setIcon] = useState(activity?.icon ?? "✨");
  const [name, setName] = useState(activity?.name ?? "");
  const [categories, setCategories] = useState<CategoryDraft[]>(
    activity
      ? activity.categories.map((category, index) => ({
          id: index,
          name: category.name,
          topics: category.topics.join("\n"),
        }))
      : [{ id: 0, name: "", topics: "" }],
  );
  const nextId = useRef(categories.length);

  useEffect(() => {
    if (state.saved) onDone();
  }, [state.saved, onDone]);

  const themeCount = categories.reduce(
    (sum, category) => sum + category.topics.split("\n").filter((line) => line.trim()).length,
    0,
  );

  const field =
    "w-full rounded-xl bg-black/25 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-accent/60";
  const label = "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/45";

  function updateCategory(id: number, patch: Partial<CategoryDraft>) {
    setCategories((list) => list.map((category) => (category.id === id ? { ...category, ...patch } : category)));
  }

  return (
    <form action={formAction} className="neu anim-dropdown rounded-3xl p-5 ring-1 ring-accent/30 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        {/* L'aperçu de la tuile, comme dans le formulaire des membres */}
        <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-brand text-3xl shadow-lg shadow-brand/30">
          {icon || "✨"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
            {activity ? "Edit activity" : "New activity"}
          </p>
          <p className="truncate font-display text-xl font-bold text-white">{name || "Your activity"}</p>
          <p className="text-[11px] text-white/45">
            {categories.length} {categories.length === 1 ? "category" : "categories"} · {themeCount} themes
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <span className={label}>Icon</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                name="icon"
                value={icon}
                onChange={(event) => setIcon(event.target.value)}
                maxLength={8}
                aria-label="Icon (an emoji)"
                className="w-14 rounded-xl bg-black/25 px-2 py-2 text-center text-xl outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent/60"
              />
              {QUICK_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  aria-label={`Use ${emoji}`}
                  className={`flex size-9 items-center justify-center rounded-xl text-lg transition ${
                    icon === emoji ? "bg-accent/25 ring-1 ring-accent" : "bg-white/[0.06] hover:bg-white/10"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className={label}>Name *</span>
            <input
              name="name"
              required
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Book Club"
              className={field}
            />
          </label>

          <label className="block">
            <span className={label}>Description *</span>
            <textarea
              name="description"
              required
              rows={3}
              maxLength={300}
              defaultValue={activity?.description}
              placeholder="What does the group do? What skills does it build?"
              className={`${field} resize-none`}
            />
          </label>

          <label className="block">
            <span className={label}>Formats *</span>
            <textarea
              name="formats"
              rows={3}
              defaultValue={activity?.formats.join("\n")}
              placeholder={"One per line, e.g.\nPairs\nSmall groups\nWhole group"}
              className={`${field} resize-none`}
            />
          </label>
        </div>

        {/* Les catégories de thèmes */}
        <div>
          <span className={label}>Themes, by category *</span>
          <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
            {categories.map((category, index) => (
              <div key={category.id} className="rounded-2xl bg-black/20 p-3 ring-1 ring-white/10">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-[11px] font-bold text-accent">
                    {index + 1}
                  </span>
                  <input
                    name="categoryName"
                    value={category.name}
                    onChange={(event) => updateCategory(category.id, { name: event.target.value })}
                    maxLength={40}
                    placeholder="Category name, e.g. Classics"
                    aria-label={`Category ${index + 1} name`}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white placeholder:text-white/30 outline-none"
                  />
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCategories((list) => list.filter((item) => item.id !== category.id))}
                      aria-label={`Remove category ${index + 1}`}
                      className="flex size-7 items-center justify-center rounded-full text-white/40 hover:bg-red-500/15 hover:text-red-300"
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  )}
                </div>
                <textarea
                  name="categoryTopics"
                  value={category.topics}
                  onChange={(event) => updateCategory(category.id, { topics: event.target.value })}
                  rows={4}
                  placeholder={"One theme per line, e.g.\nThe last book you loved\nA book everyone should read"}
                  aria-label={`Category ${index + 1} themes`}
                  className="w-full resize-y rounded-xl bg-black/25 px-3 py-2 text-xs leading-relaxed text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent/60"
                />
              </div>
            ))}
          </div>
          {categories.length < 8 && (
            <button
              type="button"
              onClick={() => {
                setCategories((list) => [...list, { id: nextId.current, name: "", topics: "" }]);
                nextId.current += 1;
              }}
              className="mt-3 w-full rounded-2xl border border-dashed border-white/20 py-2.5 text-xs font-semibold text-white/60 transition hover:border-accent/60 hover:text-white"
            >
              + Add a category
            </button>
          )}
        </div>
      </div>

      {state.error && (
        <p aria-live="polite" className="mt-4 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-full px-4 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="neu-btn flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-brand px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand/30 disabled:opacity-60"
        >
          <CheckIcon className="size-3.5" />
          {pending ? "Saving..." : activity ? "Save changes" : "Add the activity"}
        </button>
      </div>
    </form>
  );
}
