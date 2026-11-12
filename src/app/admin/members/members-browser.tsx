"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MemberAvatar } from "@/components/member-avatar";
import { ArrowIcon, SearchIcon, UsersIcon } from "../admin-icons";
import { DeleteMemberButton } from "./delete-member-button";
import { RoleStatus } from "./role-status";

export type AdminMemberRow = {
  id: string;
  name: string;
  firstName: string;
  email: string;
  level: string | null;
  place: string | null;
  completed: boolean;
  /** member | leader | teacher (confirmé par l admin) */
  role: string;
  /** Demande en attente : leader | teacher */
  roleRequest: string | null;
  hasPhoto: boolean;
  online: boolean;
  joined: string;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "online", label: "Online" },
  { key: "waiting", label: "Waiting" },
  { key: "leader", label: "Leaders" },
  { key: "teacher", label: "Teachers" },
  { key: "pending", label: "Not finished" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

/** Sans accents et en minuscules : "Loïc" se trouve en tapant "loic". */
function simplify(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function matchesFilter(member: AdminMemberRow, filter: FilterKey): boolean {
  if (filter === "online") return member.online;
  if (filter === "waiting") return Boolean(member.roleRequest);
  if (filter === "leader" || filter === "teacher") return member.role === filter;
  if (filter === "pending") return !member.completed;
  return true;
}

// La liste des membres côté admin : recherche instantanée + filtres.
export function MembersBrowser({ members }: { members: AdminMemberRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const shown = useMemo(() => {
    const needle = simplify(query.trim());
    return members.filter(
      (member) =>
        matchesFilter(member, filter) &&
        (!needle || simplify(`${member.name} ${member.email} ${member.place ?? ""}`).includes(needle)),
    );
  }, [members, query, filter]);

  return (
    <div className="anim-rise space-y-5" style={{ "--d": "100ms" } as React.CSSProperties}>
      {/* ----- Recherche + filtres ----- */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="neu-inset flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-accent/60">
          <SearchIcon className="size-5 shrink-0 text-white/45" />
          <span className="sr-only">Search a member</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email or city…"
            className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold text-white/50 hover:text-white"
            >
              Clear
            </button>
          )}
        </label>

        <div role="group" aria-label="Filter members" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:pb-0">
          {FILTERS.map((option) => {
            const count = members.filter((member) => matchesFilter(member, option.key)).length;
            const active = filter === option.key;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-r from-accent to-brand text-white shadow-lg shadow-brand/30"
                    : "neu-sm text-white/65 hover:text-white"
                }`}
              >
                {option.key === "online" && <span aria-hidden className="size-1.5 rounded-full bg-emerald-300" />}
                {option.label}
                <span className={`tabular-nums ${active ? "text-white/80" : "text-white/40"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ----- La liste ----- */}
      {shown.length === 0 ? (
        <div className="neu flex flex-col items-center rounded-3xl px-4 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10 text-white/60">
            <UsersIcon className="size-7" />
          </span>
          <p className="mt-3 font-semibold text-white">No member found</p>
          <p className="mt-1 text-sm text-white/50">Try another name or another filter.</p>
        </div>
      ) : (
        <div className="neu overflow-hidden rounded-3xl">
          {/* Les titres des colonnes (grand écran) */}
          <div className="hidden gap-4 border-b border-white/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 xl:grid xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
            <span>Member</span>
            <span>Level</span>
            <span>Location</span>
            <span>Status</span>
            <span className="w-40 text-right">Actions</span>
          </div>

          <ul className="divide-y divide-white/[0.07]">
            {shown.map((member) => (
              <li
                key={member.id}
                className={`group px-4 py-4 transition hover:bg-white/[0.04] sm:px-5 xl:grid xl:items-center xl:gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]`}
              >
                {/* Le membre + les boutons (sur téléphone, les boutons restent sur la même ligne) */}
                <div className="flex min-w-0 items-center gap-3 xl:contents">
                  <Link href={`/admin/members/${member.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="relative shrink-0">
                      <MemberAvatar userId={member.id} name={member.name} hasPhoto={member.hasPhoto} size="size-11" />
                      {member.online && (
                        <span
                          aria-label="Online"
                          className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-400 ring-[3px] ring-[#2a1238]"
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white group-hover:text-accent">
                        {member.name}
                      </span>
                      <span className="block truncate text-xs text-white/45">{member.email}</span>
                    </span>
                  </Link>

                  {/* Colonnes du grand écran */}
                  <span className="hidden text-xs xl:block">
                    {member.level ? (
                    <span className="rounded-full bg-[#6d72ff]/20 px-2.5 py-1 font-semibold text-[#c4c6ff]">
                      {member.level}
                    </span>
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                  </span>
                  <span className="hidden min-w-0 xl:block">
                    <span className="block truncate text-xs text-white/65">{member.place ?? "—"}</span>
                    <span className="block text-[11px] text-white/35">Joined {member.joined}</span>
                  </span>
                  <span className="hidden text-xs xl:block">
                    <RoleStatus userId={member.id} role={member.role} roleRequest={member.roleRequest} completed={member.completed} />
                  </span>

                  <span className="flex shrink-0 items-center justify-end gap-2 xl:w-40">
                    <DeleteMemberButton userId={member.id} name={member.firstName} compact />
                    <Link
                      href={`/admin/members/${member.id}`}
                      aria-label={`View ${member.name}`}
                      className="neu-sm neu-btn hidden size-9 items-center justify-center rounded-full text-white/70 hover:text-accent sm:flex"
                    >
                      <ArrowIcon />
                    </Link>
                  </span>
                </div>

                {/* Téléphone et tablette : les détails sous le nom */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-14 text-[11px] xl:hidden">
                  {member.level ? (
                    <span className="rounded-full bg-[#6d72ff]/20 px-2.5 py-1 font-semibold text-[#c4c6ff]">
                      {member.level}
                    </span>
                  ) : null}
                  <RoleStatus userId={member.id} role={member.role} roleRequest={member.roleRequest} completed={member.completed} />
                  {member.place && <span className="truncate text-white/45">· {member.place}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-xs text-white/35">
        Showing {shown.length} of {members.length}
      </p>
    </div>
  );
}
