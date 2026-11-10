"use client";

import { useState } from "react";
import { MembersCallList, type CallListMember } from "./members-call-list";

/** Pour chercher sans tenir compte des majuscules ni des accents. */
const simplify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// Tous les membres, avec une barre de recherche par nom.
export function MembersSearch({ members }: { members: CallListMember[] }) {
  const [query, setQuery] = useState("");
  const wanted = simplify(query);
  const shown = wanted
    ? members.filter((member) =>
        simplify(`${member.firstName} ${member.lastName}`).includes(wanted),
      )
    : members;

  return (
    <div>
      <div className="relative mt-3">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/45"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a member by name"
          aria-label="Search a member by name"
          className="neu-inset w-full rounded-full py-2.5 pl-10 pr-10 text-sm text-white outline-none transition placeholder:text-white/40 focus:ring-2 focus:ring-accent/50 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear the search"
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>

      <p aria-live="polite" className="mt-2 text-xs text-white/50">
        {wanted
          ? `${shown.length} ${shown.length === 1 ? "member" : "members"} found`
          : `${members.length} ${members.length === 1 ? "member" : "members"}`}
      </p>

      <MembersCallList
        members={shown}
        emptyText={wanted ? `No member called "${query.trim()}".` : undefined}
      />
    </div>
  );
}
