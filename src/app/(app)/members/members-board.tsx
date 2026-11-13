"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { Flag } from "@/components/flag";
import { FollowButton } from "@/components/follow-button";
import { MemberAvatar } from "@/components/member-avatar";
import type { MemberCard } from "@/lib/members";

// La page Members sur ordinateur : un tableau en colonnes (une par niveau d'anglais),
// avec des cartes 3D qui s'inclinent sous la souris. Sur téléphone, c'est la liste simple.

const COLUMNS = [
  { key: "beginner", label: "Beginner", dot: "bg-emerald-400", glow: "from-emerald-400/25" },
  { key: "elementary", label: "Elementary", dot: "bg-indigo-400", glow: "from-indigo-400/25" },
  { key: "intermediate", label: "Intermediate", dot: "bg-accent", glow: "from-accent/25" },
  { key: "advanced", label: "Advanced", dot: "bg-rose-400", glow: "from-rose-400/25" },
  { key: "none", label: "No level yet", dot: "bg-white/40", glow: "from-white/15" },
] as const;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "online", label: "Online" },
  { key: "following", label: "Following" },
  { key: "followers", label: "Follows you" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

/** Pour chercher sans tenir compte des majuscules ni des accents. */
const simplify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

function levelKey(level: string | null): string {
  const value = (level ?? "").toLowerCase();
  return COLUMNS.some((column) => column.key === value) ? value : "none";
}

function matches(member: MemberCard, filter: FilterKey): boolean {
  if (filter === "online") return member.online;
  if (filter === "following") return member.following;
  if (filter === "followers") return member.followsMe;
  return true;
}

export function MembersBoard({ members }: { members: MemberCard[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  // Tant que ce tableau est affiché, la page porte la marque "members-page" (voir globals.css) :
  // le calendrier et le panneau Members se cachent. On quitte la page → la marque part.
  // (Pas de règle CSS sur le tableau lui-même : Next.js garde la page quittée cachée dans le document.)
  useEffect(() => {
    document.documentElement.classList.add("members-page");
    return () => document.documentElement.classList.remove("members-page");
  }, []);
  const wanted = simplify(query);
  const onlineCount = members.filter((member) => member.online).length;
  const shown = members.filter(
    (member) =>
      matches(member, filter) && (!wanted || simplify(`${member.firstName} ${member.lastName}`).includes(wanted)),
  );

  return (
    <section aria-label="Members" className="anim-rise">
      {/* ----- La barre d'outils ----- */}
      <header className="mb-7 flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="mr-auto">
          <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            <span aria-hidden className="h-px w-5 rounded-full bg-accent/70" />
            Community
          </p>
          <h1 className="font-display text-[2.5rem] font-extrabold leading-none tracking-[-0.03em] text-white">
            Members
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white/60">
            {members.length} {members.length === 1 ? "member" : "members"}
            <span aria-hidden className="text-white/25">·</span>
            <span className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${onlineCount > 0 ? "bg-emerald-400" : "bg-white/30"}`} />
              {onlineCount} online
            </span>
          </p>
        </div>

        {/* Recherche */}
        <label className="neu-inset flex w-72 items-center gap-2 rounded-full px-4 py-2.5">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a member"
            aria-label="Search a member by name"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40 [&::-webkit-search-cancel-button]:hidden"
          />
        </label>

        {/* Filtres */}
        <div role="group" aria-label="Filter members" className="neu-inset flex gap-1 rounded-full p-1">
          {FILTERS.map((option) => {
            const count = members.filter((member) => matches(member, option.key)).length;
            const active = filter === option.key;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-r from-accent to-brand text-white shadow-lg shadow-brand/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {option.label}
                <span className={active ? "text-white/80" : "text-white/35"}>{count}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ----- Les colonnes (une par niveau) ----- */}
      <div className="grid auto-cols-[minmax(13rem,1fr)] grid-flow-col gap-5 overflow-x-auto pb-6 [scrollbar-width:thin]">
        {COLUMNS.map((column, columnIndex) => {
          const people = shown.filter((member) => levelKey(member.englishLevel) === column.key);
          return (
            <div key={column.key} className="flex min-w-0 flex-col gap-3.5">
              <div
                className={`flex items-center gap-2.5 rounded-2xl bg-gradient-to-r ${column.glow} to-transparent px-3.5 py-3 ring-1 ring-white/10`}
              >
                <span aria-hidden className={`size-2.5 rounded-full ${column.dot} shadow-[0_0_10px_currentColor]`} />
                <h2 className="font-display text-sm font-bold text-white">{column.label}</h2>
                <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white/75">
                  {people.length}
                </span>
              </div>

              {people.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-white/15 px-4 py-10 text-center text-xs text-white/40">
                  No member here
                </p>
              ) : (
                people.map((member, index) => (
                  <MemberTile key={member.id} member={member} delayMs={(columnIndex + index) * 60} />
                ))
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Une carte membre en 3D. */
function MemberTile({ member, delayMs }: { member: MemberCard; delayMs: number }) {
  const fullName = `${member.firstName} ${member.lastName}`;
  const role = member.role === "leader" ? "Leader" : member.role === "teacher" ? "Teacher" : "Member";
  const place = [member.city, member.country].filter(Boolean).join(", ");

  return (
    <Card3D style={{ "--d": `${delayMs}ms` } as CSSProperties}>
      <div className="card3d-lift flex items-start gap-3">
        <Link
          href={`/members/${member.id}`}
          aria-label={`See the profile of ${member.firstName}`}
          className={`relative shrink-0 rounded-full p-0.5 ${
            member.online ? "bg-gradient-to-br from-emerald-300 to-emerald-500" : "bg-white/15"
          }`}
        >
          <MemberAvatar userId={member.id} name={fullName} hasPhoto={member.hasPhoto} size="size-14" />
          <span
            aria-label={member.online ? "Online" : "Offline"}
            className={`absolute bottom-0.5 right-0.5 size-3.5 rounded-full border-2 border-[#2a1238] ${
              member.online ? "bg-emerald-400" : "bg-white/40"
            }`}
          />
        </Link>
        <div className="min-w-0 flex-1 pt-1">
          <Link
            href={`/members/${member.id}`}
            className="block truncate font-display text-[15px] font-bold leading-tight text-white hover:text-accent"
          >
            {fullName}
          </Link>
          <span
            className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              role === "Member" ? "bg-white/10 text-white/70" : "bg-accent/20 text-accent"
            }`}
          >
            {role}
          </span>
        </div>
      </div>

      <dl className="card3d-lift-sm mt-4 space-y-2 border-t border-white/10 pt-3.5 text-xs">
        <Row label="From">
          {member.country ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <Flag country={member.country} className="h-3 w-4" />
              <span className="truncate">{place}</span>
            </span>
          ) : (
            <span className="text-white/40">Not shared</span>
          )}
        </Row>
        <Row label="Status">
          <span className={member.online ? "font-semibold text-emerald-300" : "text-white/55"}>
            {member.online ? "Online now" : "Offline"}
          </span>
        </Row>
        {(member.followsMe || member.following) && (
          <Row label="You">
            <span className="text-white/75">
              {member.following && member.followsMe
                ? "Friends"
                : member.followsMe
                  ? "Follows you"
                  : "You follow"}
            </span>
          </Row>
        )}
      </dl>

      <div className="card3d-lift mt-4 flex items-center gap-2">
        <FollowButton memberId={member.id} following={member.following} followsMe={member.followsMe} />
        <Link
          href={`/members/${member.id}`}
          className="neu-sm neu-btn ml-auto flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/85 hover:text-white"
        >
          View profile
          <span aria-hidden>→</span>
        </Link>
      </div>
    </Card3D>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <dt className="w-12 shrink-0 text-white/40">{label}</dt>
      <dd className="min-w-0 flex-1 text-white/80">{children}</dd>
    </div>
  );
}

/**
 * La carte qui s'incline vers la souris (effet 3D) avec un reflet de lumière.
 * Au toucher (téléphone) ou si l'utilisateur préfère moins d'animations : carte à plat.
 */
function Card3D({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const ref = useRef<HTMLElement>(null);

  function move(event: PointerEvent<HTMLElement>) {
    const card = ref.current;
    if (!card || event.pointerType !== "mouse") return;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    card.style.setProperty("--rx", `${((0.5 - y) * 10).toFixed(2)}deg`);
    card.style.setProperty("--ry", `${((x - 0.5) * 12).toFixed(2)}deg`);
    card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
  }

  function leave() {
    const card = ref.current;
    if (!card) return;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  }

  return (
    // L'animation d'arrivée est sur l'enveloppe : elle utilise aussi "transform" et bloquerait l'inclinaison.
    <div className="anim-rise" style={style}>
      <article ref={ref} onPointerMove={move} onPointerLeave={leave} className="card3d rounded-3xl p-4">
        {children}
        <span aria-hidden className="card3d-sheen" />
      </article>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 shrink-0 text-white/45"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
