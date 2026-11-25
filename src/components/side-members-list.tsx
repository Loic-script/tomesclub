"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { FollowButton } from "@/components/follow-button";
import { MemberAvatar } from "@/components/member-avatar";
import { ENGLISH_LEVELS } from "@/lib/onboarding-options";

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
export function SideMembersList({
  members,
  showOnline = false,
  grid = false,
  feed = false,
}: {
  members: SideMember[];
  /** Affiche "● N online" à côté du nombre de membres. */
  showOnline?: boolean;
  /** Page Members : sur ordinateur, des lignes plus grandes (photo, nom, Follow). */
  grid?: boolean;
  /** Page Members sur téléphone : grandes photos, et un grand bouton Follow sous le nom. */
  feed?: boolean;
}) {
  const [query, setQuery] = useState("");
  // Page Members : les filtres (qui ? et quel niveau ?)
  const [who, setWho] = useState<Who>("all");
  const [level, setLevel] = useState<string>("all");
  const wanted = simplify(query);
  const shown = members.filter(
    (member) =>
      (!wanted || simplify(`${member.firstName} ${member.lastName}`).includes(wanted)) &&
      (!feed || WHO_TEST[who](member)) &&
      (!feed || level === "all" || (level === "none" ? !member.englishLevel : member.englishLevel === level)),
  );
  const filtering = Boolean(wanted) || (feed && (who !== "all" || level !== "all"));

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

      {/* Page Members : les filtres */}
      {feed && (
        <div className="mb-3 space-y-2">
          <FilterRow label="Show">
            {WHO_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                active={who === option.value}
                onClick={() => setWho(option.value)}
                count={members.filter(WHO_TEST[option.value]).length}
              >
                {option.label}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="Level">
            <Chip active={level === "all"} onClick={() => setLevel("all")}>
              All levels
            </Chip>
            {ENGLISH_LEVELS.map((option) => (
              <Chip
                key={option.value}
                active={level === option.value}
                onClick={() => setLevel(option.value)}
                count={members.filter((member) => member.englishLevel === option.value).length}
              >
                {option.label}
              </Chip>
            ))}
            <Chip active={level === "none"} onClick={() => setLevel("none")}>
              No level
            </Chip>
          </FilterRow>
        </div>
      )}

      <div className="mb-2 flex items-center gap-2 px-1">
        <p aria-live="polite" className="text-[11px] text-white/60">
          {filtering
            ? `${shown.length} ${shown.length === 1 ? "member" : "members"} found`
            : `${members.length} ${members.length === 1 ? "member" : "members"}`}
        </p>
        {/* Les membres connectés maintenant (page Members sur téléphone) */}
        {showOnline && <OnlineChip count={members.filter((member) => member.online).length} />}
      </div>

      {shown.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-white/55">
            {wanted ? <>No member called &ldquo;{query.trim()}&rdquo;.</> : "No member matches these filters."}
          </p>
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setWho("all");
                setLevel("all");
              }}
              className="mt-3 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              Clear the filters
            </button>
          )}
        </div>
      ) : (
        <ul
          className={
            grid
              ? // Page Members : la liste, un peu plus grande sur ordinateur
                "space-y-2 lg:space-y-2.5"
              : "-mr-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-2"
          }
        >
          {shown.map((member, index) =>
            feed ? (
              <li
                key={member.id}
                className="anim-rise"
                style={{ "--d": `${Math.min(index, 8) * 40}ms` } as CSSProperties}
              >
                <FeedRow member={member} />
              </li>
            ) : (
            <li
              key={member.id}
              className="anim-rise"
              style={{ "--d": `${Math.min(index, 8) * 40}ms` } as CSSProperties}
            >
              <div
                className={`neu-sm flex items-center gap-2.5 rounded-2xl p-2 ${
                  grid ? "lg:gap-4 lg:rounded-3xl lg:p-3 lg:pr-4" : ""
                }`}
              >
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
                    size={grid ? "size-10 lg:size-12" : "size-10"}
                  />
                  <span
                    aria-label={member.online ? "Online" : "Offline"}
                    className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#2b1538] ${
                      member.online ? "bg-emerald-400" : "bg-white/30"
                    } ${grid ? "lg:size-3.5" : ""}`}
                  />
                </Link>

                <Link href={`/members/${member.id}`} className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-semibold text-white">
                    {member.firstName} {member.lastName}
                  </span>
                  <span className="block break-words text-[11px] text-white/50">
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
            ),
          )}
        </ul>
      )}
    </>
  );
}

type Who = "all" | "online" | "following" | "followsMe";

const WHO_OPTIONS: { value: Who; label: string }[] = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "following", label: "Following" },
  { value: "followsMe", label: "Follows you" },
];

const WHO_TEST: Record<Who, (member: SideMember) => boolean> = {
  all: () => true,
  online: (member) => member.online,
  following: (member) => member.following,
  followsMe: (member) => member.followsMe,
};

/** Une ligne de filtres qui défile sur le côté si elle est trop longue. */
function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">{label}</span>
      <div className="-mr-4 flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}

/** Un filtre : pilule claire quand il est choisi. */
function Chip({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-gradient-to-r from-accent to-brand text-white shadow-md shadow-black/20"
          : "bg-white/[0.07] text-white/70 ring-1 ring-white/10 hover:bg-white/[0.12] hover:text-white"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`tabular-nums ${active ? "text-white/85" : "text-white/40"}`}>{count}</span>
      )}
    </button>
  );
}

/**
 * Une ligne de la page Members, comme une liste d'amis :
 * grande photo à gauche, le nom, « en ligne » ou le pays · niveau, puis un grand bouton Follow.
 */
function FeedRow({ member }: { member: SideMember }) {
  const name = `${member.firstName} ${member.lastName}`;
  const details = [member.country, member.englishLevel].filter(Boolean).join(" · ");
  return (
    <div className="flex items-center gap-4 py-2.5">
      <Link
        href={`/members/${member.id}`}
        aria-label={`See the profile of ${member.firstName}`}
        className="relative shrink-0 transition-transform duration-200 active:scale-95"
      >
        <span className="block rounded-full bg-gradient-to-br from-accent/80 to-brand p-[2px]">
          <MemberAvatar userId={member.id} name={name} hasPhoto={member.hasPhoto} size="size-[4.5rem]" />
        </span>
        <span
          aria-label={member.online ? "Online" : "Offline"}
          className={`absolute bottom-1 right-1 size-3.5 rounded-full border-2 border-[#2b1538] ${
            member.online ? "bg-emerald-400" : "bg-white/30"
          }`}
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/members/${member.id}`} className="block">
          <span className="block break-words text-[15px] font-semibold leading-snug text-white">{name}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-white/55">
            {member.online ? (
              <span className="font-semibold text-emerald-300">Online now</span>
            ) : (
              <span>{details || "Member"}</span>
            )}
            {member.followsMe && !member.following && <span className="font-semibold text-accent">· Follows you</span>}
          </span>
        </Link>
        <div className="mt-2 max-w-[15rem]">
          <FollowButton memberId={member.id} following={member.following} followsMe={member.followsMe} size="wide" />
        </div>
      </div>
    </div>
  );
}

/** "● 2 online" : point vert qui pulse quand quelqu'un est connecté. */
function OnlineChip({ count }: { count: number }) {
  return (
    <span className="ml-auto flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-white/85">
      <span className="relative flex size-2">
        {count > 0 && <span aria-hidden className="anim-ping absolute inset-0 rounded-full bg-emerald-400/70" />}
        <span className={`relative size-2 rounded-full ${count > 0 ? "bg-emerald-400" : "bg-white/35"}`} />
      </span>
      {count} online
    </span>
  );
}
