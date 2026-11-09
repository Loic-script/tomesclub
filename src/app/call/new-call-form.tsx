"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import type { Member } from "@/lib/calls";
import { startCall, type StartCallState } from "./actions";

const initialState: StartCallState = { error: null };

export function NewCallForm({ members }: { members: Member[] }) {
  const [state, formAction, pending] = useActionState(startCall, initialState);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (members.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        No other members yet. Ask your friends to create an account first!
      </p>
    );
  }

  const query = search.trim().toLowerCase();
  const isVisible = (member: Member) => !query || member.name.toLowerCase().includes(query);
  const visibleCount = members.filter(isVisible).length;

  // On envoie le formulaire nous-mêmes (au lieu de <form action>) :
  // sinon React vide le formulaire après une erreur et les cases cochées disparaissent.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  function toggle(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search a member..."
        aria-label="Search a member"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />

      {/* Les membres cachés par la recherche restent dans le formulaire (classe "hidden"). */}
      <ul className="max-h-80 divide-y divide-zinc-100 overflow-y-auto rounded-lg border border-zinc-200">
        {members.map((member) => (
          <li key={member.id} className={isVisible(member) ? undefined : "hidden"}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition hover:bg-cream/60">
              <input
                type="checkbox"
                name="userIds"
                value={member.id}
                checked={selected.has(member.id)}
                onChange={() => toggle(member.id)}
                className="size-4 accent-brand"
              />
              <Avatar name={member.name} />
              <span className="truncate font-medium text-zinc-900">{member.name}</span>
            </label>
          </li>
        ))}
        {visibleCount === 0 && <li className="px-3 py-4 text-sm text-zinc-500">No member found.</li>}
      </ul>

      <p aria-live="polite" className="min-h-5 text-sm text-red-600">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending || selected.size === 0}
        className="w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? "Starting the call..."
          : selected.size === 0
            ? "Choose people to call"
            : `Start video call (${selected.size})`}
      </button>
    </form>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white"
    >
      {initials || "?"}
    </span>
  );
}
