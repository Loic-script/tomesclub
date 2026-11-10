"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { FollowButton } from "@/components/follow-button";
import { MemberAvatar } from "@/components/member-avatar";

export type SideMember = {
  id: string;
  firstName: string;
  lastName: string;
  englishLevel: string | null;
  country: string | null;
  hasPhoto: boolean;
  online: boolean;
  following: boolean;
  followsMe: boolean;
};

/** Pour chercher sans tenir compte des majuscules ni des accents. */
const simplify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// Tous les membres du panneau de droite, avec la barre de recherche par nom.
export function SideMembersList({ members }: { members: SideMember[] }) {
  const [query, setQuery] = useState("");
  const wanted = simplify(query);
  const shown = wanted
    ? members.filter((member) => simplify(`${member.firstName} ${member.lastName}`).includes(wanted))
    : members;

  if (members.length === 0) {
    return <p className="py-6 text-center text-sm text-white/55">No other members yet.</p>;
  }

  return (
    <>
      {/* La barre de recherche */}
      <div className="relative mb-3">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45"
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
          placeholder="Search a member"
          aria-label="Search a member by name"
          className="neu-inset w-full rounded-full py-2 pl-9 pr-9 text-sm text-white outline-none transition placeholder:text-white/40 focus:ring-2 focus:ring-accent/50 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear the search"
            className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>

      <p aria-live="polite" className="mb-2 px-1 text-[11px] text-white/45">
        {wanted
          ? `${shown.length} ${shown.length === 1 ? "member" : "members"} found`
          : `${members.length} ${members.length === 1 ? "member" : "members"}`}
      </p>

      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/55">
          No member called &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <ul className="-mr-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
          {shown.map((member, index) => (
            <li
              key={member.id}
              className="anim-rise"
              style={{ "--d": `${Math.min(index, 8) * 40}ms` } as CSSProperties}
            >
              <div className="neu-sm flex items-center gap-2.5 rounded-2xl p-2">
                {/* La photo + le point vert, cliquables : ça ouvre la fiche */}
                <Link
                  href={`/members/${member.id}`}
                  aria-label={`See the profile of ${member.firstName}`}
                  className="relative shrink-0 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <MemberAvatar
                    userId={member.id}
                    name={`${member.firstName} ${member.lastName}`}
                    hasPhoto={member.hasPhoto}
                    size="size-10"
                  />
                  <span
                    aria-label={member.online ? "Online" : "Offline"}
                    className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#2b1538] ${
                      member.online ? "bg-emerald-400" : "bg-white/30"
                    }`}
                  />
                </Link>

                <Link href={`/members/${member.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">
                    {member.firstName} {member.lastName}
                  </span>
                  <span className="block truncate text-[11px] text-white/50">
                    {member.online ? "Online now" : (member.country ?? member.englishLevel ?? "Member")}
                  </span>
                </Link>

                <FollowButton
                  memberId={member.id}
                  following={member.following}
                  followsMe={member.followsMe}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
